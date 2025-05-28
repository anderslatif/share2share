import { getDataChannel } from "./webrtc.js";

// #######################################################
// Messaging
// #######################################################

export function offerCandidateSendsFileList(fileItems) {
    const dataChannel = getDataChannel();

    const fileList = fileItems.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
    }));
    const data = JSON.stringify({
        eventName: 'offerFileList',
        payload: fileList
    });

    dataChannel.send(data);
}

export function offerCandidateSendsFile(fileItem) {
	const dataChannel = getDataChannel();
    
	const chunkSize = 16 * 1024;
	const { blob, name, size, type } = fileItem;

	// Step 1: Send file metadata
	dataChannel.send(JSON.stringify({
		eventName: "fileMeta",
		payload: { name, size, type }
	}));

	// Step 2: Read and send file in chunks
	const reader = new FileReader();
	reader.onload = () => {
		let buffer = new Uint8Array(reader.result);
		let offset = 0;

		while (offset < buffer.length) {
			const chunk = buffer.slice(offset, offset + chunkSize);
			dataChannel.send(JSON.stringify({
                eventName: "fileChunk",
                payload: { data: Array.from(chunk) }
            }));
			offset += chunkSize;
		}

        dataChannel.send(JSON.stringify({
            eventName: "fileEnd",
            payload: { name }
        }));
	};

	reader.readAsArrayBuffer(blob);
}

export function answerCandidateRequestsAllFiles() {
    const dataChannel = getDataChannel();

    const data = JSON.stringify({
        eventName: 'answerRequestsAllFiles',
    });

    dataChannel.send(data);
}

export function answerCandidateRequestsAFile(fileName) {
    const dataChannel = getDataChannel();

    const data = JSON.stringify({
        eventName: 'answerRequestAFile',
        payload: { name: fileName }
    });

    dataChannel.send(data);
}


// #######################################################
// Message Handling
// #######################################################

export function offerCandidateReceivedMessage(event, fileItems) {
    const data = JSON.parse(event.data);
    console.log("Received message from offer candidate:", data);

    if (data.eventName === 'answerRequestAllFiles', fileItems) {
        fileItems.forEach((fileItem) => {
            offerCandidateSendsFile(fileItem);
        });
    } else if (data.eventName === 'answerRequestAFile') {
        // Handle a single file received from the offer candidate
        console.log("Received file item:", data.payload);
        // Process the file item as needed
    }
}

let incomingFile = null;
let receivedChunks = [];

export function answerCandidateReceivedMessage(event) {
    const data = JSON.parse(event.data);
    console.log("Received message from offer candidate:", data);

    if (data.eventName === 'offerFileList') {
        console.log("Received file list:", data.payload);
    } else if (data.eventName === 'fileMeta') {
        console.log("Received file metadata:", data.payload);
        incomingFile = {
            name: data.payload.name,
            size: data.payload.size,
            type: data.payload.type
        };
        receivedChunks = [];
    } else if (data.eventName === 'fileChunk') {
        const chunk = Uint8Array.from(data.payload.data);
        receivedChunks.push(chunk);
    } else if (data.eventName === 'fileEnd') {
        const blob = new Blob(receivedChunks, { type: incomingFile.type });
        const url = URL.createObjectURL(blob);
        const anchorTag = document.createElement('a');
        anchorTag.href = url;
        anchorTag.download = incomingFile.name;
        anchorTag.style.display = 'none';
        document.body.appendChild(anchorTag);
        anchorTag.click();
        document.body.removeChild(anchorTag);
        URL.revokeObjectURL(url);

        console.log("Downloaded file:", incomingFile.name);

        incomingFile = null;
        receivedChunks = [];
    }
}