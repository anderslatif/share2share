import { answerCandidateRequestsAllFiles } from "./webRTCHandlers.js";
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



export function renderFileExplorerItems(items, level = 0, parentPath = '', options = {}) {
	const { showDownloadIcons = false } = options;
	if (!Array.isArray(items)) return '';

	const html = items.map((item) => {
		const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
		const isFolder = item.type === 'folder';
		const isOpen = item.isOpen;
		const indent = level * 20;
		return `
			<div class="item ${isFolder ? 'is-folder' : 'is-file'}"
				 style="margin-left: ${indent}px"
				 data-name="${item.name}"
				 data-path="${currentPath}">
				<span class="icon" style="cursor: pointer;">
					${isFolder
    ? (isOpen ? '📂' : '📁')
    :  '📄'}
				</span>
				<span class="name">${item.name}</span>
				<button class="${showDownloadIcons ? 'download-btn' : 'delete-btn'}">
					${showDownloadIcons ? '📥' : '🗑️'}
				</button>
			</div>
			${isFolder && isOpen ? `
				<div class="folder-content">
					${renderFileExplorerItems(item.items || [], level + 1, currentPath, options)}
				</div>
			` : ''}
		`;
	}).join('');

	if (level === 0) {
		const container = document.querySelector('#file-explorer .items-list');
		if (container) {
			container.innerHTML = html;

			// Remove previous handler
			if (explorerClickHandler) {
				container.removeEventListener('click', explorerClickHandler);
			}

			// Add new handler
			explorerClickHandler = (e) => {
				const itemEl = e.target.closest('.item');
				if (!itemEl) return;
				const name = itemEl.dataset.name;

				if (e.target.closest('.icon')) {
					if (window.fileExplorer?.toggleFolder) {
						window.fileExplorer.toggleFolder(name);
					}
				} else if (e.target.classList.contains('delete-btn')) {
					if (window.fileExplorer?.deleteItem) {
						window.fileExplorer.deleteItem(name);
					}
				} else if (e.target.classList.contains('download-btn')) {
					if (window.fileExplorer?.downloadItem) {
						window.fileExplorer.downloadItem(name);
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
		<div id="ready-to-share" class="centered-container">
			<h1 class="share-title">You're ready to share!</h1>
			<h3>Send this link to the person you want to share with.</h3>
			<div class="share-link-container">
				<input type="text" id="share-link" readonly value="${window.location.origin}/share/${shareId}" />
				<button id="copy-link-button" title="Copy to clipboard">📋</button>
				<span id="copy-feedback" class="copy-feedback">Copied!</span>
			</div>
		</div>
	`;

	const input = document.getElementById("share-link");
	const feedback = document.getElementById("copy-feedback");
	const copyButton = document.getElementById("copy-link-button");

	if (copyButton && input && feedback) {
		copyButton.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(input.value);
				feedback.classList.add("show");
				setTimeout(() => feedback.classList.remove("show"), 1500);
			} catch (err) {
				console.error("Failed to copy: ", err);
			}
		});
	}
}

// #######################################################
// Download Screens
// #######################################################


export function showDownloadConnectingScreen() {
	document.getElementById("screen-wrapper").innerHTML = `
		<div id="ready-to-download">
			<h1 id="answer-candidate-message">Trying to connect...</h1>
		</div>
	`;
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
      <h1>Files to Download</h1>
      <div id="file-explorer">
      	<button id="download-all-button">Download All</button>
        <div class="items-list"></div>
      </div>
      <button id="download-all-button">Start Download</button>
    </div>
  `;
  window.fileExplorer = new DownloadFileExplorer(files);
  
  document.getElementById('download-all-button').addEventListener('click', answerCandidateRequestsAllFiles);
}
