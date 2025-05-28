import { renderFileExplorerItems, animateItemEnter } from './screens.js';

export class FileExplorer {
  constructor() {
    this.items = [];
    this.hasDropped = false;
    this.setupEventListeners();
    this.updateView();
  }

  setupEventListeners() {
    const globalDropZone = document.getElementById('global-drop-zone');
    let dragCounter = 0;

    // Show drop zone when dragging files anywhere
    document.addEventListener('dragenter', (e) => {
      if (e.dataTransfer && (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file'))) {
        dragCounter++;
        globalDropZone.classList.add('active');
      }
    });
    document.addEventListener('dragover', (e) => {
      if (e.dataTransfer && (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file'))) {
        e.preventDefault();
        globalDropZone.classList.add('active');
      }
    });
    document.addEventListener('dragleave', (e) => {
      dragCounter--;
      if (dragCounter <= 0) {
        globalDropZone.classList.remove('active');
        dragCounter = 0;
      }
    });
    document.addEventListener('drop', async (e) => {
      globalDropZone.classList.remove('active');
      dragCounter = 0;
      if (e.dataTransfer && (e.dataTransfer.files.length > 0)) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.items || e.dataTransfer.files);
        if (files.length > 0 && files[0].webkitGetAsEntry) {
          // Chrome/Edge: use webkitGetAsEntry for folders
          for (const item of e.dataTransfer.items) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await this.traverseFileTree(entry, '');
            }
          }
        } else {
          // Fallback: flat files, try to build tree from webkitRelativePath
          this.addDroppedFiles(Array.from(e.dataTransfer.files));
        }
        this.hasDropped = true;
        globalDropZone.classList.remove('initial');
        this.updateView();
      }
    });
  }

  // Recursively traverse dropped folders (webkitGetAsEntry API)
  async traverseFileTree(item, path) {
    if (item.isFile) {
      await new Promise((resolve) => {
        item.file((file) => {
          this.addFileByPath(path + file.name, file);
          resolve();
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const readEntries = async () => {
        return new Promise((resolve) => {
          dirReader.readEntries(async (entries) => {
            for (const entry of entries) {
              await this.traverseFileTree(entry, path + item.name + '/');
            }
            resolve();
          });
        });
      };
      await readEntries();
    }
  }

  // Add dropped files as flat items with relativePath and blob
  addDroppedFiles(files) {
    files.forEach(file => {
      const item = {
        name: file.name,
        type: 'file',
        size: file.size,
        lastModified: file.lastModified,
        relativePath: file.webkitRelativePath || file.name,
        blob: file
      };
      this.addItem(item);
    });
  }

  // Add a file to the nested structure by its path
  addFileByPath(path, file) {
    const parts = path.split('/').filter(Boolean);
    let current = this.items;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      let existing = current.find(item => item.name === part);
      if (!existing) {
        if (isFile) {
          existing = {
            name: part,
            type: 'file',
            size: file.size,
            lastModified: file.lastModified,
            blob: file
          };
        } else {
          existing = {
            name: part,
            type: 'folder',
            items: []
          };
        }
        current.push(existing);
      }
      if (!isFile) {
        current = existing.items;
      }
    }
  }

  addItem(item, parentItems = this.items) {
    parentItems.push(item);
    this.updateView();
    animateItemEnter(item.name);
  }

  deleteItem(itemName, parentItems = this.items) {
    const index = parentItems.findIndex(item => item.name === itemName);
    if (index !== -1) {
      const item = document.querySelector(`[data-name="${itemName}"]`);
      if (item) {
        item.classList.add('item-exit');
        setTimeout(() => {
          parentItems.splice(index, 1);
          this.updateView();
        }, 300);
      }
    } else {
      // Recursively search in folders
      for (const item of parentItems) {
        if (item.type === 'folder') {
          this.deleteItem(itemName, item.items);
        }
      }
    }
  }

  toggleFolder(itemName, parentItems = this.items) {
    const folder = parentItems.find(item => item.name === itemName && item.type === 'folder');
    if (folder) {
      folder.isOpen = !folder.isOpen;
      this.updateView();
    } else {
      for (const item of parentItems) {
        if (item.type === 'folder') {
          this.toggleFolder(itemName, item.items);
        }
      }
    }
  }

  updateView() {
    renderFileExplorerItems(this.items);
  }
}