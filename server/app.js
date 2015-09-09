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
var SOCKET_IO_PORT = 3456;
var DISPLAY_PORT = 4567;
var io = require('socket.io')(SOCKET_IO_PORT);
var child_process = require('child_process');
var exec = child_process.exec;
var https = require('https');
var url = require('url');


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
		uploadFolderDirectory = path.join(__dirname, UPLOAD_PATH + "/" + id + "/" + firstDate);
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
			var muxedFileName = fileName + '_mux' + '.webm'

			console.log(audioFileName);
			console.log(videoFileName);
			console.log(fileName);
			saveMedia(data.blob.audio, audioFileName, uploadFolderDirectory, function() {
				saveMedia(data.blob.video, videoFileName, uploadFolderDirectory, function() {
					// mux audio and video
					var muxCommand = 'ffmpeg -loglevel error -t 5 -i ' + path.join(uploadFolderDirectory, videoFileName) +
						' -t 5 -i ' + path.join(uploadFolderDirectory, audioFileName) + ' -map 0:0 -map 1:0 -acodec copy -vcodec copy ' + path.join(uploadFolderDirectory, muxedFileName);
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

			exec('ffmpeg -loglevel error -f concat -i ' + path.join(uploadFolderDirectory, adminIndexFileName) + ' -c copy ' + path.join(UPLOAD_PATH, id + '/' + adminOutputfileName), puts);
			exec('ffmpeg -loglevel error -f concat -i ' + path.join(uploadFolderDirectory, userIndexFileName) + ' -c copy ' + path.join(UPLOAD_PATH, id + '/' + userOutputfileName), puts);
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

// display part
///////////////////////////////

app.use(express.static(__dirname + '/uploads'));
app.set('port', DISPLAY_PORT);
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// routes ======================================================================
require('./routes.js')(app); // load our routes and pass in our app and fully configured passport
// launch ======================================================================
https.createServer(options, app).listen(app.get('port'));


/*
http.createServer(function(req, res) {
	if (req.url != "/movie.mp4") {
		res.writeHead(200, {
			"Content-Type": "text/html"
		});
		res.end('<video src="http://localhost:8888/movie.mp4" controls></video>');
	} else {
		var file = path.resolve(__dirname, "movie.mp4");
		var range = req.headers.range;
		var positions = range.replace(/bytes=/, "").split("-");
		var start = parseInt(positions[0], 10);

		fs.stat(file, function(err, stats) {
			var total = stats.size;
			var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
			var chunksize = (end - start) + 1;

			res.writeHead(206, {
				"Content-Range": "bytes " + start + "-" + end + "/" + total,
				"Accept-Ranges": "bytes",
				"Content-Length": chunksize,
				"Content-Type": "video/mp4"
			});

			var stream = fs.createReadStream(file, {
					start: start,
					end: end
				})
				.on("open", function() {
					stream.pipe(res);
				}).on("error", function(err) {
					res.end(err);
				});
		});
	}
}).listen(8888);
*/



// for test

app.use("/test", require('express').static(__dirname.replace('server', 'testClient')));




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