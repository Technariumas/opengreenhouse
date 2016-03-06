#!/usr/bin/env python3
import os
import http.server
import bottle
import json
import urllib.parse
import numpy
import pandas
from serial import Serial
from serial.serialutil import SerialException
import time
from threading import Thread
from queue import Queue, Empty
import sys


SERIAL_DEVICE = "/dev/arduino"
SERIAL_RATE = 115200
HTTP_HOST = '127.0.0.1'
HTTP_PORT = 8000

WINDOW_OPEN_POSITION = 5000
WINDOW_CLOSED_POSITION = 0
DOOR_OPEN_POSITION = -9500
DOOR_CLOSED_POSITION = 0
WIND_THRESHOLD = 200
WIND_MEAN_TIME = 40

ROOT = os.path.dirname(os.path.realpath(__file__))
WEBROOT = os.path.join(ROOT, "webroot")


class Arduino:
    def __init__(self, mock):
        self.mock = mock
        self.pipe = None
        self.thread = Thread(target=self.interact)
        self.sendq = Queue()
        self.recvq = Queue()
        self.state = {}
        self.wind_fir = []

    def log_filename(self, key):
        return os.path.join(ROOT, 'log', key)

    def log_value(self, key, value):
        with open(self.log_filename(key), "a") as f:
            f.write("{} {}\n".format(time.time(), value))

    def handle(self):
        wind = self.state.get('wind', 0)
        if wind > WIND_THRESHOLD:
            self.put('window', 0)
        elif wind < WIND_THRESHOLD / 4 and self.state.get('window', 100) != 100:
            self.put('window', 100)

    def interact(self):
        serial = None
        while True:
            try:
                if serial is None and not self.mock:
                    try:
                        serial = Serial(SERIAL_DEVICE, SERIAL_RATE)
                        print("Connecting to Arduino")
                    except SerialException:
                        print("Error opening serial. To use without arduino: ./server.py --mock")
                        os._exit(1)
                try:
                    while True:
                        cmd = self.sendq.get(block=False)
                        if self.mock:
                            print("SERIAL WRITE:", cmd)
                        else:
                            serial.write(cmd.encode('ascii'))
                            serial.write(b'\n')
                except Empty:
                    pass
                if self.mock:
                    time.sleep(1)
                    line = b'temp 18\n'
                else:
                    line = serial.readline()
                try:
                    key, value = line.decode('ascii').strip().split(' ')
                    value = self.from_arduino(key, int(value))
                    self.log_value(key, value)
                    self.state[key] = value
                    self.handle()
                    self.recvq.put((key, value))
                except ValueError:
                    print("Malformed input from arduino:", line)
                    continue
                except UnicodeDecodeError:
                    print("Malformed input from arduino:", line)
                    continue
            except SerialException:
                if serial is not None:
                    serial.close()
                    serial = None
                    print("Disconnecting from Arduino")

    def start(self):
        self.thread.start()

    def from_arduino(self, key, value):
        if key == 'window':
            return int(100 * (value - WINDOW_CLOSED_POSITION) / (WINDOW_OPEN_POSITION - WINDOW_CLOSED_POSITION))
        if key == 'door':
            return int(100 * (value - DOOR_CLOSED_POSITION) / (DOOR_OPEN_POSITION - DOOR_CLOSED_POSITION))
        if key == 'wind':
            if value < 0:
                value = 0
            if len(self.wind_fir):
                self.wind_fir.pop(0)
            self.wind_fir.append(int(value))
            return int(numpy.mean(self.wind_fir))
        return int(value)

    def to_arduino(self, key, value):
        if key == 'window':
            return int((WINDOW_OPEN_POSITION - WINDOW_CLOSED_POSITION) * value / 100) + WINDOW_CLOSED_POSITION
        if key == 'door':
            return int((DOOR_OPEN_POSITION - DOOR_CLOSED_POSITION) * value / 100) + DOOR_CLOSED_POSITION
        return int(value)

    def get(self, key):
        return self.state.get(key, None)

    def put(self, key, value):
        self.sendq.put("{} {}".format(key, self.to_arduino(key, value)))
        return value

    def timeseries(self, name, start, end=None, resolution=None):
        if end is None:
            end = time.time()
        start = float(start)
        end = float(end)

        log = pandas.read_csv(self.log_filename(name), sep=' ', names=('time', 'value'))
        log.time = log.time.astype(float)
        log.value = log.value.astype(int)
        log = log[(start <= log.time) & (log.time <= end)]
        value = log.value
        value.index = pandas.to_datetime(log.time, unit='s')
        if len(value) and resolution is not None and resolution != 1:
            value = value.resample('{}s'.format(resolution)).dropna()

        return {
            'time': [int(t.timestamp()) for t in value.index],
            'value': [int(x) for x in value],
        }




ARDUINO = Arduino(mock='--mock' in sys.argv)

def ok(value):
    return {"ok": True, "value": value}

@bottle.get('/rpc/series/<key>/')
def series(key):
    q = bottle.request.query
    return ok(ARDUINO.timeseries(key, q.start, q.end, q.resolution))

@bottle.get('/rpc/<key>/')
def get(key):
    return ok(ARDUINO.get(key))

@bottle.put('/rpc/<key>/')
def put(key, value):
    value = int(value)
    return ok(ARDUINO.put(key, value))


def main():
    print("Starting up...")
    os.chdir(WEBROOT)
    ARDUINO.start()
    sys.argv = [sys.argv[0]]
    bottle.run(host=HTTP_HOST, port=HTTP_PORT, server='gunicorn', workers=4)


if __name__ == "__main__":
    main()
