import { answerCandidateRequestsAllFiles } from "./fileTransfer.js";

// #######################################################
// Drag and Drop + File Explorer Screens
// #######################################################

export function showDragAndDropWithFileExplorerScreen() {
    document.getElementById("screen-wrapper").innerHTML = `
    	<div id="global-drop-zone" class="drop-zone initial">
    		<h3>drop files or folders to share</h3>
    		<span class="icon">+</span>
    	</div>
    	<div class="file-explorer">
    		<div class="items-list"></div>
    		<button id="start-sharing-button">Start Sharing</button>
    	</div>
    `;
}


export function renderFileExplorerItems(items, level = 0, parent = null) {
	const itemsList = document.querySelector('.items-list');
	if (!itemsList) return;
	itemsList.innerHTML = items.map(item => {
		const isFolder = item.type === 'folder';
		const isOpen = item.isOpen;
		const indent = level * 20;
		return `
			<div class="item ${isFolder ? 'is-folder' : 'is-file'}" 
				 style="margin-left: ${indent}px"
				 data-name="${item.name}">
				<span class="icon" onclick="fileExplorer.toggleFolder('${item.name}')" style="cursor: pointer;">${isFolder ? (isOpen ? '📂' : '📁') : '📄'}</span>
				<span class="name">${item.name}</span>
				<button class="delete-btn" onclick="fileExplorer.deleteItem('${item.name}')">🗑️</button>
			</div>
			${isFolder && isOpen ? `
				<div class="folder-content">
					${renderFileExplorerItems(item.items || [], level + 1, item)}
				</div>
			` : ''}
		`;
	}).join('');
}

export function animateItemEnter(name) {
	const item = document.querySelector(`[data-name="${name}"]`);
	if (item) {
		item.classList.add('item-enter');
		setTimeout(() => item.classList.remove('item-enter'), 300);
	}
}

// #######################################################
// Ready to Share Screens
// #######################################################

export function showShareLinkScreen(shareId) {
	document.getElementById("screen-wrapper").innerHTML = `
		<div id="ready-to-share">
			<h1>You are ready to share your files!</h1>
			<h2>Share Link</h2>
			<input type="text" id="share-link" readonly value="${window.location.origin}/share/${shareId}" />
			<button id="copy-link-button">Copy Link</button>
		</div>
	`;
}

export function showDownloadScreen() {
	document.getElementById("screen-wrapper").innerHTML = `
		<div id="global-drop-zone" class="drop-zone">
			<h3>drop files or folders to share</h3>
			<span class="icon">+</span>
		</div>
		<div id="ready-to-download">
			<h1>Files are ready to download!</h1>
			<button id="download-all-files">Download All Files</button>
		</div>
	`;

  document.getElementById('download-all-files').addEventListener('click', answerCandidateRequestsAllFiles);
}

// #######################################################
// WebRTC Screens
// #######################################################

// the offer peer left the session