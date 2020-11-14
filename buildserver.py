#!/usr/bin/python3

import platform
import time
import subprocess
from threading import Thread, Event, Lock
from flask import Flask


class ServerBuilder:
    def __init__(self):
        self.building = False
        self.running = False
        self.build_process = None
        self.server_process = None
        self.kill_event = Event()
        self.build_lock = Lock()
        self.run_lock = Lock()

    def build(self):
        with self.build_lock:
            if self.building:
                self.kill_event.set()
                self.build_process.terminate()

            self.building = True
            self.kill_event = Event()
            if platform.system() == 'Windows':
                self.build_process = subprocess.Popen(['build.bat'])
            else:
                self.build_process = subprocess.Popen(['sh', 'build.sh'])
            Thread(target=self.wait_for_build).start()
        
    def on_build_finished(self):
        with self.run_lock:
            if self.running:
                self.server_process.kill()
                self.server_process.communicate()
            self.running = True
            self.server_process = subprocess.Popen(['node', 'server.js'])

    def wait_for_build(self):
        self.build_process.communicate()

        while not self.kill_event.is_set():
            try:
                self.build_process.wait(0)
                break
            except subprocess.TimeoutExpired:
                time.sleep(0.5)
        
        self.building = False
        if not self.kill_event.is_set():
            self.on_build_finished()


app = Flask(__name__)
builder = ServerBuilder()


@app.route('/', methods=['POST'])
def build():
    builder.build()
    return 'success'


if __name__ == '__main__':
    builder.on_build_finished()
    app.run(port=7070)
