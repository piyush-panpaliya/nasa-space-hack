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
    response = requests.post(url, json=data)
    if response.status_code == 200:
      return response.json()
    else:
      return {'error': f"Failed with status code {response.status_code}: {response.text}"}
  except requests.exceptions.RequestException as e:
    return {'error': f"Request failed: {e}"}


# Example usage:
# response = make_api_call(recordsid='123456789012345',
    #  gid='example_gid', long=12.3456, lat=34.5678)
