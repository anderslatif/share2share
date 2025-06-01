import { answerCandidateRequestsAllFiles, answerCandidateRequestsAFile } from "./webRTCHandlers.js";
import { createShareLink } from "./util.js";
import { DownloadFileExplorer } from "./fileExplorer.js";

// #######################################################
// Drag and Drop + File Explorer Screens
// #######################################################

let explorerClickHandler = null;

export function showDragAndDropWithFileExplorerScreen() {
    document.getElementById("screen-wrapper").innerHTML = `
    	<div id="global-drop-zone" class="drop-zone initial">
    		<h3>drop files or folders to share</h3>
    		<span class="icon">+</span>
    	</div>
    	<div id="file-explorer">
    		<div class="items-list"></div>
    		<button id="start-sharing-button">Start Sharing</button>
    	</div>
    `;

    document.getElementById('start-sharing-button').addEventListener('click', createShareLink);
}



export function renderFileExplorerItems(items, level = 0, parentPath = '', isDownloadMode) {
	if (!Array.isArray(items)) return '';

	const html = items.map((item, index) => {
		const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
		const isFolder = item.type === 'folder';
		const isOpen = item.isOpen;
		const indent = level * 20;
		return `
			<div class="item ${isFolder ? 'is-folder' : 'is-file'} ${index % 2 === 0 ? 'even' : 'odd'}"
				 style="margin-left: ${indent}px"
				 data-name="${item.name}"
				 data-path="${currentPath}">
				<span class="icon" style="cursor: pointer;">
					${isFolder? (isOpen ? '📂' : '📁') :  '📄'}
				</span>
				<span class="name">${item.name}</span>
				<button class="${isDownloadMode ? 'download-btn' : 'delete-btn'}"
					data-path="${currentPath}"
					title="${isDownloadMode ? 'Download this item only' : 'Delete this item'}">
					${isDownloadMode ? '📥' : '🗑️'}
				</button>
			</div>
			${isFolder && isOpen ? `
				<div class="folder-content">
					${renderFileExplorerItems(item.items || [], level + 1, currentPath, isDownloadMode)}
				</div>
			` : ''}
		`;
	}).join('');

	const container = document.querySelector('#file-explorer .items-list');
	if (container) {
		container.innerHTML = html;

		// Only add the handler once
		if (!explorerClickHandler) {
			explorerClickHandler = (e) => {
				const itemEl = e.target.closest('.item');
				if (!itemEl) return;
				const name = itemEl.dataset.name;

				if (e.target.closest('.icon')) {
					window.fileExplorer?.toggleFolder?.(name);
					renderFileExplorerItems(window.fileExplorer.items, 0, '', isDownloadMode);
				} else if (e.target.classList.contains('delete-btn')) {
					window.fileExplorer?.deleteItem?.(name);
				} else if (e.target.classList.contains('download-btn')) {
					e.stopPropagation();
					const path = e.target.dataset.path;
					console.log("Download button clicked. Path:", path);
					if (path) {
						answerCandidateRequestsAFile(path);
					}
				}
			};
			container.addEventListener('click', explorerClickHandler);
		}
	}

	return html;
}

export function animateItemEnter(name) {
	const item = document.querySelector(`[data-name="${name}"]`);
	if (item) {
		item.classList.add('item-enter');
		setTimeout(() => item.classList.remove('item-enter'), 300);
	}
}

export function animateItemExit(name, callback) {
	const item = document.querySelector(`[data-name="${name}"]`);
	if (!item) return callback();
	item.classList.add('item-exit');
	setTimeout(() => {
		callback();
	}, 300);
}

// #######################################################
// Ready to Share Screens
// #######################################################

export function showShareLinkScreen(shareId) {
	document.getElementById("screen-wrapper").innerHTML = `
		<div id="ready-to-transfer">
			<h1 class="transfer-title">You're ready to share!</h1>
			<h3>Send this link to the person you want to share with.</h3>
			<div class="transfer-link-container">
				<input type="text" id="transfer-link" readonly value="${window.location.origin}/share/${shareId}" />
				<button id="copy-link-button" title="Copy to clipboard">📋</button>
				<span id="copy-feedback" class="copy-feedback">Copied!</span>
			</div>
		</div>
		<h2>Files Transferred:</h2>
		<div id="files-transferred"></div>
	`;

	const input = document.getElementById("transfer-link");
	const feedback = document.getElementById("copy-feedback");
	const copyButton = document.getElementById("copy-link-button");

	navigator.clipboard.writeText(input.value).then(() => {
		feedback.classList.add("show");
		setTimeout(() => feedback.classList.remove("show"), 1500);
	}).catch((error) => {
		console.error("Auto-copy failed:", error);
	});

	if (copyButton && input && feedback) {
		copyButton.addEventListener("click", () => {
			navigator.clipboard.writeText(input.value).then(() => {
				feedback.classList.add("show");
				setTimeout(() => feedback.classList.remove("show"), 1500);
			}).catch((error) => {
				console.error("Auto-copy failed:", error);
			});
		});
	}

}

export function addFilesTransferredItem(fileName) {
	const filesTransferred = document.getElementById("files-transferred");

	const filesTransferredItemP = document.createElement("p");
	filesTransferredItemP.textContent = fileName;

	filesTransferred.appendChild(filesTransferredItemP);
}

	
export function sharingConnectionFailedScreen() {
	document.getElementById("screen-wrapper").innerHTML = `
		<div id="sharing-connection-failed">
			<h1 class="connection-failed-header">Connection to Peer Failed</h1>
			<p>There was an error connecting to the peer.</p>
			<p>Please try to share the files from scratch and create a new connection.</p>
			<button id="retry-button">Retry</button>
		</div>
	`;
	document.getElementById("retry-button")?.addEventListener("click", () => {
		window.location.href = "/";
	});
}

// #######################################################
// Download Screens
// #######################################################


export function showDownloadConnectingScreen() {
	document.getElementById("screen-wrapper").innerHTML = `
		<div id="ready-to-download">
			<h1 id="answer-candidate-message">Trying to connect...</h1>
			<animated-icons
				src="https://animatedicons.co/get-icon?name=API&style=minimalistic&token=f4327d0c-f900-40d7-9528-0164114431ff"
				trigger="loop"
				attributes='{"variationThumbColour":"#FFFFFF","variationName":"Normal","variationNumber":1,"numberOfGroups":1,"backgroundIsGroup":false,"strokeWidth":1,"defaultColours":{"group-1":"#000000","background":"#FFFFFF"}}'
				height="200"
				width="200"
			></animated-icons>
		</div>
	`;

	// Add the animated icons script dynamically
	const script = document.createElement('script');
	script.src = "https://animatedicons.co/scripts/embed-animated-icons.js";
	script.async = true;
	document.body.appendChild(script);
}

export function showDownladReadyScreen() {
  document.getElementById("screen-wrapper").innerHTML = `
    <div id="download-file-list">
      <h1>Ready to download!</h1>
      <button id="start-download-button">Start Download</button>
    </div>
  `;
}

export function showDownloadWithFileListScreen(files) {
  document.getElementById("screen-wrapper").innerHTML = `
    <div id="download-file-list">
	<button id="download-all-button">Download All</button>
      <div id="file-explorer">
	  <div class="items-list"></div>
      </div>
    </div>
  `;
  window.fileExplorer = new DownloadFileExplorer(files);
  
  document.getElementById('download-all-button').addEventListener('click', answerCandidateRequestsAllFiles);
}

export function connectionFailedScreen() {
	document.getElementById("screen-wrapper").innerHTML = `
		<div id="connection-failed">
			<h1 class="connection-failed-header">Connection Failed</h1>
			<p>There was an error connecting to the peer.</p>
			<p>Please get the sender to start the process over again and send you a new link.</p>
		</div>
	`;
}	