# share2share

Peer2Peer file sharing website using WebRTC.

<img src="https://github.com/anderslatif/share2share/raw/main/share2share/public/share2share_logo.png" alt="share2share logo" width="150"/>

https://share2share.vercel.app/

Hopefully the website is intuitive enough to use without documentation. This `README.md` is more an overview of the codebase. 

---

## WebRTC Events

### Offer Candidate (Sent by the person sharing files)

| Event Name     | Description                                                                                          |
|----------------|------------------------------------------------------------------------------------------------------|
| `offerFileList`| Sends the list of files and folders. Contains nested information                                     |
| `fileMeta`     | 1. step in transferring a file. Contains `name`, `size`, `type`                                      |
| `fileChunk`    | 2. step in transferring file. Sends a chunk of the file. Repeats due to transfer limits in WebRTC.   |
| `fileEnd`      | 3. step in transferring file. Indicates that the file transfer is complete.                          |

Note: Since folders cannot be created on the host machine by the browser, a zipped file is created and sent instead. The steps follow as it would for a file. 

### Answer Candidate (Sent by person receiving files)

| Event Name               | Description                                                  |
|--------------------------|--------------------------------------------------------------|
| `answerRequestsAllFiles` | The answer candidate requests to download all files.         |
| `answerRequestsAFile`    | The answer candidate requests a specific file.               |

