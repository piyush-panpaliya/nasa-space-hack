import requests
import time
import os
import datetime
import math
import random
import csv
import io

BASE_URL = "https://appeears.earthdatacloud.nasa.gov/api"

USERNAME = "pshvaiii"
PASSWORD = "LmaoBhai@2005"

# PRODUCT = "MOD13Q1.061"
# LAYER = "_250m_16_days_NDVI"
# PRODUCT = "MOD14A2.061"
# LAYER = "FireMask"

TASK_TYPE = "point"
TASK_NAME = str(math.floor(random.random() * 1000000))


def authenticate():
  auth_url = f"{BASE_URL}/login"
  response = requests.post(auth_url, auth=(
      USERNAME, PASSWORD), headers={"Content-Length": "0"})

  if response.status_code == 200:
    token = response.json()["token"]
    print("Authentication successful. Token received.")
    return token
  else:
    print(f"Authentication failed: {
          response.status_code}, {response.text}")
    return None


def queue_task(token, PRODUCT, LAYER, START_DATE, END_DATE, COORDINATES):
  task_url = f"{BASE_URL}/task"
  headers = {
      "Content-Type": "application/json",
      "Authorization": f"Bearer {token}"
  }
  task_data = {
      "task_type": TASK_TYPE,
      "task_name": TASK_NAME,
      "params": {
          "dates": [{"startDate": START_DATE, "endDate": END_DATE}],
          "layers": [{"product": PRODUCT, "layer": LAYER}],
          "coordinates": [COORDINATES]
      }
  }

  response = requests.post(task_url, headers=headers, json=task_data)

  if 200 <= response.status_code < 300:
    task_id = response.json()["task_id"]
    print(f"Task queued successfully. Task ID: {task_id}")
    return task_id
  else:
    print(f"Failed to queue task: {response.status_code}, {response.text}")
    return None


def check_task_status(token, task_id):
  task_status_url = f"{BASE_URL}/task/{task_id}"
  headers = {
      "Authorization": f"Bearer {token}"
  }

  while True:
    response = requests.get(task_status_url, headers=headers)
    if response.status_code == 200:
      status = response.json()["status"]
      print(f"Task status: {status}")
      if status == "done":
        print("Task is done.")
        return True
      elif status == "error":
        print("Task encountered an error.")
        return False
    else:
      print(f"Failed to get task status: {
            response.status_code}, {response.text}")
      return False
    time.sleep(10)  # Wait for 30 seconds before checking again


def list_files(token, task_id):
  bundle_url = f"{BASE_URL}/bundle/{task_id}"
  headers = {
      "Authorization": f"Bearer {token}"
  }

  response = requests.get(bundle_url, headers=headers)
  if response.status_code == 200:
    files = response.json()["files"]
    print(f"Found {len(files)} files.")
    return files
  else:
    print(f"Failed to list files: {response.status_code}, {response.text}")
    return []


def download_files(token, files, task_id):
  headers = {
      "Authorization": f"Bearer {token}"
  }

  for file_info in files:
    if '.csv' not in file_info["file_name"]:
      continue
    file_id = file_info["file_id"]
    download_url = f"{BASE_URL}/bundle/{task_id}/{file_id}"
    response = requests.get(download_url, headers=headers, stream=True)

    if response.status_code == 200:
      csvData = response.content.decode('utf-8')  # Decode the response content
      csvReader = csv.DictReader(io.StringIO(csvData))  # Read CSV data as dict
      jsonData = [row for row in csvReader]
      print(jsonData)
      return jsonData


def mainNVDI(date, lat, lng, PRODUCT, LAYER):
  END_DATE = date.strftime("%m-%d-%Y")
  START_DATE = datetime.datetime.strptime(
    END_DATE, "%m-%d-%Y") - datetime.timedelta(days=17)
  START_DATE = START_DATE.strftime("%m-%d-%Y")
  COORDINATES = {"latitude": lat, "longitude": lng}

  token = authenticate()
  if not token:
    return False
  task_id = queue_task(token, PRODUCT, LAYER,
                       START_DATE, END_DATE, COORDINATES)
  if not task_id:
    return False

  if check_task_status(token, task_id):
    files = list_files(token, task_id)
    if files:
      json = download_files(token, files, task_id)
      if json:
        return json
