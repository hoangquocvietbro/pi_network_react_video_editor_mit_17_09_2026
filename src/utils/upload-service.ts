import axios from "axios";
import { uploadFileToFirebase, uploadSingleFileToFirebase } from "./firebase-upload";
export type UploadProgressCallback = (uploadId: string, progress: number) => void;

export type UploadStatusCallback = (uploadId: string, status: 'uploaded' | 'failed', error?: string) => void;

export interface UploadCallbacks {
  onProgress: UploadProgressCallback;
  onStatus: UploadStatusCallback;
}

export async function processFileUpload(
  uploadId: string,
  file: File,
  callbacks: UploadCallbacks
): Promise<any> {
  try {
    // Upload directly to Firebase Storage
    const result = await uploadFileToFirebase(
      file,
      "veditor_uploads",
      (progress) => callbacks.onProgress(uploadId, progress)
    );

    // Construct upload data from uploadInfo
    const uploadData = {
      fileName: result.fileName,
      filePath: result.filePath,
      fileSize: file.size,
      contentType: result.contentType,
      metadata: { uploadedUrl: result.url },
      folder: null,
      type: result.contentType.split("/")[0],
      method: "direct",
      origin: "user",
      status: "uploaded",
      isPreview: false,
    };

    callbacks.onStatus(uploadId, 'uploaded');
    return uploadData;
  } catch (error) {
    callbacks.onStatus(uploadId, 'failed', (error as Error).message);
    throw error;
  }
}

export async function processUrlUpload(
  uploadId: string,
  url: string,
  callbacks: UploadCallbacks
): Promise<any[]> {
  try {

    // For URL uploads, we'll use the URL directly without uploading to Firebase
    // This is because the URL is already publicly accessible
    callbacks.onProgress(uploadId, 50);

    // Extract filename from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1] || "unknown";

    // Determine content type from extension
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    let contentType = "application/octet-stream";
    if (["mp4", "webm", "mov", "avi"].includes(ext)) {
      contentType = `video/${ext === "mov" ? "quicktime" : ext}`;
    } else if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
      contentType = `audio/${ext}`;
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;
    }

    const uploadData = {
      fileName,
      filePath: url,
      fileSize: 0,
      contentType,
      metadata: { originalUrl: url },
      folder: null,
      type: contentType.split("/")[0],
      method: "url",
      origin: "user",
      status: "uploaded",
      isPreview: false,
    };

    // Complete
    callbacks.onProgress(uploadId, 100);
    callbacks.onStatus(uploadId, 'uploaded');
    return [uploadData];
  } catch (error) {
    callbacks.onStatus(uploadId, 'failed', (error as Error).message);
    throw error;
  }
}

export async function processUpload(
  uploadId: string,
  upload: { file?: File; url?: string },
  callbacks: UploadCallbacks
): Promise<any> {
  if (upload.file) {
    return await processFileUpload(uploadId, upload.file, callbacks);
  }
  if (upload.url) {
    return await processUrlUpload(uploadId, upload.url, callbacks);
  }
  callbacks.onStatus(uploadId, 'failed', 'No file or URL provided');
  throw new Error('No file or URL provided');
}
/**
 * Upload a single file and return the Firebase URL.
 * Used by SSR export to upload local media before rendering.
 */
export async function uploadSingleFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return uploadSingleFileToFirebase(file, onProgress);
}