const debug = require('debug')('videosock')
const WebSocket = require('ws');

let payload = 3
let connected = 0

var cfg = {}
try {
  cfg = require('../config');
} catch (e) {
  console.log('no config defaulting to env vars', e)
}

if (process.env.VIDEO_SOCK_SECRET)
  cfg.secret = process.env.VIDEO_SOCK_SECRET

const wss = new WebSocket.Server({ port: process.env.VIDEOSOCK_PORT || 80 });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', function connection(ws) {
  ws.send(payload)
  ws.on('message', function incoming(s) {
    try {
      debug('got message')
      const data = JSON.parse(s)
      if (data.key !== cfg.secret) {
        debug('wrong password:', data.key, data)
        return
      }

      payload = data.payload
      debug('updating data', payload)

      // Broadcast to everyone else.
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    } catch (e) {
      console.error('ouch', e)
      debug('error', e)
    }
  });
});
