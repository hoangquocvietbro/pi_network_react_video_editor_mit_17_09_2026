import { IDesign } from "@/types/editor";
import { create } from "zustand";
import { renderMediaOnWeb } from "@remotion/web-renderer";
import { RenderableComposition } from "../player/renderable-composition";
import { checkCSRSupport, downloadDirectBlob, shareBlob, uploadBlobToCloud, openUrlInSystemBrowser, type RenderMode } from "../utils/web-renderer";
import { PUBLIC_ENV } from "@/lib/public-env";
interface Output {
	url: string;
	type: string;
	blob?: Blob;
}

interface CSRProgress {
	renderedFrames: number;
	encodedFrames: number;
	totalFrames: number;
	phase: 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error' | 'cancelled';
}

/**
 * Get default render mode from environment variable
 * NEXT_PUBLIC_DEFAULT_RENDER_MODE: 'csr' | 'ssr' | 'ssr-local'
 * Defaults strictly to 'csr' (Browser via WebCodecs)
 */
function getDefaultRenderMode(): RenderMode {
	const envMode = (process.env.NEXT_PUBLIC_DEFAULT_RENDER_MODE || PUBLIC_ENV.DEFAULT_RENDER_MODE) as RenderMode | undefined;
	if (envMode && ['csr', 'ssr', 'ssr-local'].includes(envMode)) {
		return envMode;
	}
	return 'csr'; // Default is CSR (Browser WebCodecs)
}

/**
 * Get SSR mode type from environment variable
 * NEXT_PUBLIC_SSR_MODE: 'ssr' | 'ssr-local'
 * This determines what SSR mode to switch to when toggling from CSR (connects to remote render server)
 */
function getSSRMode(): 'ssr' | 'ssr-local' {
	const envMode = (process.env.NEXT_PUBLIC_SSR_MODE || PUBLIC_ENV.SSR_MODE) as 'ssr' | 'ssr-local' | undefined;
	if (envMode && ['ssr', 'ssr-local'].includes(envMode)) {
		return envMode;
	}
	return 'ssr-local'; // Default fallback: calls /api/render-local (which connects to remote render server)
}

// Export for use in UI components
export { getSSRMode };
interface DownloadState {
	projectId: string;
	exporting: boolean;
	exportType: "json" | "mp4";
	exportQuality: "high" | "standard" | "low";
	progress: number;
	csrProgress: CSRProgress;
	output?: Output;
	payload?: IDesign;
	displayProgressModal: boolean;
	renderMode: RenderMode;
	csrSupported: boolean | null;
	abortController: AbortController | null;
	errorMessage: string | null;
	actions: {
		setProjectId: (projectId: string) => void;
		setExporting: (exporting: boolean) => void;
		setExportType: (exportType: "json" | "mp4") => void;
		setExportQuality: (quality: "high" | "standard" | "low") => void;
		setProgress: (progress: number) => void;
		setState: (state: Partial<DownloadState>) => void;
		setOutput: (output: Output) => void;
		setRenderMode: (mode: RenderMode) => void;
		checkCSRSupport: () => Promise<boolean>;
		startExport: () => void;
		startExportCSR: () => Promise<void>;
		startExportSSR: () => Promise<void>;
		startExportSSRLocal: () => Promise<void>;
		cancelExport: () => void;
		downloadDirect: () => Promise<void> | void;
		downloadOutput: () => Promise<void> | void;
		shareOutput: () => Promise<void>;
		cloudSaveOutput: () => Promise<string>;
		downloadOutputExternalBrowser: () => Promise<void>;
		setDisplayProgressModal: (displayProgressModal: boolean) => void;
		reset: () => void;
	};
}

//const baseUrl = "https://api.combo.sh/v1";

export const useDownloadState = create<DownloadState>((set, get) => ({
	projectId: "",
	exporting: false,
	exportType: "mp4",
	exportQuality: "high",
	progress: 0,
	csrProgress: {
		renderedFrames: 0,
		encodedFrames: 0,
		totalFrames: 0,
		phase: 'preparing',
	},
	displayProgressModal: false,
	renderMode: getDefaultRenderMode(), // Read from env
	csrSupported: null,
	abortController: null,
	errorMessage: null,
	actions: {
		setProjectId: (projectId) => set({ projectId }),
		setExporting: (exporting) => set({ exporting }),
		setExportType: (exportType) => set({ exportType }),
		setProgress: (progress) => set({ progress }),
		setState: (state) => set({ ...state }),
		setOutput: (output) => set({ output }),
		setRenderMode: (mode) => set({ renderMode: mode }),
		setExportQuality: (exportQuality) => set({ exportQuality }),
		setDisplayProgressModal: (displayProgressModal) =>
			set({ displayProgressModal }),

		// Check if CSR is supported for current payload
		checkCSRSupport: async () => {
			const { payload } = get();
			if (!payload) return false;

			try {
				const result = await checkCSRSupport(payload.size.width, payload.size.height);
				set({ csrSupported: result.canRender });
				return result.canRender;
			} catch {
				set({ csrSupported: false });
				return false;
			}
		},

		// Main export function - routes to CSR, SSR, or SSR-Local

		startExport: async () => {
			const { renderMode, actions } = get();

			if (renderMode === "csr") {
				await actions.startExportCSR();
			} else if (renderMode === "ssr-local") {
				await actions.startExportSSRLocal();
			} else {
				await actions.startExportSSR();
			}
		},

		// Client-Side Rendering export
		startExportCSR: async () => {
			const abortController = new AbortController();
			set({
				exporting: true,
				displayProgressModal: true,
				abortController,
				errorMessage: null,
				progress: 0,
				csrProgress: {
					renderedFrames: 0,
					encodedFrames: 0,
					totalFrames: 0,
					phase: 'preparing',
				},
			});

			const { payload } = get();

			if (!payload) {
				set({
					exporting: false,
					errorMessage: "Payload is not defined",
					csrProgress: { ...get().csrProgress, phase: 'error' },
				});
				return;
			}

			// Calculate duration from track items if not provided
			let duration = payload.duration;
			if (!duration && payload.trackItemsMap) {
				const trackItems = Object.values(payload.trackItemsMap);
				if (trackItems.length > 0) {
					duration = Math.max(...trackItems.map(item => item.display?.to || 0));
				}
			}
			// Fallback to 1 second if still no duration
			duration = duration || 1000;

			console.log('[CSR Export] Calculated duration:', duration, 'ms');

			const fps = 30;
			const totalFrames = Math.max(1, Math.round((duration / 1000) * fps));

			console.log('[CSR Export] Total frames:', totalFrames);

			set({
				csrProgress: {
					renderedFrames: 0,
					encodedFrames: 0,
					totalFrames,
					phase: 'preparing',
				},
			});

			try {
				// Calculate dimensions based on quality
				const { exportQuality } = get();
				let width = payload.size.width;
				let height = payload.size.height;

				if (exportQuality === 'standard') {
					const scale = 720 / Math.min(width, height);
					width = Math.round(width * scale);
					height = Math.round(height * scale);
				} else if (exportQuality === 'low') {
					const scale = 480 / Math.min(width, height);
					width = Math.round(width * scale);
					height = Math.round(height * scale);
				}

				// Ensure even dimensions
				width = Math.round(width / 2) * 2;
				height = Math.round(height / 2) * 2;

				// Check browser support
				const support = await checkCSRSupport(width, height);

				if (!support.canRender) {
					const errors = support.issues
						.filter(i => i.severity === 'error')
						.map(i => i.message);
					throw new Error(`Browser does not support CSR: ${errors.join(', ')}`);
				}

				set({
					csrProgress: { ...get().csrProgress, phase: 'rendering' },
				});

				const { getBlob } = await renderMediaOnWeb({
					composition: {
						component: RenderableComposition,
						durationInFrames: totalFrames,
						fps,
						width,
						height,
						id: 'veditor-export',
						defaultProps: {
							design: {
								...payload,
								duration,
								// Pass original size so RenderableComposition can calculate scale
							}
						},
					},
					inputProps: {
						design: {
							...payload,
							duration,
							// Pass original size so RenderableComposition can calculate scale
						}
					},
					container: 'mp4',
					videoCodec: support.resolvedVideoCodec,
					audioCodec: support.resolvedAudioCodec ?? undefined,
					videoBitrate: 'high',
					audioBitrate: 'medium',
					signal: abortController.signal,
					onProgress: ({ renderedFrames, encodedFrames }) => {
						const phase = encodedFrames > 0 ? 'encoding' : 'rendering';
						const progress = Math.round((encodedFrames / totalFrames) * 100);
						set({
							progress,
							csrProgress: {
								renderedFrames,
								encodedFrames,
								totalFrames,
								phase,
							},
						});
					},
					licenseKey: 'free-license',
				});

				set({
					csrProgress: { ...get().csrProgress, phase: 'encoding' },
					progress: 99,
				});

				const blob = await getBlob();
				const url = URL.createObjectURL(blob);

				set({
					exporting: false,
					progress: 100,
					csrProgress: { ...get().csrProgress, phase: 'completed' },
					output: { url, type: 'mp4', blob },
				});

			} catch (error: unknown) {
				const isAborted = abortController.signal.aborted;

				if (isAborted) {
					set({
						exporting: false,
						csrProgress: { ...get().csrProgress, phase: 'cancelled' },
					});
				} else {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.error('CSR Export failed:', error);
					set({
						exporting: false,
						errorMessage,
						csrProgress: { ...get().csrProgress, phase: 'error' },
					});
				}
			}
		},

		// Server-Side Rendering export (original implementation)
		startExportSSR: async () => {
			try {
				set({ exporting: true, displayProgressModal: true, errorMessage: null });

				const { payload, exportQuality } = get();


				if (!payload) throw new Error("Payload is not defined");
				// Step 0: Upload local blob media before SSR
				const updatedPayload = JSON.parse(JSON.stringify(payload)); // Deep clone
				const trackItemsMap = updatedPayload.trackItemsMap || {};

				// Import upload store and upload service
				const { uploadSingleFile } = await import('../../../utils/upload-service');
				const useUploadStore = (await import('./use-upload-store')).default;
				const { localMedias, markMediaUploaded } = useUploadStore.getState();

				// Find and upload local media
				for (const [itemId, item] of Object.entries(trackItemsMap) as [string, any][]) {
					const src = item.details?.src;
					if (!src || typeof src !== 'string') continue;

					// Check if this is a blob URL
					if (src.startsWith('blob:')) {
						const localMedia = localMedias.find(m => m.blobUrl === src);

						if (localMedia && localMedia.file && !localMedia.uploaded) {
							console.log('[SSR] Uploading local media:', localMedia.name);

							// Upload the file
							const serverUrl = await uploadSingleFile(localMedia.file);

							// Mark as uploaded in store
							markMediaUploaded(localMedia.id, serverUrl);

							// Update the design payload
							trackItemsMap[itemId].details.src = serverUrl;
						} else if (localMedia && localMedia.serverUrl) {
							// Already uploaded, use server URL
							trackItemsMap[itemId].details.src = localMedia.serverUrl;
						}
					}
					// URL media (non-blob) stays as-is
				}

				// Calculate dimensions based on quality
				let width = updatedPayload.size.width;
				let height = updatedPayload.size.height;

				if (exportQuality === 'standard') {
					const scale = 720 / Math.min(width, height);
					width = Math.round(width * scale);
					height = Math.round(height * scale);
				} else if (exportQuality === 'low') {
					const scale = 480 / Math.min(width, height);
					width = Math.round(width * scale);
					height = Math.round(height * scale);
				}

				// Ensure even dimensions
				width = Math.round(width / 2) * 2;
				height = Math.round(height / 2) * 2;

				// Step 1: POST request to start rendering
				const response = await fetch(`/api/render`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						design: updatedPayload, // Pass updated design with server URLs
						options: {
							fps: 30,
							size: { width, height },
							format: "mp4",
						},
					}),
				});

				if (!response.ok) throw new Error("Failed to submit export request.");

				const jobInfo = await response.json();
				const videoId = jobInfo.video.id;

				// Step 2 & 3: Polling for status updates
				const checkStatus = async () => {
					const statusResponse = await fetch(`/api/render/${videoId}`, {
						headers: {
							"Content-Type": "application/json",
						},
					});

					if (!statusResponse.ok)
						throw new Error("Failed to fetch export status.");

					const statusInfo = await statusResponse.json();
					const { status, progress, url } = statusInfo.video;

					set({ progress });

					if (status === "COMPLETED") {
						set({ exporting: false, output: { url, type: get().exportType } });
					} else if (status === "PENDING") {
						setTimeout(checkStatus, 2500);
					}
				};

				checkStatus();
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error('SSR Export failed:', error);
				set({ exporting: false, errorMessage });
			}
		},

		// Server-Side Rendering (Local Node.js) export
		startExportSSRLocal: async () => {
			try {
				set({ exporting: true, displayProgressModal: true, errorMessage: null, progress: 0 });

				const { payload, exportQuality } = get();

				if (!payload) throw new Error("Payload is not defined");

				// Step 0: Upload local blob media before SSR (same as startExportSSR)
				const updatedPayload = JSON.parse(JSON.stringify(payload)); // Deep clone
				const trackItemsMap = updatedPayload.trackItemsMap || {};

				// Import upload store and upload service
				const { uploadSingleFile } = await import('../../../utils/upload-service');
				const useUploadStore = (await import('./use-upload-store')).default;
				const { localMedias, markMediaUploaded } = useUploadStore.getState();

				// Find and upload local media
				for (const [itemId, item] of Object.entries(trackItemsMap) as [string, any][]) {
					const src = item.details?.src;
					if (!src || typeof src !== 'string') continue;

					// Check if this is a blob URL
					if (src.startsWith('blob:')) {
						const localMedia = localMedias.find(m => m.blobUrl === src);

						if (localMedia && localMedia.file && !localMedia.uploaded) {
							console.log('[SSR-Local] Uploading local media:', localMedia.name);

							// Upload the file
							const serverUrl = await uploadSingleFile(localMedia.file);

							// Mark as uploaded in store
							markMediaUploaded(localMedia.id, serverUrl);

							// Update the design payload
							trackItemsMap[itemId].details.src = serverUrl;
						} else if (localMedia && localMedia.serverUrl) {
							// Already uploaded, use server URL
							trackItemsMap[itemId].details.src = localMedia.serverUrl;
						}
					}
					// URL media (non-blob) stays as-is
				}

				// Step 1: POST request to start local rendering
				const response = await fetch(`/api/render-local`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						design: updatedPayload, // Use updated payload with server URLs
						options: {
							fps: 30,
							format: "mp4",
							quality: exportQuality
						}
					})
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error?.message || "Failed to submit render request.");
				}

				const jobInfo = await response.json();
				const jobId = jobInfo.job.id;

				console.log('[SSR-Local] Job created:', jobId);

				// Step 2: Polling for status updates
				const checkStatus = async () => {
					const statusResponse = await fetch(`/api/render-local/${jobId}`, {
						headers: {
							"Content-Type": "application/json"
						}
					});

					if (!statusResponse.ok) {
						throw new Error("Failed to fetch render status.");
					}

					const statusInfo = await statusResponse.json();
					const { status, progress, outputUrl, error } = statusInfo.job;

					set({ progress });

					if (status === "completed" && outputUrl) {
						set({
							exporting: false,
							output: { url: outputUrl, type: 'mp4' },
							progress: 100
						});
					} else if (status === "failed") {
						throw new Error(error || "Render failed");
					} else if (status === "pending" || status === "bundling" || status === "rendering" || status === "uploading") {
						setTimeout(checkStatus, 1500);
					}
				};

				checkStatus();
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error('SSR-Local Export failed:', error);
				set({ exporting: false, errorMessage });
			}
		},

		// Cancel the current export
		cancelExport: () => {
			const { abortController } = get();
			if (abortController) {
				abortController.abort();
			}
			set({
				exporting: false,
				csrProgress: { ...get().csrProgress, phase: 'cancelled' },
			});
		},

		// 1. Direct download from device memory (0 MB network upload)
		downloadDirect: async () => {
			const { output } = get();
			const filename = `veditor-export-${Date.now()}.mp4`;

			if (output?.blob) {
				await downloadDirectBlob(output.blob, filename);
			} else if (output?.url) {
				const a = document.createElement('a');
				a.href = output.url;
				a.download = filename;
				a.style.display = 'none';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
		},

		// Alias for backward compatibility
		downloadOutput: async () => {
			await get().actions.downloadDirect();
		},

		// 2. Share video via social apps (Zalo, Facebook, Messenger...)
		shareOutput: async () => {
			const { output } = get();
			const filename = `veditor-export-${Date.now()}.mp4`;

			if (output?.blob) {
				await shareBlob(output.blob, filename);
			} else if (output?.url) {
				if (typeof navigator !== 'undefined' && navigator.share) {
					await navigator.share({
						title: filename,
						url: output.url,
					});
				} else if (typeof window !== 'undefined' && (window as any).Pi?.openShareDialog) {
					await (window as any).Pi.openShareDialog(filename, output.url);
				} else if (typeof navigator !== 'undefined' && navigator.clipboard) {
					await navigator.clipboard.writeText(output.url);
				}
			}
		},

		// 3. Save to Firebase Cloud & Open Chrome browser for download
		cloudSaveOutput: async () => {
			const { output } = get();
			const filename = `veditor-export-${Date.now()}.mp4`;
			let downloadUrl = output?.url || '';

			if (output?.blob) {
				downloadUrl = await uploadBlobToCloud(output.blob, filename);
			} else if (output?.url) {
				const isRemoteUrl = output.url.startsWith('http') && !output.url.includes(window.location.host);
				if (isRemoteUrl) {
					const proxyUrl = `/api/download?url=${encodeURIComponent(output.url)}&filename=${encodeURIComponent(filename)}`;
					downloadUrl = `${window.location.origin}${proxyUrl}`;
				}
			}

			if (!downloadUrl) {
				throw new Error('No video output available to save to cloud.');
			}

			// If in Pi Browser, launch system browser (Chrome) with the download URL
			if (typeof window !== 'undefined' && (window as any).Pi?.openUrlInSystemBrowser) {
				await openUrlInSystemBrowser(downloadUrl);
			}

			return downloadUrl;
		},

		// Open download in system browser (Chrome/Safari) via Pi SDK
		downloadOutputExternalBrowser: async () => {
			await get().actions.cloudSaveOutput();
		},

		// Reset state
		reset: () => {
			set({
				exporting: false,
				progress: 0,
				csrProgress: {
					renderedFrames: 0,
					encodedFrames: 0,
					totalFrames: 0,
					phase: 'preparing',
				},
				output: undefined,
				errorMessage: null,
				abortController: null,
			});
		},
	},
}));
