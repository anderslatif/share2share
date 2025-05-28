import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDG7g9nhJrklCg5FAs9K5V7BJjNitA91YQ",
  authDomain: "share2share-webrtc.firebaseapp.com",
  projectId: "share2share-webrtc",
  storageBucket: "share2share-webrtc.firebasestorage.app",
  messagingSenderId: "1069598026521",
  appId: "1:1069598026521:web:c5cb394cb092b96684b388"
};


const app = firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// Global state
let peerConnection;
let dataChannel;

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] },
    { urls: ['stun:stun3.l.google.com:19302'] },
    { urls: ['stun:stun4.l.google.com:19302'] },   
  ]
};

export async function startCall() {
    // const shareId = window.location.pathname.split('/').pop();
    const shareId = "shareId"; // todo For testing, use a hardcoded ID

    // Firestore
    const callDocument = firestore.collection('calls').doc(shareId);
    const offerCandidates = callDocument.collection('offerCandidates');
    const answerCandidates = callDocument.collection('answerCandidates');


    peerConnection = new RTCPeerConnection(servers);

    dataChannel = peerConnection.createDataChannel("files");
    dataChannel.onopen = () => {
      dataChannel.send("hello");
    };

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    await callDocument.set({ offer: { sdp: offerDescription.sdp, type: offerDescription.type } });

    callDocument.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(answerDescription);
    }
});

answerCandidates.onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const candidate = new RTCIceCandidate(change.doc.data());
      if (peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(candidate).catch(console.error);
      }
    }
  });
});
}


export async function answerCall() {
	// const shareId = window.location.pathname.split('/').pop();
    const shareId = "shareId"; // todo For testing, use a hardcoded ID

	const callDocument = firestore.collection("calls").doc(shareId);
	const offerCandidates = callDocument.collection("offerCandidates");
	const answerCandidates = callDocument.collection("answerCandidates");

	peerConnection = new RTCPeerConnection(servers);

	peerConnection.onicecandidate = (event) => {
		event.candidate && answerCandidates.add(event.candidate.toJSON());
	};

	peerConnection.ondatachannel = (event) => {
	  dataChannel = event.channel;
	  dataChannel.onmessage = (event) => {
	    console.log("Received:", event.data);
	  };
	};

	const callSnapshot = await callDocument.get();
	if (!callSnapshot.exists || !callSnapshot.data()?.offer) {
		console.error("No offer found.");
		return;
	}

	await peerConnection.setRemoteDescription(new RTCSessionDescription(callSnapshot.data().offer));

	const answerDescription = await peerConnection.createAnswer();
	await peerConnection.setLocalDescription(answerDescription);
	await callDocument.update({ answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

	offerCandidates.onSnapshot((snapshot) => {
		snapshot.docChanges().forEach((change) => {
			if (change.type === "added") {
				peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(console.error);
			}
		});
	});
}

export function getDataChannel() {
  return dataChannel;
}
