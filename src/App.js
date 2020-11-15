import React from 'react'
import io from "socket.io-client"

import './App.css'
import {config} from './config.js'


const socket = io('/')

function openDoor() { socket.emit(config.messages.door, true) }

function closeDoor() { socket.emit(config.messages.door, false) }



function App() {
  const [open, setOpen] = React.useState(false)
  
  socket.off(config.messages.door)
  socket.on(config.messages.door, (is_open) => setOpen(is_open))
  
  return (
    <div className="App">
      <header className="App-header">
        <button className={`OpenButton ${open ? "Red" : "Green"}`} onClick={e => open ? closeDoor() : openDoor()}>
         {open ? 'Close' : 'Open'}
        </button>
      </header>
    </div>
  );
}

export default App;
