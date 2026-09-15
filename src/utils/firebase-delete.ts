import { ref, listAll, deleteObject } from "firebase/storage";
import { getFirebaseStorage } from "../lib/firebase";

/**
 * Delete all files in a specific folder in Firebase Storage
 * @param folderPath - Path to folder (e.g., "users/veditor_uploads")
 */
export async function deleteFolder(folderPath: string): Promise<number> {
    const folderRef = ref(getFirebaseStorage(), folderPath);
    const result = await listAll(folderRef);

    let deletedCount = 0;

    // Delete all files in this folder
    for (const itemRef of result.items) {
        await deleteObject(itemRef);
        deletedCount++;
        console.log(`Deleted: ${itemRef.fullPath}`);
    }

    // Recursively delete subfolders
    for (const prefixRef of result.prefixes) {
        deletedCount += await deleteFolder(prefixRef.fullPath);
    }

    return deletedCount;
}

/**
 * Delete ALL files in Firebase Storage
 * WARNING: This will delete everything!
 */
export async function deleteAllStorage(): Promise<number> {
    const rootRef = ref(getFirebaseStorage(), "");
    const result = await listAll(rootRef);

    let totalDeleted = 0;

    // Delete files in root
    for (const itemRef of result.items) {
        await deleteObject(itemRef);
        totalDeleted++;
        console.log(`Deleted: ${itemRef.fullPath}`);
    }

    // Delete all folders
    for (const prefixRef of result.prefixes) {
        totalDeleted += await deleteFolder(prefixRef.fullPath);
    }

    console.log(`Total deleted: ${totalDeleted} files`);
    return totalDeleted;
}

/**
 * Delete a single file by its URL or path
 */
export async function deleteFile(filePath: string): Promise<void> {
    const fileRef = ref(getFirebaseStorage(), filePath);
    await deleteObject(fileRef);
    console.log(`Deleted: ${filePath}`);
}
