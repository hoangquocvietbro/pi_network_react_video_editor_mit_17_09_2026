import { create } from "zustand";
import { persist } from "zustand/middleware";
import { processUpload, type UploadCallbacks } from "@/utils/upload-service";
import { nanoid } from "nanoid";
interface UploadFile {
	id: string;
	file?: File;
	url?: string;
	type?: string;
	status?: 'pending' | 'uploading' | 'uploaded' | 'failed';
	progress?: number;
	error?: string;
}
// New LocalMedia interface for blob URL workflow
export interface LocalMedia {
	id: string;
	type: 'video' | 'audio' | 'image';
	source: 'local' | 'url';

	// Local file data
	file?: File;
	blobUrl?: string;

	// URL import data
	originalUrl?: string;

	// Display info
	name: string;
	thumbnail?: string;

	// Upload status (for SSR export)
	uploaded: boolean;
	serverUrl?: string;
}

interface IUploadStore {
	showUploadModal: boolean;
	setShowUploadModal: (showUploadModal: boolean) => void;
	uploadProgress: Record<string, number>;
	setUploadProgress: (uploadProgress: Record<string, number>) => void;
	uploadsVideos: any[];
	setUploadsVideos: (uploadsVideos: any[]) => void;
	uploadsAudios: any[];
	setUploadsAudios: (uploadsAudios: any[]) => void;
	uploadsImages: any[];
	setUploadsImages: (uploadsImages: any[]) => void;
	files: UploadFile[];
	setFiles: (
		files: UploadFile[] | ((prev: UploadFile[]) => UploadFile[]),
	) => void;

	pendingUploads: UploadFile[];
	addPendingUploads: (uploads: UploadFile[]) => void;
	clearPendingUploads: () => void;
	activeUploads: UploadFile[];
	processUploads: () => void;
	updateUploadProgress: (id: string, progress: number) => void;
	setUploadStatus: (id: string, status: UploadFile['status'], error?: string) => void;
	removeUpload: (id: string) => void;
	uploads: any[];
	setUploads: (uploads: any[] | ((prev: any[]) => any[])) => void;

	// LocalMedia functions
	localMedias: LocalMedia[];
	addLocalMedia: (file: File, thumbnail?: string) => LocalMedia;
	addUrlMedia: (url: string, type: 'video' | 'audio' | 'image', thumbnail?: string) => LocalMedia;
	removeLocalMedia: (id: string) => void;
	getLocalMediaBySrc: (src: string) => LocalMedia | undefined;
	markMediaUploaded: (id: string, serverUrl: string) => void;

	// Expired media functions
	isMediaExpired: (media: LocalMedia) => boolean;
	reuploadMedia: (id: string, file: File, thumbnail?: string) => string; // Returns new blobUrl
}

const useUploadStore = create<IUploadStore>()(
	persist(
		(set, get) => ({
			showUploadModal: false,
			setShowUploadModal: (showUploadModal: boolean) => set({ showUploadModal }),

			uploadProgress: {},
			setUploadProgress: (uploadProgress: Record<string, number>) => set({ uploadProgress }),

			uploadsVideos: [],
			setUploadsVideos: (uploadsVideos: any[]) => set({ uploadsVideos }),

			uploadsAudios: [],
			setUploadsAudios: (uploadsAudios: any[]) => set({ uploadsAudios }),

			uploadsImages: [],
			setUploadsImages: (uploadsImages: any[]) => set({ uploadsImages }),

			files: [],
			setFiles: (files: UploadFile[] | ((prev: UploadFile[]) => UploadFile[])) =>
				set((state) => ({
					files:
						typeof files === "function"
							? (files as (prev: UploadFile[]) => UploadFile[])(state.files)
							: files,
				})),

			pendingUploads: [],
			addPendingUploads: (uploads: UploadFile[]) => {
				set((state) => ({
					pendingUploads: [...state.pendingUploads, ...uploads],
				}));
			},
			clearPendingUploads: () => set({ pendingUploads: [] }),

			activeUploads: [],
			processUploads: () => {
				const { pendingUploads, activeUploads, updateUploadProgress, setUploadStatus, removeUpload, setUploads } = get();

				// Move pending uploads to active with 'uploading' status
				if (pendingUploads.length > 0) {
					set((state) => ({
						activeUploads: [
							...state.activeUploads,
							...pendingUploads.map(u => ({ ...u, status: 'uploading' as const, progress: 0 })),
						],
						pendingUploads: [],
					}));
				}

				// Get updated activeUploads after moving pending ones
				const currentActiveUploads = get().activeUploads;

				const callbacks: UploadCallbacks = {
					onProgress: (uploadId, progress) => {
						console.log("progress", progress, uploadId);
						updateUploadProgress(uploadId, progress);
					},
					onStatus: (uploadId, status, error) => {
						setUploadStatus(uploadId, status, error);
						if (status === 'uploaded') {
							// Remove from active uploads after a delay to show final status
							setTimeout(() => removeUpload(uploadId), 3000);
						} else if (status === 'failed') {
							// Remove from active uploads after a delay to show final status
							setTimeout(() => removeUpload(uploadId), 3000);
						}
					},
				};

				console.log("activeUploads", currentActiveUploads);
				// Process all uploading items
				for (const upload of currentActiveUploads.filter(upload => upload.status === 'uploading')) {
					console.log("upload", upload);
					processUpload(upload.id, { file: upload.file, url: upload.url }, callbacks)
						.then((uploadData) => {
							// Add the complete upload data to the uploads array
							if (uploadData) {
								if (Array.isArray(uploadData)) {
									// URL uploads return an array
									setUploads((prev) => [...prev, ...uploadData]);
								} else {
									// File uploads return a single object
									setUploads((prev) => [...prev, uploadData]);
								}
							}
						})
						.catch((error) => {
							console.error("Upload failed:", error);
						});
				}
			},
			updateUploadProgress: (id: string, progress: number) => set((state) => ({
				activeUploads: state.activeUploads.map(u => u.id === id ? { ...u, progress } : u),
			})),
			setUploadStatus: (id: string, status: UploadFile['status'], error?: string) => set((state) => ({
				activeUploads: state.activeUploads.map(u => u.id === id ? { ...u, status, error } : u),
			})),
			removeUpload: (id: string) => set((state) => ({
				activeUploads: state.activeUploads.filter(u => u.id !== id),
			})),
			uploads: [],
			setUploads: (uploads: any[] | ((prev: any[]) => any[])) =>
				set((state) => ({
					uploads:
						typeof uploads === "function"
							? (uploads as (prev: any[]) => any[])(state.uploads)
							: uploads,
				})),
			// LocalMedia implementations
			localMedias: [],

			addLocalMedia: (file: File, thumbnail?: string) => {
				const blobUrl = URL.createObjectURL(file);
				const type = file.type.startsWith('video/') ? 'video'
					: file.type.startsWith('audio/') ? 'audio'
						: 'image';

				const media: LocalMedia = {
					id: nanoid(),
					type,
					source: 'local',
					file,
					blobUrl,
					name: file.name,
					thumbnail,
					uploaded: false,
				};

				set((state) => ({
					localMedias: [...state.localMedias, media]
				}));

				return media;
			},

			addUrlMedia: (url: string, type: 'video' | 'audio' | 'image', thumbnail?: string) => {
				// Extract name from URL
				const urlObj = new URL(url);
				const pathParts = urlObj.pathname.split('/');
				const name = pathParts[pathParts.length - 1] || url.slice(0, 30);

				const media: LocalMedia = {
					id: nanoid(),
					type,
					source: 'url',
					originalUrl: url,
					name,
					thumbnail,
					uploaded: true, // URL media doesn't need upload
					serverUrl: url,
				};

				set((state) => ({
					localMedias: [...state.localMedias, media]
				}));

				return media;
			},

			removeLocalMedia: (id: string) => {
				const state = get();
				const media = state.localMedias.find(m => m.id === id);

				// Revoke blob URL if it's a local file
				if (media?.blobUrl) {
					URL.revokeObjectURL(media.blobUrl);
				}

				set((state) => ({
					localMedias: state.localMedias.filter(m => m.id !== id)
				}));
			},

			getLocalMediaBySrc: (src: string) => {
				const state = get();
				return state.localMedias.find(m =>
					m.blobUrl === src || m.originalUrl === src || m.serverUrl === src
				);
			},

			markMediaUploaded: (id: string, serverUrl: string) => {
				set((state) => ({
					localMedias: state.localMedias.map(m =>
						m.id === id ? { ...m, uploaded: true, serverUrl } : m
					)
				}));
			},

			// Check if local media is expired (file lost after refresh)
			isMediaExpired: (media: LocalMedia) => {
				// URL media is never expired
				if (media.source === 'url') return false;
				// Local media is expired if file is missing
				return !media.file;
			},

			// Re-upload expired media with new file
			reuploadMedia: (id: string, file: File, thumbnail?: string) => {
				const state = get();
				const media = state.localMedias.find(m => m.id === id);

				if (!media) {
					throw new Error(`Media with id ${id} not found`);
				}

				// Revoke old blob URL if exists
				if (media.blobUrl) {
					URL.revokeObjectURL(media.blobUrl);
				}

				// Create new blob URL
				const newBlobUrl = URL.createObjectURL(file);

				// Update media in store
				set((state) => ({
					localMedias: state.localMedias.map(m =>
						m.id === id ? {
							...m,
							file,
							blobUrl: newBlobUrl,
							thumbnail: thumbnail || m.thumbnail,
							uploaded: false, // Reset upload status
							serverUrl: undefined,
						} : m
					)
				}));

				return newBlobUrl;
			},
		}),
		{
			name: 'upload-store',
			partialize: (state) => ({
				uploads: state.uploads,
				localMedias: state.localMedias.map(m => ({
					...m,
					file: undefined, // Don't persist File objects
				}))
			})
		}
	)
);

export type { UploadFile };
export default useUploadStore;
