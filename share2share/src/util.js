import { createOffer } from "./webRTCConnection.js";
import { showShareLinkScreen } from "./screens.js";
import { generate } from 'random-words';

export function createShareLink() {
    // todo using a hardcoded id while developing
    // const shareId = "shareId";
	const shareId = generate({ min: 3, max: 5, join: "_" });
  
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    history.pushState(null, '', shareUrl);
  
    showShareLinkScreen(shareId);

    createOffer(fileExplorer.items);
}

export function downloadFileLocally(blob, name) {
	const url = URL.createObjectURL(blob);
	const anchorTag = document.createElement('a');
	anchorTag.href = url;
	anchorTag.download = name;
	anchorTag.style.display = 'none';
	document.body.appendChild(anchorTag);
	anchorTag.click();
	document.body.removeChild(anchorTag);
	URL.revokeObjectURL(url);
}