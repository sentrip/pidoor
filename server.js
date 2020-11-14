//##############################################
//##############################################
const admin_password = 'cespED138' 
//##############################################
//##############################################

// Server
const sjcl = require('sjcl')
const http = require('http')
const express = require('express')
const cors = require('cors');
const socket = require('socket.io');
const cookies = require("cookie-parser");
const deepEqual = require('fast-deep-equal/es6')
const sps = require('./src/SimplePersistentStorage')
const {config} = require('./src/config')

const MAX_QUEUE_LENGTH = 10

let io
let temp_storage = {
  kingscup_clients: {},
  kingscup: null,
  nhie_clients: {},
  nhie: null,
  tod_clients: {},
  tod: null,
  queues: {
    kingscup: [],
    nhie: [],
    tod: []
  }
}
let storage = sps.SimplePersistentStorage(process.env.LOCAL_DB || 'db.json', {
  users: ['jj'],
  users_grouped: false,
  saved_lists: {
    'Kings': { color: 'springgreen', values: ['Djordje', 'Martin', 'Sergio'] }
  },
  weed_settings: { 
    Hash: { S: {Min: 0.1, Step: 0.1, Jackpot: 1.0}, M: {Min: 0.15, Step: 0.12, Jackpot: 2.0}, L: {Min: 0.2, Step: 0.2, Jackpot: 3.0}}, 
    Weed: { S: {Min: 0.1, Step: 0.1, Jackpot: 1.0}, M: {Min: 0.15, Step: 0.12, Jackpot: 2.0}, L: {Min: 0.2, Step: 0.2, Jackpot: 3.0}}
  }
})


// Helpers
function get_ip(req) {
  return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress
}

function get_password(req) {
  return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(admin_password + get_ip(req)))
}

function authenticate_headers(req) {
  return req.headers[config.headers.session] === get_password(req)
}

// Routing
const app = express()
  
  // Middleware
  .use(cors())
  .use(cookies())

  .use(express.static('build'))

  .get('/home', (req, res) => {
    res.sendFile(__dirname + '/build/index.html')
  })

  // Building
  .post('/build/:auth', (req, res) => {
    if (req.params.auth === 'buildpassword') {
      http.request({
        protocol: 'http:',
        host: '127.0.0.1',
        port: config.BUILD_PORT,
        method: 'POST'
      }).end()
    }
    res.send('')
  })

  // Auth
  .get(config.paths.ip, (req, res) => {
    res.json({ip: get_ip(req), authorised: authenticate_headers(req)})
  })
  .post(config.paths.auth, express.json({type: '*/*'}), (req, res) => {
    req.body.password === get_password(req)
      ? res.header(config.headers.session, req.body.password).json({status: 'success', 'session': req.body.password})
      : res.status(401).json({status: 'error'})
  })

  // Number detection
  .post(config.paths.roulette, express.json({type: '*/*'}), (req, res) => {
    if (req.body.number != null) {
      io.emit(config.messages.roulette.detect, {number: req.body.number})
    } else {
      io.emit(config.messages.roulette.spin)
    }
    res.send('')
  })

  // Users
  .get(config.paths.list, (req, res) => {
    res.json({users: storage.users, grouped: storage.users_grouped})
  })
  
  // User saved lists
  .get(config.paths.saved_lists, (req, res) => {
    res.json({saved_lists: storage.saved_lists})
  })
  

  // Weed settings
  .get(config.paths.weed_settings, (req, res) => {
    res.json(storage.weed_settings)
  })

// Serving
const socket_server = app.listen(
  config.PORT, 
  process.env.NODE_ENV === 'development' ? 'localhost' : config.HOST, 
  () => console.log(`Listening on ${ config.PORT }`)
)

// Sockets
io = socket(socket_server, { origins: '*:*'});

io.on('connection', (socket) => {
  
  let sock = io.to(socket.id)
  sock.emit(config.messages.ip, {ip: socket.handshake.address})
  sock.emit(config.messages.list, storage.users)
  sock.emit(config.messages.grouped, storage.users_grouped)
  sock.emit(config.messages.saved_lists, storage.saved_lists)
  sock.emit(config.messages.weed_settings, storage.weed_settings)

  const forwardToAllClientsAndSave = (path, storage_key) => {
    socket.on(path, (data) => {
      io.emit(path, data)
      let obj = {}
      obj[storage_key] = data
      storage.set(obj)
    })
  }

  const disconnectGameClient = (clients_key, data_key) => {
    delete temp_storage[clients_key][socket.id]
    if ([...Object.keys(temp_storage[clients_key])].length == 0) {
      temp_storage[data_key] = null
      temp_storage.queues[data_key] = []
    }
  }

  const forwardToGameClients = (path, connect_path, undo_path, clients_key, data_key) => {
    socket.on(path, data => {
      
      if (!deepEqual(data, temp_storage[data_key] || {}))  {
        temp_storage.queues[data_key].push(data)
        if (temp_storage.queues[data_key].length >= MAX_QUEUE_LENGTH) {
          temp_storage.queues[data_key] = temp_storage.queues[data_key].slice(1)
        }
      }
      
      io.emit(path, {...data, canUndo: temp_storage.queues[data_key].length > 1})
      
      temp_storage[data_key] = data
    })
  
    socket.on(undo_path, e => {
      if (temp_storage.queues[data_key].length === 1) return;
      temp_storage.queues[data_key].pop()
      const data = temp_storage.queues[data_key][temp_storage.queues[data_key].length - 1]
      temp_storage[data_key] = data
      io.emit(path, data)
      io.emit(undo_path, temp_storage.queues[data_key].length > 1)
    })

    socket.on(connect_path, connected => {
      if (connected) {
        if ([...Object.keys(temp_storage[clients_key])].length > 0 && temp_storage[data_key]) {
          io.to(socket.id).emit(path, {...temp_storage[data_key], canUndo: temp_storage.queues[data_key].length > 1})
        }
        temp_storage[clients_key][socket.id] = true
      } else {
        disconnectGameClient(clients_key, data_key)
      }
    })
  }

  forwardToAllClientsAndSave(config.messages.list, 'users')
  forwardToAllClientsAndSave(config.messages.grouped, 'users_grouped')
  forwardToAllClientsAndSave(config.messages.saved_lists, 'saved_lists')
  forwardToAllClientsAndSave(config.messages.weed_settings, 'weed_settings')

  const games = ['nhie', 'kingscup', 'tod']

  for (const game of games) {
    forwardToGameClients(
      config.messages[game].update, 
      config.messages[game].connect,
      config.messages[game].undo,
      `${game}_clients`,
      game)
  }
  
  socket.on('disconnect', () => {
    for (const game of games) {
      disconnectGameClient(`${game}_clients`, game)
    }
  })
})


  // .post(config.paths.list, express.json({type: '*/*'}), (req, res) => {
  //   storage.set({users: [... new Set(req.body.users)]})
  //   io.emit(config.messages.list, {users: storage.users, grouped: storage.users_grouped})
  //   res.json({users: storage.users, grouped: storage.users_grouped})
  // })
  // .post(config.paths.saved_lists_add, express.json({type: '*/*'}), authorised((req, res) => {
  //   const new_lists = LOCAL_
  // .post(config.paths.saved_lists_remove, express.json({type: '*/*'}), authorised((req, res) => {
  //   const new_lists = {... storage.saved_lists}
  //   delete new_lists[req.body.name]
  //   storage.set({saved_lists: new_lists})
  //   io.emit(config.messages.saved_lists, storage.saved_lists)
  //   res.json(storage.saved_lists)
  // }))
  // .post(config.paths.list, express.json({type: '*/*'}), authorised((req, res) => {
  //   storage.set({weed_settings: req.body.weed_settings})
  //   io.emit(config.messages.weed_settings, storage.weed_settings)
  //   res.json(storage.weed_settings)
  // }))
