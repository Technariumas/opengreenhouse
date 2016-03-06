#!/usr/bin/env python3
import os
import http.server
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

class Handler(http.server.SimpleHTTPRequestHandler):
    def respond(self, code, value):
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(value).encode('utf-8') + b'\n')

    def error(self, code, reason):
        self.respond(code, {"ok": False, "error": reason})

    def ok(self, value):
        self.respond(200, {"ok": True, "value": value})

    def do_GET(self):
        if not self.path.startswith('/rpc/'):
            return super().do_GET()
        return self.rpc(action='GET')

    def do_PUT(self):
        if not self.path.startswith('/rpc/'):
            return super().do_PUT()
        return self.rpc(action='PUT')

    def rpc(self, action):
        try:
            path = urllib.parse.urlparse(self.path)
            params = dict(urllib.parse.parse_qsl(path.query))

            try:
                components = path.path.strip('/').split('/')
                name = components[1]
                if action == "GET":
                    if name == 'series':
                        name = components[2]
                        return self.ok(ARDUINO.timeseries(name, **params))
                    else:
                        return self.ok(ARDUINO.get(name))
                else:
                    try:
                        value = int(params['value'])
                        return self.ok(ARDUINO.put(name, value))
                    except KeyError as e:
                        return self.error(400, "No value given.")
                    except ValueError as e:
                        return self.error(400, "Invalid number: {}".format(params['value']))
            except IndexError as e:
                return self.error(400, "{}".format(e))
            except TypeError as e:
                return self.error(400, "{}".format(e))
        except:
            self.error(501, "Internal server error.")
            raise


def main():
    print("Starting up...")
    os.chdir(WEBROOT)
    httpd = http.server.HTTPServer((HTTP_HOST, HTTP_PORT), Handler)
    print("Serving on http://0.0.0.0:8000")
    ARDUINO.start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        os._exit(1)


if __name__ == "__main__":
    main()
