import './style.css';

import { FileExplorer } from './fileexplorer.js';

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

function createTheShareLinkScreen(shareId) {
  document.getElementById('global-drop-zone').classList.remove('initial');
  const fileExplorer = document.querySelector('.file-explorer');
  fileExplorer.style.display = 'none';
  
  const shareLink = document.getElementById('share-link');
  shareLink.value = `${window.location.origin}/share/${shareId}`;


  document.getElementById('share-link').value = `${window.location.origin}/share/${shareId}`;
  document.getElementById('ready-to-share').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.startsWith('/share/')) {
    const shareId = window.location.pathname.split('/').pop();
    createTheShareLinkScreen(shareId);

    // todo this must be the other peer, handle their connection
  }
});