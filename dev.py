#!/usr/bin/python

import os, sys, platform

PYTHON_CMD = 'py' if platform.system() == 'Windows' else 'python3'

if __name__ == '__main__':
    assert len(sys.argv) > 1, "Must provide command (client, local, server, pi, build, deploy)"

    cmd = sys.argv[1]

    if cmd == 'client':
        os.system('npm run-script start-client')
    
    elif cmd == 'local':
        os.system('LOCAL_DB=db-dev.json npm run-script start-local')
    
    elif cmd == 'server':
        os.system('%s buildserver.py' % PYTHON_CMD)
    
    elif cmd == 'pi':
        os.system('FLASK_ENV=development FLASK_APP="roulette.py" flask run --host 192.168.1.103 --port 5050')

    elif cmd == 'spin':
        os.system('wget -q -O /dev/null http://192.168.1.103:5050/spin')

    elif cmd == 'detect':
        number = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        os.system('wget -q -O /dev/null http://192.168.1.103:5050/detect/%d' % number)

    elif cmd == 'build':
        os.system('wget --method POST -q -O /dev/null http://ruleta.life/build/buildpassword')

    elif cmd == 'deploy':
        msg = sys.argv[2] if len(sys.argv) > 2 else "Update"
        os.system('git add .')
        os.system('git commit -m "%s"' % msg)
        os.system('git push origin master')
        os.system('wget --method POST -q -O /dev/null http://ruleta.life/build/buildpassword')

    else:
        raise RuntimeError("Invalid args")
