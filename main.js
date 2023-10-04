const startButton = document.getElementById('startButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const wsServerURL = 'ws://localhost:8080';
let localStream;
let peerConnection;
let ws;

startButton.addEventListener('click', startRandomConnection);

async function startRandomConnection() {
    try {
        // Initialize WebSocket connection
        ws = new WebSocket(wsServerURL);

        ws.addEventListener('open', () => {
            console.log('WebSocket connected');
        });

        ws.addEventListener('message', async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'offer') {
                await handleOffer(message);
            } else if (message.type === 'answer') {
                await handleAnswer(message);
            }
        });

        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection();

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Send the offer to the signaling server
        ws.send(JSON.stringify({ type: 'offer', offer: offer }));

    } catch (error) {
        console.error('Error starting connection:', error);
    }
}

async function handleOffer(offer) {
    try {
        peerConnection = new RTCPeerConnection();

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        await peerConnection.setRemoteDescription(offer.offer);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        ws.send(JSON.stringify({ type: 'answer', answer: answer }));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

async function handleAnswer(answer) {
    try {
        await peerConnection.setRemoteDescription(answer.answer);
    } catch (error) {
        console.error('Error handling answer:', error);
    }
}

console.log('WebRTC application started');
