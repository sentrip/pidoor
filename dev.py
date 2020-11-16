#!/usr/bin/python

import os, sys, platform

PYTHON_CMD = 'py' if platform.system() == 'Windows' else 'python3'

if __name__ == '__main__':
    assert len(sys.argv) > 1, "Must provide command (local, server, deploy)"

    cmd = sys.argv[1]

    if cmd == 'local':
        os.system('%s app.py dev' % PYTHON_CMD)
    
    elif cmd == 'server':
        os.system('%s app.py' % PYTHON_CMD)

    elif cmd == 'deploy':
        msg = sys.argv[2] if len(sys.argv) > 2 else "Update"
        os.system('git add .')
        os.system('git commit -m "%s"' % msg)
        os.system('git push origin master')

    else:
        raise RuntimeError("Invalid args")
