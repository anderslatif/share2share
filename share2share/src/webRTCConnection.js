import { offerCandidateSendsFileList, 
    answerCandidateRequestsAllFiles, answerCandidateRequestsAFile,
    offerCandidateReceivedMessage, answerCandidateReceivedMessage } from "./webRTCHandlers.js";
import { showDownladReadyScreen } from "./screens.js";

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
let isOfferCandiate;
let shareId;

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] },
    { urls: ['stun:stun3.l.google.com:19302'] },
    { urls: ['stun:stun4.l.google.com:19302'] },   
  ]
};

export async function createOffer(fileItems) {    
    shareId = window.location.pathname.split('/').pop();

    isOfferCandiate = true;

    // Firestore
    const callDocument = firestore.collection('shares').doc(shareId);
    const offerCandidates = callDocument.collection('offerCandidates');
    const answerCandidates = callDocument.collection('answerCandidates');


    peerConnection = new RTCPeerConnection(servers);

    dataChannel = peerConnection.createDataChannel("files");
    dataChannel.onopen = () => {
        dataChannel.send(JSON.stringify({ eventName: "Connection established" }));
        console.log(fileItems);
        offerCandidateSendsFileList(fileItems);
    };
    dataChannel.onmessage = (event) => {
        offerCandidateReceivedMessage(event, fileItems);
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


export async function createAnswer() {
	const shareId = window.location.pathname.split('/').pop();

	const callDocument = firestore.collection("shares").doc(shareId);
	const offerCandidates = callDocument.collection("offerCandidates");
	const answerCandidates = callDocument.collection("answerCandidates");

	const callSnapshot = await callDocument.get();
	const data = callSnapshot.data();
	if (!callSnapshot.exists || !data?.offer) {
		console.error("No offer found.");
		return;
	}
	if (data.status === "closed") {
        alert("The sender has already left the session.");
        return;
	}

	peerConnection = new RTCPeerConnection(servers);

	peerConnection.onicecandidate = (event) => {
		event.candidate && answerCandidates.add(event.candidate.toJSON());
	};

	peerConnection.ondatachannel = (event) => {
    showDownladReadyScreen();

	  dataChannel = event.channel;
	  dataChannel.onmessage = (event) => {
	    answerCandidateReceivedMessage(event);
	  };
	};

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

	callDocument.onSnapshot((snapshot) => {
	  const updated = snapshot.data();
	  if (updated?.status === "closed") {
	    alert("The sender has just left the session.");
	    dataChannel?.close();
	    peerConnection?.close();
	  }
	});
}

export function getDataChannel() {
    return dataChannel;
}

// Handle if the offer candidate peer leaves
window.addEventListener("beforeunload", () => {
	if (isOfferCandiate && dataChannel) {
		dataChannel.close();
		firestore.collection('shares').doc(shareId).update({ status: 'closed' });
	}
});