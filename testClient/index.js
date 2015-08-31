var localMediaRecorder;
var recordInterval = 3 * 1000; // ms
var recordWebSocket = new WebSocket('ws://127.0.0.1:3456');

//// 녹취

// 녹취를 시작하면 주기적으로 호출됨. 주기는 mediaRecorder.start(interval)함수의 매개변수로 설정
function onRecordDataAvailable(blob, sourceType) {
    var messgae = {
        sourceType: sourceType,
        audio: blob.audio,
        video: blob.video
    }
    recordWebSocket.send(JSON.stringfy(message));
}

function onLocalRecordDataAvailable(blob) {
    onRecordDataAvailable(blob, "local");
}

function startRecord() {
    localMediaRecorder.Start(recordInterval);
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
                var video = document.createElement('video');

                video = mergeProps(video, {
                    controls: true,
                    src: window.webkitURL.createObjectURL(stream)
                });

                localStream = stream;

                // 로컬 스트림 녹취
                localMediaRecorder = new MediaStreamRecorder(stream);

                localMediaRecorder.video = sourcevid; // to get maximum accuracy
                localMediaRecorder.audioChannels = 1;
                localMediaRecorder.ondataavailable = onLocalRecordDataAvailable;
            },
            function(err) {
                console.error('An error occurred: [CODE ' + error.code + ']');
            }
        );
    } else {
        console.log("getUserMedia not supported");
    }

}