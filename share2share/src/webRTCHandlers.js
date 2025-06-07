import { getDataChannel } from "./webRTCConnection.js";
import { showDownloadWithFileListScreen, addFilesTransferredItem } from "./screens.js";
import { downloadFileLocally } from "./util.js";
import { zipFolder } from "./zipUtil.js";
import { file } from "jszip";

// #######################################################
// Messaging
// #######################################################

export function offerCandidateSendsFileList(fileItems) {
    const dataChannel = getDataChannel();

    function sanitizeForTransfer(item) {
        const base = {
            name: item.name,
            type: item.type,
            size: item.size,
            lastModified: item.lastModified
        };
        if (item.type === "folder") {
            base.items = (item.items || []).map(sanitizeForTransfer);
        }
        return base;
    }

    const sanitizedList = fileItems.map(sanitizeForTransfer);
    const data = JSON.stringify({
        eventName: 'offerFileList',
        payload: sanitizedList
    });

    dataChannel.send(data);
}

export async function offerCandidateSendsFile(fileItem) {
	const dataChannel = getDataChannel();
	const chunkSize = 16 * 1024;

	if (fileItem.type === "folder") {
		const zippedBlob = await zipFolder(fileItem);
		console.log('Zipped folder blob:', zippedBlob);
		fileItem = {
			blob: zippedBlob,
			name: fileItem.name + ".zip",
			size: zippedBlob.size,
			type: zippedBlob.type
		};
	}

	const { blob, name, size, type } = fileItem;

	// Step 1: Send file metadata
	dataChannel.send(JSON.stringify({
		eventName: "fileMeta",
		payload: { name, size, type }
	}));

	// Step 2: Read and send file in chunks, wrapped in a Promise
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = () => {
			let buffer = new Uint8Array(reader.result);
			let offset = 0;

			while (offset < buffer.length) {
				const chunk = buffer.slice(offset, offset + chunkSize);
				dataChannel.send(JSON.stringify({
					eventName: "fileChunk",
					payload: {
						name,
						data: Array.from(chunk)
					}
				}));
				offset += chunkSize;
			}

			dataChannel.send(JSON.stringify({
				eventName: "fileEnd",
				payload: { name }
			}));

			resolve();
		};

		reader.readAsArrayBuffer(blob);
	});
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
        eventName: 'answerRequestsAFile',
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

    if (data.eventName === 'answerRequestsAllFiles' && Array.isArray(fileItems)) {
        fileItems.forEach((fileItem) => {
            offerCandidateSendsFile(fileItem);
            addFilesTransferredItem(fileItem.name);
        });
    } else if (data.eventName === 'answerRequestsAFile') {
        const requestedName = data.payload.name;
        console.log("Received file request for:", requestedName);


        const fileItem = fileItems.find(item => item.name === requestedName);
        if (fileItem) {
            offerCandidateSendsFile(fileItem);
            addFilesTransferredItem(fileItem.name);
        } else {
            console.warn("Requested file not found:", requestedName);
        }
    }
}

let activeTransfers = new Map();  // key = file name

export function answerCandidateReceivedMessage(event) {
    const data = JSON.parse(event.data);
    console.log("Received message from offer candidate:", data);

    if (data.eventName === 'offerFileList') {
        showDownloadWithFileListScreen(data.payload);
        console.log("Received file list:", data.payload);
    } else if (data.eventName === 'fileMeta') {
        console.log("Received file metadata:", data.payload);
        const { name, size, type } = data.payload;
        activeTransfers.set(name, { type, chunks: [] });
    } else if (data.eventName === 'fileChunk') {
        const { name, data: chunkData } = data.payload;
        if (!activeTransfers.has(name)) {
            console.warn("fileChunk received for unknown file:", name);
            return;
        }
        const chunk = Uint8Array.from(chunkData);
        activeTransfers.get(name).chunks.push(chunk);
    } else if (data.eventName === 'fileEnd') {
        const { name } = data.payload;
        const transfer = activeTransfers.get(name);
        if (!transfer) {
            console.warn("fileEnd received for unknown file:", name);
            return;
        }
        const blob = new Blob(transfer.chunks, { type: transfer.type });
        downloadFileLocally(blob, name);
        console.log("Downloaded file:", name);
        activeTransfers.delete(name);
    }
}