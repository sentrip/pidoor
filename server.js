// Server
const http = require('http')
const express = require('express')
const cors = require('cors');
const socket = require('socket.io');
const {config} = require('./src/config')

let io
let DEV = process.argv.length > 2 && process.argv[2] == 'dev'

let door_open = false
let close_timeout_handle = 0

// Helpers
function doLocalRequest({port, path = '/', onSuccess=()=>{}, onError=()=>{}}) {
  http.request({
    protocol: 'http:',
    host: '127.0.0.1',
    port: port,
    method: 'POST',
    path: path
  })
  .on('response', onSuccess)
  .on('error', onError)
  .end()
}

function openDoor() {
  doLocalRequest({port: config.DOOR_PORT, path: '/open', 
    onSuccess: () => {
      door_open = true
      io.emit(config.messages.door, true)
      close_timeout_handle = setTimeout(closeDoor, 5000)
    },
    onError: () => {
      console.log('Failed to open')
    }})
}

function closeDoor() {
  doLocalRequest({port: config.DOOR_PORT, path: '/close', 
    onSuccess: () => {
      door_open = false
      io.emit(config.messages.door, false)
      clearTimeout(close_timeout_handle)
    },
    onError: () => {
      console.log('Failed to close')
    }})
}


// Routing
const app = express()
  
  // Middleware
  .use(cors())

  .use(express.static('build'))

  // Building
  .post('/build', (req, res) => {
    doLocalRequest({port: config.BUILD_PORT})
    res.send('')
  })



// Serving
const server_host = DEV ? 'localhost' : config.HOST
const socket_server = app.listen(
  config.PORT, 
  server_host, 
  () => console.log(`Listening on ${server_host}:${ config.PORT }`)
)

// Sockets
io = socket(socket_server, { origins: '*:*'});

io.on('connection', (socket) => {
  
  io.to(socket.id).emit(config.messages.door, door_open)

  socket.on(config.messages.door, (is_open) => {
    if (!door_open && is_open) {
      openDoor()
    } else if (door_open && !is_open) {
      closeDoor()
    }
  })

})