// MIT License - Clean-room HTML5 Video Thumbnail Generator & Cache
const thumbnailMemoryCache = new Map<string, string>();

/**
 * Generate a video thumbnail at a given second using native HTML5 Video & Canvas
 */
export const generateVideoThumbnail = (
	src: string,
	timeInSeconds: number = 0.5,
): Promise<string> => {
	if (!src) return Promise.resolve("");

	const cacheKey = `${src}_${timeInSeconds}`;
	if (thumbnailMemoryCache.has(cacheKey)) {
		return Promise.resolve(thumbnailMemoryCache.get(cacheKey)!);
	}

	return new Promise((resolve) => {
		try {
			const video = document.createElement("video");
			video.crossOrigin = "anonymous";
			video.muted = true;
			video.playsInline = true;
			video.preload = "metadata";

			let isResolved = false;
			const cleanup = () => {
				video.onloadeddata = null;
				video.onseeked = null;
				video.onerror = null;
				video.src = "";
			};

			const captureFrame = () => {
				if (isResolved) return;
				isResolved = true;
				try {
					const canvas = document.createElement("canvas");
					canvas.width = 160;
					canvas.height = 90;
					const ctx = canvas.getContext("2d");
					if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
						ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
						const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
						thumbnailMemoryCache.set(cacheKey, dataUrl);
						cleanup();
						resolve(dataUrl);
						return;
					}
				} catch {
					// Fallback on canvas taint or error
				}
				cleanup();
				resolve("");
			};

			video.onloadeddata = () => {
				video.currentTime = Math.min(
					timeInSeconds,
					Math.max(0.1, (video.duration || 1) - 0.1),
				);
			};

			video.onseeked = captureFrame;

			video.onerror = () => {
				if (!isResolved) {
					isResolved = true;
					cleanup();
					resolve("");
				}
			};

			// Safety timeout after 3s
			setTimeout(() => {
				if (!isResolved) {
					isResolved = true;
					cleanup();
					resolve("");
				}
			}, 3000);

			video.src = src;
		} catch {
			resolve("");
		}
	});
};
