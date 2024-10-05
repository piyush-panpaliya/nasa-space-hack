from flask import Flask, request, jsonify
import math
import requests
from datetime import datetime, timezone, timedelta
import math
from getNDVI import mainNVDI
from req import createQueue, update
import threading


def calculate_extra_energy(E0, d):
  E_extra = E0 * (1 + 0.033 * math.cos(2 * math.pi * d / 365))
  return E_extra


def convert_watt_to_mj(E_extra):
  return E_extra * 0.0864


def calculate_Rs_hargreaves(E_extra_mj, T_max, T_min):
  Rs = 0.16 * math.sqrt(T_max - T_min) * E_extra_mj
  return Rs


def calculate_Rso(Ra, elevation):
  Rso = (0.75 + 2 * 10**-5 * elevation) * Ra
  return Rso


def calculate_Rns(Rs, albedo=0.23):
  Rns = (1 - albedo) * Rs
  return Rns


def calculate_esat(temperature):
  esat = 6.11 * math.exp((7.5 * temperature) / (temperature + 237.3))
  return esat


def calculate_ea(dew_point):
  ea = 6.11 * math.exp((7.5 * dew_point) / (dew_point + 237.3))
  return ea


def calculate_RH(temperature, dew_point):
  esat = calculate_esat(temperature)  # Calculate esat for air temperature
  ea = calculate_ea(dew_point)        # Calculate ea for dew point
  RH = (ea / esat) * 100  # Convert to percentage
  return RH


def calculate_Rnl(T_max, T_min, ea, Rso, sigma):
  T_max_K = T_max + 273.15
  T_min_K = T_min + 273.15

  Rnl = sigma * ((T_max_K**4 + T_min_K**4) / 2) * (1 - 0.00115 * ea) - Rso
  return Rnl


def calculate_psychrometric_constant_v2(P, L):
  gamma = (0.665 * 10**-3 * P) / L
  return gamma


def calculate_Rn(R_ns, R_nl):
  R_n = R_ns - R_nl
  return R_n


def slope_of_vapor_pressure_curve(T, es):
  delta = (4098 * es) / ((T + 237.3) ** 2)
  return delta


def vapor_pressure_deficit(es, ea):
  deficit = es - ea
  return deficit


def calculate_eto(Rn, G, T, u2, es, ea, delta, gamma):
  numerator = (0.408 * delta * (Rn - G)) + \
      (gamma * (900 / (T + 273)) * u2 * (es - ea))
  denominator = delta + gamma * (1 + 0.34 * u2)
  ETo = numerator / denominator
  return ETo


def calculate_et_c(etf, ndvi):
  KcNDVI = 1.457 * ndvi - 0.1725
  ETc = etf * KcNDVI
  return ETc


def calculate_pressure_from_altitude(h):
  P0 = 101.325  # Sea-level standard atmospheric pressure in kPa
  L = 0.0065  # Temperature lapse rate in °C/m
  T0 = 288.15  # Sea-level standard temperature in Kelvin
  g = 9.80665  # Gravitational acceleration in m/s^2
  M = 0.0289644  # Molar mass of Earth's air in kg/mol
  R = 8.31447  # Universal gas constant in J/(mol·K)

  # Calculate pressure at altitude
  exponent = (g * M) / (R * L)
  pressure = P0 * (1 - (L * h) / T0) ** exponent

  return pressure


def calculate_water_to_spray(ETc, field_area, irrigation_efficiency, precipitation):
  """
  Calculate the total amount of water to spray on the field, considering rainfall.

  Args:
      ETc (float): Actual Crop Evapotranspiration (in mm/day).
      field_area (float): The field area in square meters (m²).
      irrigation_efficiency (float): Efficiency of the irrigation system (e.g., 0.8 for 80%).
      precipitation (float): Daily rainfall (in mm).

  Returns:
      float: The total amount of water needed in liters (L).
  """
  # Adjust ETc by subtracting effective rainfall
  # Ensure no negative water requirement
  effective_ETc = max(ETc - precipitation, 0)

  # Convert ETc from mm to meters
  effective_ETc_meters = effective_ETc / 1000

  # Calculate total water volume needed in cubic meters
  total_water_needed = effective_ETc_meters * field_area

  # Adjust for irrigation system efficiency
  water_to_spray_m3 = total_water_needed / irrigation_efficiency

  # Convert cubic meters to liters
  water_to_spray_liters = water_to_spray_m3 * 1000

  return water_to_spray_liters


def getFire(lat, lng, d):
  jsonData = mainNVDI(d, lat, lng, 'MOD14A2.061', 'FireMask')
  print(jsonData)
  return int(float(jsonData[0]['MOD14A2_061_FireMask']))


def getNDVI(lat, lng, d):
  jsonData = mainNVDI(d, lat, lng, 'MOD13Q1.061', '_250m_16_days_NDVI')
  print(jsonData)
  return float(jsonData[0]['MOD13Q1_061__250m_16_days_NDVI'])


def getWeather2(lat, lng):
  r = requests.get(f'https://www.meteosource.com/api/v1/free/point?lat={lat}&lon={
                   lng}&sections=daily&timezone=UTC&language=en&units=metric&key=ifs7mzgitstja9kjgnn59cqzsa7ph3yaov0qp0tp')
  data = r.json()
  elevation = data['elevation']
  return elevation, data['daily']['data'][0]['all_day']['wind']['speed'], data['daily']['data'][0]['all_day']['precipitation']['total'],


def getWeather1(lat, lng):
  r = requests.get(
    f'https://api.weatherapi.com/v1/forecast.json?key=27eddbfde1a441db8ae54029240510&days=1&hour=17&q={lat},{lng}')
  data = r.json()
  print(data)
  f = data['forecast']['forecastday'][0]
  dayF = f['day']
  return dayF['maxtemp_c'], dayF['mintemp_c'], dayF['maxtemp_c'], f['hour'][0]['dewpoint_c']


def getWeather(lat, lng):
  T_max, T_min, temperature, dew_point = getWeather1(lat, lng)
  elevation, windspeed, precipitation = getWeather2(lat, lng)
  print(T_min, T_max, temperature, dew_point)
  P = calculate_pressure_from_altitude(elevation)

  return T_min, T_max, elevation, temperature, dew_point, windspeed, P, precipitation


def ok(lat, lng):
  india_timezone = timezone(timedelta(hours=5, minutes=30))
  today = datetime.now(india_timezone)
  d = today.timetuple().tm_yday

  sigma = 4.903e-9  # CONST
  L = 2.45      # Latent heat of vaporization in MJ/kg CONST
  G = 0  # const
  E0 = 1367
  T_min, T_max, elevation, temperature, dew_point, windspeed, P, precipitation = getWeather(
    lat, lng)
  NDVI = getNDVI(lat, lng, today)
  FIRE = getFire(lat, lng, today)

  E_extra = calculate_extra_energy(E0, d)
  E_extra_mj = convert_watt_to_mj(E_extra)
  Ra = E_extra_mj

  Rs = calculate_Rs_hargreaves(E_extra_mj, T_max, T_min)

  Rns = calculate_Rns(Rs)

  RH = calculate_RH(temperature, dew_point)
  ea = calculate_ea(dew_point)
  Rso = calculate_Rso(Ra, elevation)

  Rnl = calculate_Rnl(T_max, T_min, ea, Rso, sigma)
  R_n = calculate_Rn(Rns, Rnl)

  gamma = calculate_psychrometric_constant_v2(P, L)
  esat = calculate_esat(temperature)
  delta = slope_of_vapor_pressure_curve(temperature, esat)

  vap_pressure_def = vapor_pressure_deficit(esat, ea)

  ETo = calculate_eto(R_n, G, temperature, windspeed, esat, ea, delta, gamma)

  ETf = ETo
  ETc = calculate_et_c(ETf, NDVI)
  field_area = 10000
  irrigation_efficiency = 0.8
  water_needed_liters = calculate_water_to_spray(
      ETc, field_area, irrigation_efficiency, precipitation)

  return water_needed_liters, NDVI, FIRE


app = Flask(__name__)


def background_task(lat, lng, res):
  water_needed_liters, NDVI, FIRE = ok(lat, lng)
  update(res['id'], {
      'fire': FIRE,
      'health': NDVI,
      'water': water_needed_liters,
      'status': 'done'
  })


@app.route('/calculate', methods=['GET'])
def calculate():
  lat = int(request.args.get('lat', type=float))
  lng = int(request.args.get('lng', type=float))

  if lat is None or lng is None:
    return jsonify({"error": "Please provide both latitude and longitude as query parameters."}), 400
  res = createQueue(lng, lat)
  threading.Thread(target=background_task, args=(lat, lng, res)).start()
  return jsonify({'status': 'ok'})


if __name__ == '__main__':
  app.run(debug=True)
