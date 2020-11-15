#!/usr/bin/python

import os, sys, platform

IP, PORT, PI_PORT = '85.251.240.107', 8000, 7090

PYTHON_CMD = 'py' if platform.system() == 'Windows' else 'python3'

if __name__ == '__main__':
    assert len(sys.argv) > 1, "Must provide command (client, local, server, pi, build, deploy)"

    cmd = sys.argv[1]

    if cmd == 'client':
        os.system('npm run-script start')
        
    elif cmd == 'local':
        os.system('node server.js dev')
    
    elif cmd == 'server':
        os.system('%s buildserver.py' % PYTHON_CMD)

    elif cmd == 'pi':
        os.system('FLASK_ENV=development flask run --port 7090')

    elif cmd == 'build':
        os.system('wget --method POST -q -O /dev/null http://%s:%d/build' % (IP, PORT))

    elif cmd == 'deploy':
        msg = sys.argv[2] if len(sys.argv) > 2 else "Update"
        os.system('git add .')
        os.system('git commit -m "%s"' % msg)
        os.system('git push origin master')
        os.system('wget --method POST -q -O /dev/null http://%s:%d/build' % (IP, PORT))

    else:
        raise RuntimeError("Invalid args")
