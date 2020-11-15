import RPi.GPIO as GPIO
from flask import Flask

GPIO.setmode(GPIO.BCM)
GPIO.setup(23, GPIO.OUT)
app = Flask(__name__)

@app.route('/open', methods=['POST'])
def open_door():
    # Turn on door voltage
    GPIO.output(23, GPIO.HIGH)
    return 'success'


@app.route('/close', methods=['POST'])
def close_door():
    # Turn off door voltage
    GPIO.output(23, GPIO.LOW)
    return 'success'


if __name__ == '__main__':
    app.run(host='localhost', port=7090)
    GPIO.cleanup()
