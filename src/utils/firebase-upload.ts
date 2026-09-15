import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "../lib/firebase";

export interface FirebaseUploadResult {
    url: string;
    fileName: string;
    filePath: string;
    contentType: string;
}

/**
 * Upload a file directly to Firebase Storage from the client
 */
export async function uploadFileToFirebase(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<FirebaseUploadResult> {
    // Create unique path: users/{userId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `users/${userId}/${timestamp}_${safeName}`;
    const storageRef = ref(getFirebaseStorage(), filePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || "video/mp4",
        contentDisposition: `attachment; filename="${file.name || 'veditor-export.mp4'}"`,
    });

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(Math.round(progress));
            },
            (error) => {
                console.error("Firebase upload error:", error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                        url: downloadURL,
                        fileName: file.name,
                        filePath,
                        contentType: file.type,
                    });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

/**
 * Upload a single file and return the Firebase URL
 * Used for SSR export to upload local media before rendering
 */
export async function uploadSingleFileToFirebase(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    const result = await uploadFileToFirebase(
        file,
        "veditor_uploads", // Default folder for general uploads
        onProgress
    );
    return result.url;
}
