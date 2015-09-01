var express = require('express');
var app = express();
var open = require("open");
var WebSocketServer = require('ws').Server;
var bson = require("bson");
var BSON = new bson.BSONPure.BSON();
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var TMP_PATH = 'uploads';

app.use("/uploads", require('express').static(__dirname.replace('server', TMP_PATH)));

var wss = new WebSocketServer({
	port: 3457
});
wss.binaryType = 'blob';

wss.on('connection', function connection(ws) {
	var index = 0;
	ws.on('message', function incoming(message, flags) {
		console.log(message);
		/*var data = BSON.deserialize(message);

		var audioArrayBuffer = new ArrayBuffer(data.audio);
		saveMedia(toBuffer(audioArrayBuffer), data.id + '_' + data.date + '_audio_' + index.toString() + '.wav');
		saveMedia(toBuffer(data.video), data.id + '_' + data.date + '_video_' + index.toString() + '.webm');

		index++;
*/
	});
});

function toBuffer(ab) {
	var buffer = new Buffer(ab.byteLength);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buffer.length; ++i) {
		buffer[i] = view[i];
	}
	return buffer;
}


function saveMedia(data, fileName) {
	var filePath = path.join(TMP_PATH, fileName);
	fs.appendFile(filePath, data, function(err) {
		if (err) {
			console.log(err);
			return;
		}
	});
}

// for test

app.use("/", require('express').static(__dirname.replace('server', 'testClient')));

var http = require('http').Server(app);
http.listen(8080, function() {
	console.log('listening on 8080');
	//	open("http://localhost:8080");
});




// for creating a directory at the given path if not present already.
function mkDir(dirPath) {
	fs.exists(dirPath, function(exists) {
		if (!exists) {
			mkdirp(dirPath, '0755', function(err) {
				if (err) console.log('error creating folder');
			});
		}
	});
}

mkDir(TMP_PATH);