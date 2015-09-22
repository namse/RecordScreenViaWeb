var remoteStream;
var localStream;
var IP = "127.0.0.1";
var id = "abc123";

var recordHelper = new RecordHelper(IP, id);

function startRecord() {
	recordHelper.startRecord(localStream, remoteStream);
}

function stopRecord() {
	recordHelper.stopRecord();
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
				remoteStream = localStream = stream;
				var video = document.createElement('video');

				video = mergeProps(video, {
					controls: true,
					src: URL.createObjectURL(stream)
				});

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