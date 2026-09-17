import { create } from "zustand";

type Area = [x: number, y: number, width: number, height: number];

interface ICropRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ICropState {
	area: Area;
	setArea: (area: Area) => void;
	loadVideo: (
		src: string,
		existingCrop?: ICropRect,
		detailsSize?: { width: number; height: number },
	) => void;
	loadImage: (
		src: string,
		existingCrop?: ICropRect,
		detailsSize?: { width: number; height: number },
	) => void;
	element: HTMLImageElement | HTMLVideoElement | undefined;
	src: string;
	fileLoading: boolean;
	step: number;
	setStep: (step: number) => void;
	reset: () => void;
	scale: number;
	clear: () => void;
	size: {
		width: number;
		height: number;
	};
}

const getCropConstraints = () => {
	const isClient = typeof window !== "undefined";
	const screenW = isClient ? window.innerWidth : 800;
	const screenH = isClient ? window.innerHeight : 600;
	const isMobile = screenW < 640;

	// On mobile screens, fit neatly inside viewport with room for header, ratios, buttons
	const maxWidth = isMobile
		? Math.max(260, Math.min(screenW - 56, 380))
		: Math.min(680, screenW - 280);

	const maxHeight = isMobile
		? Math.max(200, Math.min(screenH - 290, 320))
		: Math.min(480, screenH - 240);

	return { maxWidth, maxHeight };
};

const computeInitialArea = (
	naturalW: number,
	naturalH: number,
	scaleFactor: number,
	existingCrop?: ICropRect,
	detailsSize?: { width: number; height: number },
): Area => {
	const previewW = naturalW * scaleFactor;
	const previewH = naturalH * scaleFactor;

	if (
		existingCrop &&
		detailsSize &&
		detailsSize.width > 0 &&
		detailsSize.height > 0 &&
		existingCrop.width > 0 &&
		existingCrop.height > 0
	) {
		const rx = previewW / detailsSize.width;
		const ry = previewH / detailsSize.height;

		const x = Math.max(0, Math.min(previewW - 20, existingCrop.x * rx));
		const y = Math.max(0, Math.min(previewH - 20, existingCrop.y * ry));
		const w = Math.min(previewW - x, existingCrop.width * rx);
		const h = Math.min(previewH - y, existingCrop.height * ry);

		if (w >= 20 && h >= 20) {
			return [x, y, w, h];
		}
	}

	return [0, 0, previewW, previewH];
};

const useCropStore = create<ICropState>((set) => ({
	area: [0, 0, 0, 0],
	src: "",
	step: 0,
	fileLoading: false,
	scale: 1,
	element: undefined,
	size: {
		width: 0,
		height: 0,
	},
	reset: () => {
		set(({ element, size, scale }) => {
			if (element instanceof HTMLVideoElement) {
				element.currentTime = 0.01;
				element.pause();
			}
			return {
				area: [0, 0, size.width * scale, size.height * scale],
			};
		});
	},
	clear: () => {
		set({
			area: [0, 0, 0, 0],
			src: "",
			size: {
				width: 0,
				height: 0,
			},
			fileLoading: false,
			element: undefined,
		});
	},
	setArea: (area: Area) => set({ area }),
	setStep: (step: number) => set({ step }),
	loadImage: (
		src: string,
		existingCrop?: ICropRect,
		detailsSize?: { width: number; height: number },
	) => {
		set({ area: [0, 0, 0, 0], src, fileLoading: true });
		const image = document.createElement("img");
		image.crossOrigin = "anonymous";

		const onLoaded = () => {
			const imageWidth = image.naturalWidth || 500;
			const imageHeight = image.naturalHeight || 500;
			const { maxWidth, maxHeight } = getCropConstraints();

			const widthScale = maxWidth / imageWidth;
			const heightScale = maxHeight / imageHeight;
			const scaleFactor = Math.min(widthScale, heightScale);

			const initialArea = computeInitialArea(
				imageWidth,
				imageHeight,
				scaleFactor,
				existingCrop,
				detailsSize,
			);

			set({
				area: initialArea,
				src,
				size: { width: imageWidth, height: imageHeight },
				element: image,
				scale: scaleFactor,
				fileLoading: false,
			});
		};

		image.addEventListener("load", onLoaded);
		image.addEventListener("error", () => {
			if (image.crossOrigin) {
				image.removeAttribute("crossOrigin");
				image.src = src;
			} else {
				set({ fileLoading: false });
			}
		});
		image.src = src;
	},
	loadVideo: (
		src: string,
		existingCrop?: ICropRect,
		detailsSize?: { width: number; height: number },
	) => {
		set({ area: [0, 0, 0, 0], src, fileLoading: true });

		const video = document.createElement("video");
		video.setAttribute("playsinline", "");
		video.setAttribute("webkit-playsinline", "");
		video.preload = "auto";
		video.muted = true;
		video.autoplay = false;
		video.crossOrigin = "anonymous";

		let initialized = false;
		const initVideoCrop = () => {
			if (initialized) return;
			const videoWidth = video.videoWidth;
			const videoHeight = video.videoHeight;
			if (!videoWidth || !videoHeight) return;

			initialized = true;
			const { maxWidth, maxHeight } = getCropConstraints();
			const widthScale = maxWidth / videoWidth;
			const heightScale = maxHeight / videoHeight;
			const scaleFactor = Math.min(widthScale, heightScale);

			const initialArea = computeInitialArea(
				videoWidth,
				videoHeight,
				scaleFactor,
				existingCrop,
				detailsSize,
			);

			set({
				element: video,
				scale: scaleFactor,
				size: { width: videoWidth, height: videoHeight },
				area: initialArea,
				fileLoading: false,
				step: 1,
			});
		};

		video.addEventListener("loadedmetadata", () => {
			try {
				video.currentTime = 0.01;
			} catch (_) {}
			initVideoCrop();
		});

		video.addEventListener("canplay", () => {
			initVideoCrop();
		});

		video.addEventListener("seeked", () => {
			initVideoCrop();
		});

		video.addEventListener("error", () => {
			if (video.crossOrigin) {
				video.removeAttribute("crossOrigin");
				video.load();
			} else {
				set({ fileLoading: false });
			}
		});

		video.src = src;
		video.load();

		if (video.readyState >= 1 && video.videoWidth > 0) {
			initVideoCrop();
		}
	},
}));

export default useCropStore;
