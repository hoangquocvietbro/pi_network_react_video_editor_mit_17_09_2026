import React, { useEffect, useRef } from "react";
import { usePointerDrag } from "../hooks/use-pointer-drag";
import { Area } from "../interfaces/editor";
import useCropStore from "../store/use-crop-store";
import { clamp } from "../utils/math";

const MIN_CROP_SIZE = 30;

interface ElementCropProps {
	element: HTMLVideoElement | HTMLImageElement;
}

const handleDirections = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export const ElementCrop: React.FC<ElementCropProps> = ({ element }) => {
	const { area, setArea, scale, size } = useCropStore();
	const canvasPreviewRef = useRef<HTMLCanvasElement>(null);

	const previewW = size.width * scale;
	const previewH = size.height * scale;

	const { dragProps, isDragging } = usePointerDrag<{
		dirX: number;
		dirY: number;
		area: Area;
	}>({
		preventDefault: true,
		stopPropagation: true,
		onMove: ({ x, y, deltaX, deltaY, state: { dirX, dirY, area: startArea } }) => {
			const rect = canvasPreviewRef.current?.getBoundingClientRect();
			if (!rect || previewW <= 0 || previewH <= 0) return;

			const newArea: Area = [...startArea];
			const scaleRatioX = rect.width / previewW;
			const scaleRatioY = rect.height / previewH;

			if (dirX === 0 && dirY === 0) {
				// Moving the crop window
				newArea[0] = clamp(
					startArea[0] + deltaX / scaleRatioX,
					0,
					previewW - startArea[2],
				);
				newArea[1] = clamp(
					startArea[1] + deltaY / scaleRatioY,
					0,
					previewH - startArea[3],
				);
			} else {
				// Resizing via handles
				const relativeX = clamp(
					(x - rect.left) / scaleRatioX,
					0,
					previewW,
				);
				const relativeY = clamp(
					(y - rect.top) / scaleRatioY,
					0,
					previewH,
				);

				const endX = startArea[0] + startArea[2];
				const endY = startArea[1] + startArea[3];

				if (dirY === -1) {
					newArea[1] = clamp(relativeY, 0, endY - MIN_CROP_SIZE);
					newArea[3] = endY - newArea[1];
				} else if (dirY === 1) {
					newArea[3] = clamp(
						relativeY - startArea[1],
						MIN_CROP_SIZE,
						previewH - startArea[1],
					);
				}

				if (dirX === -1) {
					newArea[0] = clamp(relativeX, 0, endX - MIN_CROP_SIZE);
					newArea[2] = endX - newArea[0];
				} else if (dirX === 1) {
					newArea[2] = clamp(
						relativeX - startArea[0],
						MIN_CROP_SIZE,
						previewW - startArea[0],
					);
				}
			}

			setArea(newArea);
		},
	});

	useEffect(() => {
		let updating = true;

		const canvas = canvasPreviewRef.current;
		const context = canvas?.getContext("2d");

		const CANVAS_FRAME_TIME = 1000 / 30;
		let time = Date.now();

		const update = () => {
			if (!updating) return;

			const now = Date.now();
			let shouldDraw = true;

			if (element instanceof HTMLVideoElement) {
				shouldDraw = now - time > CANVAS_FRAME_TIME && element.readyState >= 2;
			}

			if (canvas && context && shouldDraw) {
				time = now;
				context.clearRect(0, 0, canvas.width, canvas.height);

				const currentArea = useCropStore.getState().area;

				if (!currentArea || currentArea[2] <= 0 || currentArea[3] <= 0) {
					context.drawImage(element, 0, 0, canvas.width, canvas.height);
				} else {
					// Draw background dimmed
					context.filter = "brightness(0.35)";
					context.drawImage(element, 0, 0, canvas.width, canvas.height);

					// Draw cropped area clear & bright
					context.filter = "none";
					context.drawImage(
						element,
						currentArea[0] / scale,
						currentArea[1] / scale,
						currentArea[2] / scale,
						currentArea[3] / scale,
						currentArea[0],
						currentArea[1],
						currentArea[2],
						currentArea[3],
					);
				}
			}
			requestAnimationFrame(update);
		};

		requestAnimationFrame(update);

		return () => {
			updating = false;
		};
	}, [element, scale]);

	if (previewW <= 0 || previewH <= 0) {
		return null;
	}

	const leftPct = (area[0] / previewW) * 100;
	const topPct = (area[1] / previewH) * 100;
	const widthPct = (area[2] / previewW) * 100;
	const heightPct = (area[3] / previewH) * 100;

	return (
		<div className="flex items-center justify-center max-w-full max-h-full select-none">
			<div className={"crop"}>
				<canvas
					width={previewW}
					height={previewH}
					className={"videoPreview"}
					ref={canvasPreviewRef}
				/>
				<div
					className={"box"}
					style={{
						left: `${leftPct}%`,
						top: `${topPct}%`,
						width: `${widthPct}%`,
						height: `${heightPct}%`,
						right: "auto",
						bottom: "auto",
					}}
				>
					<svg
						viewBox="0 0 90 90"
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="none"
						{...dragProps({ dirX: 0, dirY: 0, area })}
					>
						<line
							x1="30"
							y1="0"
							x2="30"
							y2="90"
							vectorEffect="non-scaling-stroke"
							style={{
								opacity: isDragging ? 0.6 : 0.25,
							}}
						/>
						<line
							x1="60"
							y1="0"
							x2="60"
							y2="90"
							vectorEffect="non-scaling-stroke"
							style={{
								opacity: isDragging ? 0.6 : 0.25,
							}}
						/>
						<line
							x1="0"
							y1="30"
							x2="90"
							y2="30"
							vectorEffect="non-scaling-stroke"
							style={{
								opacity: isDragging ? 0.6 : 0.25,
							}}
						/>
						<line
							x1="0"
							y1="60"
							x2="90"
							y2="60"
							vectorEffect="non-scaling-stroke"
							style={{
								opacity: isDragging ? 0.6 : 0.25,
							}}
						/>
					</svg>
					<div className={"handles"}>
						{handleDirections.map((direction) => (
							<div
								key={direction}
								className={`handle-${direction}`}
								style={{ cursor: `${direction}-resize` }}
								{...dragProps({
									dirX: direction.includes("e")
										? 1
										: direction.includes("w")
											? -1
											: 0,
									dirY: direction.includes("s")
										? 1
										: direction.includes("n")
											? -1
											: 0,
									area,
								})}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
