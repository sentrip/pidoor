import asyncio
import json
import sys
import socketio
from aiohttp import web

with open('config.json') as f:
    config = json.load(f)

try:
    with open('whitelist.json') as f:
        whitelist = json.load(f)
except FileNotFoundError:
    whitelist = []

USE_PI = False if 'dev' in sys.argv else True
HOST = config['HOST'] if USE_PI else 'localhost'
PORT = config['PORT']
DOOR_MSG = config['DOOR_MSG_KEY']
OUTPUT_PIN = config['DOOR_OUTPUT_PIN']
DOOR_OPEN_DURATION = config['DOOR_OPEN_DURATION']

is_open = False
sio = socketio.AsyncServer()
app = web.Application()
sio.attach(app)

def setup_door():
    if USE_PI:
        import RPi.GPIO as GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(OUTPUT_PIN, GPIO.OUT)

def cleanup_door():
    if USE_PI:
        import RPi.GPIO as GPIO
        GPIO.cleanup()

def set_door_state_factory():
    if USE_PI:
        import RPi.GPIO as GPIO
        return lambda b: GPIO.output(OUTPUT_PIN, GPIO.HIGH if b else GPIO.LOW)
    else:
        return lambda b: print("State: " + str(b))


set_door_state = set_door_state_factory()


async def set_global_door_state(state, room):
    global is_open
    is_open = state
    set_door_state(state)
    
    await sio.emit(DOOR_MSG, data={"state": state}, room=room)
    
    # TODO: Better decision making for spamming the button
    if is_open:
        await asyncio.sleep(DOOR_OPEN_DURATION)
        if is_open:
            await set_global_door_state(False, room)


def verify_user(username, password):
    for name, pin in whitelist:
        if username == name and password == pin:
            return True
    return False


@sio.event
def connect(sid, environ):
    global is_open
    asyncio.ensure_future(sio.emit(DOOR_MSG, data={"state": is_open}, room=sid))


@sio.event
async def door_open(sid, data):
    global is_open
    requested_open = data['state']

    if not is_open and requested_open and verify_user(data.get('username', ''), data.get('password', '')):
        await set_global_door_state(True, sid)
    elif is_open and not requested_open:
        await set_global_door_state(False, sid)
    
    
async def index(request):
    with open('build/index.html') as f:
        return web.Response(text=f.read(), content_type='text/html')

async def favicon(request):
    return web.FileResponse('build/favicon.ico')

async def logo192(request):
    return web.FileResponse('build/logo192.png')

async def logo512(request):
    return web.FileResponse('build/logo512.png')

app.router.add_static('/static', 'build/static', follow_symlinks=True)
app.router.add_get('/', index)
app.router.add_get('/favicon.ico', favicon)
app.router.add_get('/logo192.png', logo192)
app.router.add_get('/logo512.png', logo512)


if __name__ == '__main__':
    setup_door()
    try:
        web.run_app(app, host=HOST, port=PORT)
    finally:
        cleanup_door()
