import random as r
import math


def getSoil(lat, lng):
  a = {'p2o5': 68.3, 'k': 66.15, 'mg': 61.81, 'ph': 7.49}

  def b(c, d=10):
    return math.floor(c + r.uniform(-d, d) * 1000) / 1000
  e = list(a.keys())

  f = {g: b(a[g]) for g in e}
  # dota = main(lat, lng)
  return f
