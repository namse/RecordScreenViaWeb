var express = require('express');
var app = express();
var open = require("open");
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var TMP_PATH = 'uploads';
var port = 3456
var io = require('socket.io')(port);

app.use("/uploads", require('express').static(__dirname.replace('server', TMP_PATH)));



io.on('connection', function(socket) {
	var index = 0;
	socket.on('data', function(data) {
		console.log('I received a private message : ', data);
		var audioArrayBuffer = new ArrayBuffer(data.blob.audio);
		saveMedia(data.blob.audio, data.id + '_' + data.date + '_audio_' + index.toString() + '.wav');
		saveMedia(data.blob.video, data.id + '_' + data.date + '_video_' + index.toString() + '.webm');
		index++;
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