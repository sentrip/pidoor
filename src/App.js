import React, { useEffect } from 'react'
import io from "socket.io-client"
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import { bake_cookie, read_cookie } from 'sfcookies';

import './App.css'
import StatusIcon from './StatusIcon'
import Input from './Input'

let username = "", password = ""
const DOOR_MSG = 'door_open'
const DOOR_CLICK_TIMEOUT_MS = 500


const socket = io('/')

function openDoor() { socket.emit(DOOR_MSG, {username: username, password: password, state: true}) }

function closeDoor() { socket.emit(DOOR_MSG, {state: false}) }


function App() {
  username = read_cookie('username') || ''
  password = read_cookie('password') || ''
  
  const [open, setOpen] = React.useState(false)
  const [connected, setConnected] = React.useState(socket.connected)
  const [recentlyClicked, setRecentlyClicked] = React.useState(false)
  
  if (recentlyClicked) {
    setTimeout(() => setRecentlyClicked(false), DOOR_CLICK_TIMEOUT_MS)
  }

  useEffect(() => {
    disableBodyScroll(document.querySelector('#MainApp'))
    return () => clearAllBodyScrollLocks()
  })

  socket.off('connect')
  socket.on('connect', () => setConnected(true))
  socket.off('disconnect')
  socket.on('disconnect', () => setConnected(false))
  socket.off(DOOR_MSG)
  socket.on(DOOR_MSG, (data) => setOpen(data.state))
  
  return (
    <div className="App" id="MainApp">
      <StatusIcon connected={connected}/>
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
          onClick={e => { open ? closeDoor() : openDoor(); setRecentlyClicked(true); }}
          >
          {open ? 'Close' : 'Open'}
        </button>
      </header>
    </div>
  );
}

export default App;
