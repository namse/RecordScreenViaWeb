/*	1. 다음과 같이 스크립트를 추가합니다.
	
	<script src="https://cdn.webrtc-experiment.com/MediaStreamRecorder.js"></script>
    <script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
    <script src="RecordHelper.js"></script>  <-- 이 항목은 현재 RecordHelper.js의 위치에 맞게 설정.


	2. 녹취도우미 객체를 생성합니다.

	// RecordHelper 객체를 생성합니다. 매개변수로는
	// 1. 녹취서버 IP
	// 2. id (상담사 id)
	// 을 넣어줍니다.
	var recordHelper = new RecordHelper( 녹취_서버_Server_IP, id );

    
    2. 녹취 버튼이 실행될 때
    ex)
    function RecordStart()
    {
	...
	
	// 녹취를 시작하면 자동으로 서버에 데이터를 보내게 됩니다. 매개변수로는
	// 1. 상담사의 Stream
	// 2. 상담 받는 고객의 Stream
	// 을 넣어줍니다.
	recordHelper.startRecord( (localStream - 상담사의 stream), (remoteStream - 상담받는 사람의 stream) );

	...
    }


    3. 녹취를 종료할 때
    recordHelper.stopRecord();


    4. 참고사항 : stopRecord 후 startRecord를 이용하여 새로운 녹화를 할 수 있습니다.
*/

function RecordHelper(serverIP, id) {
	var id = id;
	var socketIOPort = 3456;
	var socket = io(serverIP + ":" + socketIOPort.toString());
	var recordInterval = 3 * 1000; // ms

	var localMediaRecorder;
	var remoteMediaRecorder;

	var self = this;

	this.startRecord = function(localStream, remoteStream) {

		// 로컬 스트림 녹취
		localMediaRecorder = new MultiStreamRecorder(localStream);
		localMediaRecorder.ondataavailable = self.onLocalRecordDataAvailable;


		// 리모트 스트림 녹취
		remoteMediaRecorder = new MultiStreamRecorder(remoteStream);
		remoteMediaRecorder.ondataavailable = self.onRemoteRecordDataAvailable;

		localMediaRecorder.start(recordInterval);
		remoteMediaRecorder.start(recordInterval);
	}

	self.stopRecord = function() {
		localMediaRecorder.ondataavailable = null;
		remoteMediaRecorder.ondataavailable = null;
		localMediaRecorder.stop();
		remoteMediaRecorder.stop();
		socket.emit('done', {});
	}

	self.onLocalRecordDataAvailable = function(blob) {
		self.onRecordDataAvailable(blob, "local");
	}

	self.onRemoteRecordDataAvailable = function(blob) {
		self.onRecordDataAvailable(blob, "remote");
	}

	self.onRecordDataAvailable = function(blob, sourceType) {
		// 녹취를 시작하면 주기적으로 호출됨. 주기는 mediaRecorder.start(interval)함수의 매개변수로 설정
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
}