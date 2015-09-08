var express = require('express');
var app = express();
var open = require("open");
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var UPLOAD_PATH = 'uploads';
var INDEX_FILE_NAME = "files.txt";
var ADMIN_SUFFIX = 'admin';
var USER_SUFFIX = 'user';
var port = 3456
var io = require('socket.io')(port);
var child_process = require('child_process');
var exec = child_process.exec;


function puts(error, stdout, stderr) {
	stdout ? console.log('stdout: ' + stdout) : null;
	stderr ? console.log('stderr: ' + stderr) : null;
	error ? console.log('exec error: ' + error) : null;

}

function exec_cb(command, callback) {
	exec(command, function(error, stdout, stderr) {
		stdout ? console.log('stdout: ' + stdout) : null;
		stderr ? console.log('stderr: ' + stderr) : null;
		error ? console.log('exec error: ' + error) : null;

		callback();
	});
}

//	exec("ffmpeg -i video-file.webm -i audio-file.wav -map 0:0 -map 1:0 output-file-name.webm", puts);

app.use("/uploads", require('express').static(__dirname.replace('server', UPLOAD_PATH)));


io.on('connection', function(socket) {
	var index = 0;
	var id;
	var uploadFolderDirectory;
	var firstDate = null;
	socket.on('data', function(data) {

		//	data
		//	-	.id
		//	-	.date
		//	-	.isAdmin (boolean)
		//	-	.blob
		//	-	-	.audio
		//	-	-	.video

		id = data.id;
		if (firstDate == null) {
			firstDate = data.date;
		}

		// make directory
		uploadFolderDirectory = path.join(__dirname, UPLOAD_PATH + "/" + id + "_" + firstDate);
		mkDir(uploadFolderDirectory, function() {

			// save media
			var fileName = data.id + '_' + data.date + '_' + index.toString();
			if (data.isAdmin === true) {
				fileName += '_' + ADMIN_SUFFIX;
			} else {
				fileName += '_' + USER_SUFFIX;
			}

			var audioExtension = data.blob.audio.type == 'audio/ogg' ? 'ogg' : 'wav';

			var audioFileName = fileName + '.' + audioExtension;
			var videoFileName = fileName + '.webm';
			var muxedFileName = fileName + '_mux.' + '.webm'

			console.log(audioFileName);
			console.log(videoFileName);
			console.log(fileName);
			saveMedia(data.blob.audio, audioFileName, uploadFolderDirectory, function() {
				saveMedia(data.blob.video, videoFileName, uploadFolderDirectory, function() {
					// mux audio and video
					var muxCommand = 'ffmpeg -loglevel error -t 5 -i ' + path.join(uploadFolderDirectory, videoFileName) +
						' -t 5 -i ' + path.join(uploadFolderDirectory, audioFileName) + ' -map 0:v:0 -map 1:a:0 -y ' + path.join(uploadFolderDirectory, muxedFileName);
					exec_cb(muxCommand, function() {
						// save index on index meta data file.	
						var indexFileName = data.isAdmin === true ? ADMIN_SUFFIX + '_' + INDEX_FILE_NAME : USER_SUFFIX + '_' + INDEX_FILE_NAME;
						fs.appendFile(path.join(uploadFolderDirectory, indexFileName), "file '" + path.join(uploadFolderDirectory, muxedFileName) + "'\n", function(err) {
							if (err) {
								console.log(err);
								return;
							}
						});
					});
				});
			});

			index++;
		});

	});
	socket.on('disconnect', function() {
		if (index > 0) {
			var adminOutputfileName = id + '_' + firstDate + '_' + ADMIN_SUFFIX + '_FIN.webm';
			var userOutputfileName = id + '_' + firstDate + '_' + USER_SUFFIX + '_FIN.webm';

			var adminIndexFileName = ADMIN_SUFFIX + '_' + INDEX_FILE_NAME;
			var userIndexFileName = USER_SUFFIX + '_' + INDEX_FILE_NAME;

			exec('ffmpeg -loglevel error -f concat -i ' + path.join(uploadFolderDirectory, adminIndexFileName) + ' -c copy ' + path.join(UPLOAD_PATH, adminOutputfileName), puts);
			exec('ffmpeg -loglevel error -f concat -i ' + path.join(uploadFolderDirectory, userIndexFileName) + ' -c copy ' + path.join(UPLOAD_PATH, userOutputfileName), puts);
		}
	});
});


function saveMedia(data, fileName, folderPath, callback) {
	var filePath = path.join(folderPath, fileName);
	console.log(filePath);
	fs.writeFile(filePath, data, function(err) {
		if (err) {
			console.log(err);
			return;
		}
		if (callback != null)
			callback();
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
function mkDir(dirPath, callback) {
	fs.exists(dirPath, function(exists) {
		if (!exists) {
			mkdirp(dirPath, '0755', function(err) {
				if (err) console.log('error creating folder');
				if (callback != null) callback();
			});
		} else if (callback != null) {
			callback();
		}
	});
}

mkDir(UPLOAD_PATH);