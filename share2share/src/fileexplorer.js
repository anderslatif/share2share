import { renderFileExplorerItems, animateItemEnter, animateItemExit } from './screens.js';
import { downloadFileLocally } from './util.js';
import { zipFolder } from './zipUtil.js';

export class BaseFileExplorer {
	constructor(items = []) {
		this.items = items;
	}

	toggleFolder(name) {
		const item = this.findItemByName(name, this.items);
		if (item && item.type === 'folder') {
			item.isOpen = !item.isOpen;
			this.updateView();
		}
	}

	findItemByName(name, list) {
		for (const item of list) {
			if (item.name === name) return item;
			if (item.type === 'folder') {
				const found = this.findItemByName(name, item.items || []);
				if (found) return found;
			}
		}
		return null;
	}

	updateView(isDownloadMode = false) {
		const itemsList = document.querySelector('#file-explorer .items-list');
		if (!itemsList) return;

		const showDownloadIcons = this instanceof DownloadFileExplorer;
		renderFileExplorerItems(this.items, 0, null, isDownloadMode);
	}
}

export class UploadFileExplorer extends BaseFileExplorer {
  constructor() {
    super([]);
    this.hasDropped = false;

    this.setupEventListeners();
    this.updateView();
  }

  setupEventListeners() {
    const globalDropZone = document.getElementById('global-drop-zone');
    let dragCounter = 0;

    // Show drop zone when dragging files anywhere
    document.addEventListener('dragenter', (event) => {
      if (event.dataTransfer && (event.dataTransfer.types.includes('Files') || event.dataTransfer.types.includes('application/x-moz-file'))) {
        dragCounter++;
        globalDropZone.classList.add('active');
      }
    });
    document.addEventListener('dragover', (event) => {
      if (event.dataTransfer && (event.dataTransfer.types.includes('Files') || event.dataTransfer.types.includes('application/x-moz-file'))) {
        event.preventDefault();
        globalDropZone.classList.add('active');
      }
    });
    document.addEventListener('dragleave', (event) => {
      dragCounter = Math.max(0, dragCounter - 1);
      if (dragCounter === 0) {
        globalDropZone.classList.remove('active');
      }
    });
    document.addEventListener('drop', async (event) => {
      globalDropZone.classList.remove('active');
      dragCounter = 0;
      if (event.dataTransfer && (event.dataTransfer.files.length > 0)) {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.items || event.dataTransfer.files);
        if (files.length > 0 && files[0].webkitGetAsEntry) {
          // Chrome/Edge: use webkitGetAsEntry for folders
          for (const item of event.dataTransfer.items) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await this.traverseFileTree(entry, '');
            }
          }
        } else {
          // Fallback: flat files, try to build tree from webkitRelativePath
          this.addDroppedFiles(Array.from(event.dataTransfer.files));
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
      const currentPath = path + item.name + '/';

      const dirReader = item.createReader();
      const readEntries = async () => {
        return new Promise((resolve) => {
          dirReader.readEntries(async (entries) => {
            for (const entry of entries) {
              await this.traverseFileTree(entry, currentPath);
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
          const fileItem = {
            name: part,
            type: 'file',
            size: file.size,
            lastModified: file.lastModified,
            blob: file
          };
          this.addItem(fileItem, current);
          return;
        } else {
          existing = {
            name: part,
            type: 'folder',
            items: []
          };
          current.push(existing);
        }
      }
      if (!isFile) {
        current = existing.items;
      }
    }
  }

  addItem(item, parentItems = this.items) {
    if (parentItems.some(existing => existing.name === item.name)) return;
    parentItems.push(item);
    this.updateView();
    animateItemEnter(item.name);
  }

  deleteItem(itemName, parentItems = this.items) {
    const index = parentItems.findIndex(item => item.name === itemName);
    if (index !== -1) {
      animateItemExit(itemName, () => {
        parentItems.splice(index, 1);
        this.updateView();
      });
      return true;
    }
    for (const item of parentItems) {
      if (item.type === 'folder') {
        if (this.deleteItem(itemName, item.items)) return true;
      }
    }
    return false;
  }
}

export class DownloadFileExplorer extends BaseFileExplorer {
	constructor(items) {
		super(items);
    const isDownloadMode = true;
		this.updateView(isDownloadMode);
	}

	deleteItem() {
		// No-op in download mode
	}
}