import './style.css';

import { FileExplorer } from './fileexplorer.js';
import { createOffer, createAnswer } from './webrtc.js';
import { showDragAndDropWithFileExplorerScreen, showShareLinkScreen, showDownloadScreen } from './screens.js';


showDragAndDropWithFileExplorerScreen();


globalThis.fileExplorer = new FileExplorer();

document.getElementById('start-sharing-button').addEventListener('click', () => {
  console.log(fileExplorer.items);

  // todo using a hardcoded id while developing
  // const shareId = Math.random().toString(36).substring(2, 15);
  const shareId = "shareId";

  const shareUrl = `${window.location.origin}/share/${shareId}`;
  history.pushState(null, '', shareUrl);

  showShareLinkScreen(shareId);

  createOffer(fileExplorer.items);
});

document.addEventListener('DOMContentLoaded', () => {
  // todo for testing I will create the peer connection immediately for this path 
  if (window.location.pathname.startsWith('/share0')) {
    console.log("Ready to share");
    createOffer();
  }

  // This is the other peer that is being shared with
  if (window.location.pathname.startsWith('/share/')) {
    const shareId = window.location.pathname.split('/').pop();

    showDownloadScreen();

    console.log("Ready to connect");
    createAnswer();
  }
});