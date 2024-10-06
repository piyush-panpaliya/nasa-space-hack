import requests


def createQueue(long, lat):
  url = 'http://localhost:8090/api/collections/queues/records'
  data = {
    'status': 'queued',
    "long": long,
    "lat": lat,
  }
  try:
    response = requests.post(url, json=data)
    if response.status_code == 200:
      return response.json()
    else:
      return {'error': f"Failed with status code {response.status_code}: {response.text}"}
  except requests.exceptions.RequestException as e:
    return {'error': f"Request failed: {e}"}


def update(id, data):
  url = f'http://localhost:8090/api/collections/queues/records/{id}'
  try:
    response = requests.patch(url, json=data)
    if response.status_code == 200:
      return response.json()
    else:
      return {'error': f"Failed with status code {response.status_code}: {response.text}"}
  except requests.exceptions.RequestException as e:
    return {'error': f"Request failed: {e}"}


def makeLLM(water, fire, ndvi, lat, lng):
  url = 'http://localhost:11434/api/generate'
  data = {
      "model": "llama3.2:1b",
      "stream": False,
      "prompt": f"You are an agricultural advisor tasked with providing guidance to a farmer based on the following information:NDVI Value: The calculated Normalized Difference Vegetation Index (NDVI) for the farm's crops is {ndvi}. NDVI indicates the health and vigor of vegetation, where values closer to +1 represent healthier crops, and values near 0 or negative indicate poor vegetation or barren land.Water Irrigation: The calculated amount of water needed for irrigation in this area is {water} liters per hectare. The region has been assessed for its water requirements based on soil type, crop growth stage, and weather conditions.Fire Mask Pixel Classes: The area has been analyzed for potential fire hazards or other environmental conditions,value for this is {fire} with pixels classified as follows:0: Not processed (missing input data).1: Not processed (obsolete).2: Not processed (other reasons).3: Non-fire water pixel.4: Cloud (land or water).5: Non-fire land pixel.6: Unknown (land or water).7: Fire (low confidence).8: Fire (nominal confidence).9: Fire (high confidence).Farm Location: The farm is located at latitude {lat} and longitude {lng}.Your task:Based on the above inputs, provide advice to the farmer on:Crop health based on the NDVI value.The recommended amount of water for irrigation, explaining why this is suitable for the current conditions.Any potential fire hazards or environmental risks using the Fire Mask Pixel Classifications, and what precautions the farmer should take.Any location-specific advice to optimize farming practices. KEEP IT 100 WORDS OR LESS. advice:",
  }
  try:
    response = requests.post(url, json=data)
    if response.status_code == 200:
      return response.json()
    else:
      return {'error': f"Failed with status code {response.status_code}: {response.text}"}
  except requests.exceptions.RequestException as e:
    return {'error': f"Request failed: {e}"}
