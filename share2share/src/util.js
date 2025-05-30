import { createOffer } from "./webRTCConnection.js";
import { showShareLinkScreen } from "./screens.js";

export function createShareLink() {
    // console.log(fileExplorer.items);
  
    // todo using a hardcoded id while developing
    // const shareId = Math.random().toString(36).substring(2, 15);
    const shareId = "shareId";
  
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    history.pushState(null, '', shareUrl);
  
    showShareLinkScreen(shareId);
  
    setTimeout(() => {
    	const input = document.getElementById("transfer-link");
    	const feedback = document.getElementById("copy-feedback");
    	const copyButton = document.getElementById("copy-link-button");

    	const showFeedback = () => {
    		if (!feedback) return;
    		feedback.classList.add("show");
    		setTimeout(() => {
    			feedback.classList.remove("show");
    		}, 1500);
    	};

    	// Show visual feedback once after screen is shown (no clipboard interaction)
    	setTimeout(() => {
    		feedback.classList.add("show");
    		setTimeout(() => feedback.classList.remove("show"), 1500);
    	}, 100);

    	if (copyButton && input) {
    		copyButton.addEventListener("click", async () => {
    			try {
    				await navigator.clipboard.writeText(input.value);
    				showFeedback();
    			} catch (err) {
    				console.error("Failed to copy: ", err);
    			}
    		});
    	}
    }, 0);

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