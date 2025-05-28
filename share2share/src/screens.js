import { answerCandidateRequestsAllFiles } from "./fileTransfer.js";

// #######################################################
// Drag and Drop Screens
// #######################################################


// #######################################################
// Ready to Share Screens
// #######################################################

export function createTheShareLinkScreen(shareId) {
  document.getElementById('global-drop-zone').classList.remove('initial');
  const fileExplorer = document.querySelector('.file-explorer');
  fileExplorer.style.display = 'none';
  
  const shareLink = document.getElementById('share-link');
  shareLink.value = `${window.location.origin}/share/${shareId}`;


  document.getElementById('share-link').value = `${window.location.origin}/share/${shareId}`;
  document.getElementById('ready-to-share').style.display = 'block';
}

export function createTheDownloadScreen() {
  document.getElementById('global-drop-zone').classList.remove('initial');
  const fileExplorer = document.querySelector('.file-explorer');
  fileExplorer.style.display = 'none';

  document.getElementById('ready-to-download').style.display = 'block';

  const downloadAllFilesButton = document.getElementById('download-all-files');
  downloadAllFilesButton.addEventListener('click', answerCandidateRequestsAllFiles);

}

// #######################################################
// WebRTC Screens
// #######################################################

// the offer peer left the session