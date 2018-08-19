		const peerConnectionConfig = {
			'iceServers': [{
				'url': 'stun:stun.services.mozilla.com'
			}, {
				'url': 'stun:stun.l.google.com:19302'
			}]
		}
		const socket = io('http://localhost:3000');
		const sendMessageToServer = message => socket.emit('message', message);
		const callButton = document.querySelector('#call-button');
		const localvideoElement = document.querySelector('#local-video');
		const remoteVideoElement = document.querySelector('#remote-video');
		const setLocalStream = setStreamFn(localvideoElement);
		const setRemoteStream = setStreamFn(remoteVideoElement);
		const getUserMediaPromise = navigator.mediaDevices.getUserMedia({
			audio: false,
			video: true
		});
		const pc = new RTCPeerConnection(peerConnectionConfig);

		// communicate new ice candidates to signaling server
		pc.onicecandidate = evt => {
			if (evt.candidate) {
				sendMessageToServer({
					type: 'CANDIDATE',
					data: evt.candidate
				});
			}
		};
		pc.onaddstream = evt => setRemoteStream(evt.stream);

		// create initial offer 
		const createOffer = async () => {
			const offer = await pc.createOffer();
			sendMessageToServer({
				type: 'OFFER',
				data: offer
			});
			await pc.setLocalDescription(offer);
		};

		// create answer to offer and set local description
		const createAnswer = async offer => {
			const answer = await pc.createAnswer(offer);
			sendMessageToServer({
				type: 'ANSWER',
				data: answer
			});
			await pc.setLocalDescription(answer);
		};

		// sets up local stream and sends offer to signaling server
		const onCall = async () => {
			callButton.disabled = true;
			const stream = await getUserMediaPromise;
			setLocalStream(stream);
			await pc.addStream(stream);
			await createOffer();
		};

		// sets remote description passed from calling client of RTCPeerConnection
		const onOffer = async offer => {
			const response = confirm('Incoming call: Press \'OK\' to answer');
			if (response) {
				callButton.disabled = true;
				await pc.setRemoteDescription(offer);
				const localStream = await getUserMediaPromise;
				setLocalStream(localStream);
				await pc.addStream(localStream);
				await createAnswer(offer);
			}
		};

		// sets remote description passed from calling client of RTCPeerConnection
		const onAnswer = answer => pc.setRemoteDescription(answer);

		// adds candidate to RTCPeerConnection
		const onCandidate = async candidate => {
			await pc.addIceCandidate(candidate);
		};

		// message callback to process messages from signaling server
		const onMessageFromServer = async ({
			type,
			data
		}) => {
			switch (type) {
				case 'OFFER':
					await onOffer(data);
				case 'ANSWER':
					await onAnswer(data);
				case 'CANDIDATE':
					await onCandidate(data);
				default:
					return;
			}
		};

		socket.on('message', onMessageFromServer);