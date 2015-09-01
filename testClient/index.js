var localMediaRecorder;
var recordInterval = 3 * 1000; // ms
var recordWebSocket = new WebSocket('ws://127.0.0.1:3456');
var container = document.getElementById('container');
var localStream;
//// 녹취

// 녹취를 시작하면 주기적으로 호출됨. 주기는 mediaRecorder.start(interval)함수의 매개변수로 설정
function onRecordDataAvailable(blob, sourceType) {
	var message = {
		sourceType: sourceType,
		audio: blob.audio,
		video: blob.video
	};
	console.log(blob.audio);

	//TODO 

	// blob에
	// 헤더 붙여서 보내기
	recordWebSocket.send(JSON.stringify(message));
}

function onLocalRecordDataAvailable(blob) {
	onRecordDataAvailable(blob, "local");
}

function startRecord() {
	localMediaRecorder.start(recordInterval);
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
						minWidth: 5, //1280,
						minHeight: 5 //720
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

					//localMediaRecorder.video = video; // to get maximum accuracy
					//localMediaRecorder.audioChannels = 1;
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