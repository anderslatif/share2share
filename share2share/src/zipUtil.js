import JSZip from "jszip";

export async function zipFolder(folder) {
	const zip = new JSZip();
	console.log("Zipping folder:", folder.name);
	const folderZip = zip.folder(folder.name);

	for (const item of folder.items) {
		if (item.type === "folder") {
			const subFolder = folderZip.folder(item.name);
			for (const subItem of item.items) {
				subFolder.file(subItem.name, subItem.blob);
			}
		} else {
			folderZip.file(item.name, item.blob);
		}
	}

	return await zip.generateAsync({ type: "blob" });
}