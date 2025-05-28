import './style.css';

import { FileExplorer } from './fileexplorer.js';
import { startCall, answerCall } from './webrtc.js';
import { createTheShareLinkScreen, createTheDownloadScreen } from './screens.js';

globalThis.fileExplorer = new FileExplorer();

document.getElementById('start-sharing-button').addEventListener('click', () => {
  console.log(fileExplorer.items);

  // todo using a hardcoded id while developing
  // const shareId = Math.random().toString(36).substring(2, 15);
  const shareId = "shareId";

  const shareUrl = `${window.location.origin}/share/${shareId}`;
  history.pushState(null, '', shareUrl);

  createTheShareLinkScreen(shareId);
 
});

document.addEventListener('DOMContentLoaded', () => {
  // todo for testing I will create the peer connection immediately for this path 
  if (window.location.pathname.startsWith('/share0')) {
    console.log("Ready to share");
    startCall();
  }

  // This is the other peer that is being shared with
  if (window.location.pathname.startsWith('/share/')) {
    const shareId = window.location.pathname.split('/').pop();

    createTheDownloadScreen();

    console.log("Ready to connect");
    answerCall();
  }
});