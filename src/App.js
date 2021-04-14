import React, { useEffect } from 'react'
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

import './App.css'
import StatusIcon from './StatusIcon'
import Input from './Input'

let username = "", password = ""
const DOOR_MSG = 'door_open'
const DOOR_CLICK_TIMEOUT_MS = 500

let checking = false

function openDoor(handler) { doDoorPost({'username': username, "password": password, "state": true}, handler); setTimeout(() => closeDoor(handler), 5000) }

function closeDoor(handler) { doDoorPost({'username': username, "password": password, "state": false}, handler) }


function doDoorPost(data, handler) {

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/open');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = () => {
    handler(xhr.status === 200 ? data.state : !data.state)
  }
  xhr.onerror = () => {
    handler(!data.state)
  }
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 0) {
      handler(!data.state)
    }
  };
  xhr.send(JSON.stringify(data));
}

function check_connected(setConnected) {
  setTimeout(() => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/ping');
      xhr.onload = () => {
        setConnected(xhr.status === 200)
      }
      xhr.onerror = () => {
        setConnected(false)
      }
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 0) {
          setConnected(false)
        }
      }
      xhr.send()
      check_connected(setConnected)
  }, 1000);
}



function bake_cookie(name, value) {
  var cookie = [name, '=', JSON.stringify(value), '; domain_.', window.location.host.toString(), '; path=/; expires=Tue, 01-Jan-2030 00:00:01 GMT;'].join('');
  document.cookie = cookie;
}

function read_cookie(name) {
  var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
  result = result != null ? JSON.parse(result[1]) : [];
  return result;
}



function App() {

  username = read_cookie('username') || ''
  password = read_cookie('password') || ''
  
  const [open, setOpen] = React.useState(false)
  const [connected, setConnected] = React.useState(false)
  const [recentlyClicked, setRecentlyClicked] = React.useState(false)
  
  if (recentlyClicked) {
    setTimeout(() => setRecentlyClicked(false), DOOR_CLICK_TIMEOUT_MS)
  }

  useEffect(() => {
    disableBodyScroll(document.querySelector('#MainApp'))
    return () => clearAllBodyScrollLocks()
  })

  // if (!checking) {
  //   checking = true
  //   check_connected(setConnected)
  // }

  return (
    <div className="App" id="MainApp">
      {/* <StatusIcon connected={connected} /> */}

      <header className="App-header">
        <Input id="Username" label="Username" value={username} predicted="" locked={false} 
          onChange={e => { username = e.target.value; bake_cookie('username', username); }}/>
        <Input id="Password" label="Pin" value={password} predicted="" locked={false} 
          onChange={e => { password = e.target.value; bake_cookie('password', password); }}
          inputProps={{
            type: "number", inputMode: 'numeric', pattern: "[0-9]*"
          }
        }/>

      <button className={`OpenButton ${open ? "Red" : "Green"}`} 
        disabled={recentlyClicked}
        onClick={e => 
          { open ? closeDoor(setOpen) : openDoor(setOpen); setRecentlyClicked(true); }
        }
        >
        {open ? 'Close' : 'Open'}
      </button>

      </header>
    </div>
  );
}

export default App;
