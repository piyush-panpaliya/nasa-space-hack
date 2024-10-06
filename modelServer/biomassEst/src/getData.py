# from submit import main
import math
import random


def getBioMass(lat, lng):
  data = 2317
  # testing overall flow will reintroduce in production
  # dota = main(lat, lng)
# data +- 100
  return data + math.floor(random.random() * 100 - 200)
