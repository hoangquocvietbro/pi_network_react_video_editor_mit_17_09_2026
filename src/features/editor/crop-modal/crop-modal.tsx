import {
	DialogContent,
	Dialog,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { ElementCrop } from "./element-crop";
import { Button } from "@/components/ui/button";
import useLayoutStore from "../store/use-layout-store";
import { dispatch, EDIT_OBJECT } from "@/lib/events";
import useCropStore from "../store/use-crop-store";
import { Crop, RotateCcw, Check, Loader2 } from "lucide-react";
import { clamp } from "../utils/math";

const ASPECT_RATIOS = [
	{ label: "Free", value: "free", ratio: null },
	{ label: "16:9", value: "16:9", ratio: 16 / 9 },
	{ label: "9:16", value: "9:16", ratio: 9 / 16 },
	{ label: "1:1", value: "1:1", ratio: 1 },
	{ label: "4:5", value: "4:5", ratio: 4 / 5 },
	{ label: "4:3", value: "4:3", ratio: 4 / 3 },
];

const CropModal = () => {
	const { cropTarget, setCropTarget } = useLayoutStore();
	const {
		loadVideo,
		loadImage,
		reset,
		clear,
		area,
		setArea,
		scale: scaled,
		element,
		size,
		fileLoading,
	} = useCropStore();

	const [activeRatio, setActiveRatio] = useState<string>("free");

	const handleSelectRatio = (item: (typeof ASPECT_RATIOS)[number]) => {
		setActiveRatio(item.value);
		if (!size.width || !size.height || !scaled) return;

		const previewW = size.width * scaled;
		const previewH = size.height * scaled;

		if (!item.ratio) {
			// Free: reset to full bounds if currently empty, or keep current
			return;
		}

		let targetW = previewW;
		let targetH = targetW / item.ratio;

		if (targetH > previewH) {
			targetH = previewH;
			targetW = targetH * item.ratio;
		}

		const targetX = (previewW - targetW) / 2;
		const targetY = (previewH - targetH) / 2;

		setArea([
			Math.round(targetX),
			Math.round(targetY),
			Math.round(targetW),
			Math.round(targetH),
		]);
	};

	const handleReset = () => {
		setActiveRatio("free");
		reset();
	};

	const apply = () => {
		if (!cropTarget || !element) return;
		const cropTargetDetails = cropTarget.details;

		const oldWidth =
			Number.parseFloat(String(cropTargetDetails.width)) || size.width || 100;
		const oldHeight =
			Number.parseFloat(String(cropTargetDetails.height)) || size.height || 100;

		// Extract visual scale if transformed
		const regex = cropTargetDetails.transform?.match(/scale\(([^)]+)\)/);
		const imageScale = regex ? Number.parseFloat(regex[1]) : 1;

		const previewW = size.width * scaled;
		const previewH = size.height * scaled;

		if (previewW <= 0 || previewH <= 0) return;

		// Normalized fraction of crop area relative to preview
		const fracX = clamp(area[0] / previewW, 0, 1);
		const fracY = clamp(area[1] / previewH, 0, 1);
		const fracW = clamp(area[2] / previewW, 0, 1 - fracX);
		const fracH = clamp(area[3] / previewH, 0, 1 - fracY);

		// Calculate crop offsets and dimensions in composition coordinates
		const cropX = Math.round(fracX * oldWidth);
		const cropY = Math.round(fracY * oldHeight);
		const cropW = Math.max(10, Math.round(fracW * oldWidth));
		const cropH = Math.max(10, Math.round(fracH * oldHeight));

		// Check if it's full frame (within 4px tolerance)
		const isFullFrame =
			cropX <= 4 &&
			cropY <= 4 &&
			Math.abs(cropW - oldWidth) <= 6 &&
			Math.abs(cropH - oldHeight) <= 6;

		const prevCropX = cropTargetDetails?.crop?.x ?? 0;
		const prevCropY = cropTargetDetails?.crop?.y ?? 0;
		const prevCropW = cropTargetDetails?.crop?.width ?? oldWidth;
		const prevCropH = cropTargetDetails?.crop?.height ?? oldHeight;

		const currentLeft =
			Number.parseFloat(String(cropTargetDetails.left)) || 0;
		const currentTop =
			Number.parseFloat(String(cropTargetDetails.top)) || 0;

		const oldCenterX = currentLeft + prevCropW / 2;
		const oldCenterY = currentTop + prevCropH / 2;

		const shiftX = cropX + cropW / 2 - (prevCropX + prevCropW / 2);
		const shiftY = cropY + cropH / 2 - (prevCropY + prevCropH / 2);

		const newCenterX = oldCenterX + shiftX * imageScale;
		const newCenterY = oldCenterY + shiftY * imageScale;

		const adjustedLeft = Math.round(
			newCenterX - (isFullFrame ? oldWidth : cropW) / 2,
		);
		const adjustedTop = Math.round(
			newCenterY - (isFullFrame ? oldHeight : cropH) / 2,
		);

		dispatch(EDIT_OBJECT, {
			payload: {
				[cropTarget.id]: {
					details: {
						top: adjustedTop,
						left: adjustedLeft,
						crop: isFullFrame
							? undefined
							: {
									x: cropX,
									y: cropY,
									width: cropW,
									height: cropH,
								},
					},
				},
			},
		});

		clear();
		setCropTarget(null);
	};

	useEffect(() => {
		if (!cropTarget) {
			clear();
			return;
		}
		const cropTargetDetails = cropTarget.details;
		const existingCrop = cropTargetDetails.crop;
		const detailsSize = {
			width: Number.parseFloat(String(cropTargetDetails.width)) || 0,
			height: Number.parseFloat(String(cropTargetDetails.height)) || 0,
		};
		setActiveRatio("free");
		if (cropTarget.type === "video") {
			loadVideo(cropTargetDetails.src, existingCrop, detailsSize);
		} else if (cropTarget.type === "image") {
			loadImage(cropTargetDetails.src, existingCrop, detailsSize);
		}
	}, [cropTarget]);

	if (!cropTarget) return null;

	return (
		<Dialog
			open={!!cropTarget}
			onOpenChange={(open) => {
				if (!open) {
					clear();
					setCropTarget(null);
				}
			}}
		>
			<DialogContent
				showCloseButton={true}
				className="z-[300] flex flex-col w-[95vw] sm:w-[90vw] max-w-[840px] max-h-[92vh] bg-zinc-950 border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-2xl overflow-hidden"
			>
				{/* Header */}
				<div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
					<div className="flex items-center gap-2.5">
						<div className="p-1.5 rounded-lg bg-primary/10 text-primary">
							<Crop className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-sm sm:text-base font-semibold text-white">
								Crop Media
							</DialogTitle>
							<DialogDescription className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
								Drag corners to crop, or choose an aspect ratio preset
							</DialogDescription>
						</div>
					</div>
				</div>

				{/* Aspect ratio presets */}
				<div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
					<span className="text-xs font-medium text-zinc-400 mr-1 shrink-0">
						Aspect Ratio:
					</span>
					{ASPECT_RATIOS.map((item) => {
						const isSelected = activeRatio === item.value;
						return (
							<Button
								key={item.value}
								type="button"
								size="sm"
								variant="outline"
								onClick={() => handleSelectRatio(item)}
								className={`h-7 px-3 text-xs font-medium rounded-full transition-all shrink-0 ${
									isSelected
										? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
										: "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
								}`}
							>
								{item.label}
							</Button>
						);
					})}
				</div>

				{/* Canvas preview container */}
				<div className="flex-1 min-h-[220px] max-h-[56vh] bg-zinc-900/50 border border-zinc-800/60 rounded-xl flex items-center justify-center p-3 sm:p-4 overflow-hidden relative select-none">
					{fileLoading && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/60 backdrop-blur-xs z-10">
							<Loader2 className="w-6 h-6 text-primary animate-spin" />
							<span className="text-xs text-zinc-400">Loading media...</span>
						</div>
					)}
					{element && <ElementCrop element={element} />}
				</div>

				{/* Footer actions */}
				<div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleReset}
						className="h-9 px-3 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 gap-1.5"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						Reset
					</Button>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								clear();
								setCropTarget(null);
							}}
							className="h-9 px-4 text-xs border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={apply}
							className="h-9 px-4 text-xs font-medium gap-1.5"
						>
							<Check className="w-3.5 h-3.5" />
							Apply
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CropModal;
