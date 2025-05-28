import './style.css';

import { FileExplorer } from './fileexplorer.js';
import { createAnswer } from './webrtc.js';
import { showDragAndDropWithFileExplorerScreen, showShareLinkScreen, showDownloadConnectingScreen } from './screens.js';






document.addEventListener('DOMContentLoaded', () => {
  // This is the peer the uploads files and wants to share
  if (window.location.pathname === '/') {
    showDragAndDropWithFileExplorerScreen();
    globalThis.fileExplorer = new FileExplorer();
  }

  // This is the other peer that is being shared with
  if (window.location.pathname.startsWith('/share/')) {
    showDownloadConnectingScreen();
    createAnswer();
  }
});