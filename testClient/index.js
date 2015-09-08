var BSON = bson().BSON;
var localMediaRecorder;
var recordInterval = 10 * 1000; // ms
var socketIOPort = 3456;
var socket = io('http://localhost:' + socketIOPort.toString());
var container = document.getElementById('container');
var localStream;
var id = 'id123'
	//// 녹취

// 녹취를 시작하면 주기적으로 호출됨. 주기는 mediaRecorder.start(interval)함수의 매개변수로 설정
function onRecordDataAvailable(blob, sourceType) {

	/*
	var audioArrayBuffer;
	var videoArrayBuffer;
	blobToArrayBuffer(blob.audio, function(buffer) {
		audioArrayBuffer = buffer;
		console.log(buffer.byteLength);
		blobToArrayBuffer(blob.video, function(buffer) {
			videoArrayBuffer = buffer;
			console.log(buffer.byteLength);
			console.log(buffer);

			var message = {
				sourceType: sourceType,
				id: id,
				date: (new Date()).toISOString(),
				audio: audioArrayBuffer,
				video: videoArrayBuffer
			};

			//var data = JSON.stringify(message);
			var data = BSON.serialize(message, false);

			var serializedArrayBuffer = BSON.serialize(audioArrayBuffer, false, true);
			//TODO 

			// blob에
			// 헤더 붙여서 보내기
			recordWebSocket.send(data);
		});
	});
*/

	//	message
	//	-	.id
	//	-	.date
	//	-	.isAdmin (boolean)
	//	-	.blob
	//	-	-	.audio
	//	-	-	.video

	var message = {
		id: id,
		date: (new Date()).toISOString().replace(/\./gi, '_').replace(/\:/gi, '_'),
		isAdmin: sourceType == 'local' ? true : false,
		blob: blob
	};
	socket.emit('data', message);
}

function onLocalRecordDataAvailable(blob) {
	onRecordDataAvailable(blob, "local");
	onRecordDataAvailable(blob, "remote");
}

function startRecord() {
	localMediaRecorder.start(recordInterval);
}

function blobToArrayBuffer(blob, cb) {
	var fileReader = new FileReader();
	fileReader.onload = function() {
		cb(this.result);
	};
	fileReader.readAsArrayBuffer(blob);
}


function startVideo() {
	navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia;

	if (navigator.getUserMedia) {
		navigator.getUserMedia({
				audio: true,
				video: {
					mandatory: {
						minWidth: 1280,
						minHeight: 720
					}
				}
			},
			function(stream) {
				localStream = stream;
				var video = document.createElement('video');

				video = mergeProps(video, {
					controls: true,
					src: URL.createObjectURL(stream)
				});
				video.addEventListener('loadedmetadata', function() {


					// 로컬 스트림 녹취
					localMediaRecorder = new MultiStreamRecorder(stream);

					localMediaRecorder.ondataavailable = onLocalRecordDataAvailable;
				}, false);

				video.play();

				container.appendChild(video);
			},
			function(err) {
				console.error('An error occurred: [CODE ' + error.code + ']');
			}
		);
	} else {
		console.log("getUserMedia not supported");
	}

}