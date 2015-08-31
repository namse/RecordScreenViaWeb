var express = require('express');
var app = express();


var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        port: 3456
    });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
});