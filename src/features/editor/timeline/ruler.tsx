import { useCallback, useEffect, useRef, useState } from "react";

import {
	PREVIEW_FRAME_WIDTH,
	SECONDARY_FONT,
	SMALL_FONT_SIZE,
	TIMELINE_OFFSET_CANVAS_LEFT,
} from "../constants/constants";
import { formatTimelineUnit } from "../utils/format";
import useStore from "../store/use-store";
import { debounce } from "lodash";
import { useTimelineOffsetX } from "../hooks/use-timeline-offset";
import { dispatch } from "@designcombo/events";
import { TIMELINE_SCALE_CHANGED } from "@designcombo/state";
import { TIMELINE_PREFIX } from "@designcombo/timeline";
import { TIMELINE_ZOOM_LEVELS } from "../constants/scale";
import { findIndex } from "../utils/search";
import { timeMsToUnits, unitsToTimeMs } from "../utils/timeline";

interface RulerProps {
	height?: number;
	longLineSize?: number;
	shortLineSize?: number;
	offsetX?: number;
	textOffsetY?: number;
	scrollLeft?: number;
	textFormat?: (scale: number) => string;
	onClick?: (units: number) => void;
	onScroll?: (scrollLeft: number) => void;
}

const Ruler = (props: RulerProps) => {
	const timelineOffsetX = useTimelineOffsetX();
	const {
		height = 40, // Increased height to give space for the text
		longLineSize = 8,
		shortLineSize = 10,
		offsetX = timelineOffsetX + TIMELINE_OFFSET_CANVAS_LEFT,
		textOffsetY = 17, // Place the text above the lines but inside the canvas
		textFormat = formatTimelineUnit,
		scrollLeft = 0,
		onClick,
		onScroll,
	} = props;
	const { scale } = useStore();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [canvasContext, setCanvasContext] =
		useState<CanvasRenderingContext2D | null>(null);
	const [canvasSize, setCanvasSize] = useState({
		width: 0,
		height: height, // Increased height for text space
	});

	// Drag & Pinch state
	const [isDragging, setIsDragging] = useState(false);
	const [isPinching, setIsPinching] = useState(false);
	const [hasDragged, setHasDragged] = useState(false);
	const dragRef = useRef({
		startX: 0,
		startScrollPos: 0,
		isDragging: false,
		hasDragged: false,
	});
	const pinchRef = useRef({
		isPinching: false,
		startDistance: 0,
		startZoom: 1,
		startScrollLeft: 0,
		midX: 0,
	});
	const rafRef = useRef<number | null>(null);
	const pendingScaleRef = useRef<{ zoom: number; scrollLeft: number } | null>(
		null,
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			const context = canvas.getContext("2d");
			setCanvasContext(context);
			resize(canvas, context, scrollLeft);
		}
	}, [timelineOffsetX]);

	const handleResize = useCallback(() => {
		resize(canvasRef.current, canvasContext, scrollLeft);
	}, [canvasContext, scrollLeft, timelineOffsetX]);

	useEffect(() => {
		const resizeHandler = debounce(handleResize, 200);
		window.addEventListener("resize", resizeHandler);

		return () => {
			window.removeEventListener("resize", resizeHandler);
		};
	}, [handleResize]);

	useEffect(() => {
		if (canvasContext) {
			resize(canvasRef.current, canvasContext, scrollLeft);
		}
	}, [canvasContext, scrollLeft, scale, timelineOffsetX]);

	const resize = (
		canvas: HTMLCanvasElement | null,
		context: CanvasRenderingContext2D | null,
		scrollLeft: number,
	) => {
		if (!canvas || !context) return;

		const offsetParent = canvas.offsetParent as HTMLDivElement;
		const width = offsetParent?.offsetWidth ?? canvas.offsetWidth;
		const height = canvasSize.height;

		canvas.width = width;
		canvas.height = height;

		draw(context, scrollLeft, width, height);
		setCanvasSize({ width, height });
	};

	const draw = (
		context: CanvasRenderingContext2D,
		scrollLeft: number,
		width: number,
		height: number,
	) => {
		const zoom = scale.zoom;
		const unit = scale.unit;
		const segments = scale.segments;
		context.clearRect(0, 0, width, height);
		context.save();
		context.strokeStyle = "#71717a";
		context.fillStyle = "#71717a";
		context.lineWidth = 1;
		context.font = `${SMALL_FONT_SIZE}px ${SECONDARY_FONT}`;
		context.textBaseline = "top";

		context.translate(0.5, 0);
		context.beginPath();

		const zoomUnit = unit * zoom * PREVIEW_FRAME_WIDTH;
		const minRange = Math.floor(scrollLeft / zoomUnit);
		const maxRange = Math.ceil((scrollLeft + width) / zoomUnit);
		const length = maxRange - minRange;

		// Draw text before drawing the lines
		for (let i = 0; i <= length; ++i) {
			const value = i + minRange;

			if (value < 0) continue;

			const startValue = (value * zoomUnit) / zoom;
			const startPos = (startValue - scrollLeft / zoom) * zoom;

			if (startPos < -zoomUnit || startPos >= width + zoomUnit) continue;
			const text = textFormat(startValue);

			// Calculate the textOffsetX value
			const textWidth = context.measureText(text).width;
			const textOffsetX = -textWidth / 2;

			// Adjust textOffsetY so it stays inside the canvas but above the lines
			context.fillText(text, startPos + textOffsetX + offsetX, textOffsetY);
		}

		// Draw long and short lines after the text
		for (let i = 0; i <= length; ++i) {
			const value = i + minRange;

			if (value < 0) continue;

			const startValue = value * zoomUnit;
			const startPos = startValue - scrollLeft + offsetX;

			for (let j = 0; j < segments; ++j) {
				const pos = startPos + (j / segments) * zoomUnit;

				if (pos < 0 || pos >= width) continue;

				const lineSize = j % segments ? shortLineSize : longLineSize;

				// Set color based on line size
				if (lineSize === shortLineSize) {
					context.strokeStyle = "#52525b"; // Yellow for short lines
				} else {
					context.strokeStyle = "#18181b"; // Red for long lines
				}

				const origin = 18; // Increase the origin to start lines lower, below the text

				const [x1, y1] = [pos, origin];
				const [x2, y2] = [x1, y1 + lineSize];

				context.beginPath(); // Begin a new path for each line
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);

				// Set color based on line size
				if (lineSize === shortLineSize) {
					context.stroke(); // Draw the line
				}
			}
		}

		context.restore();
	};

	const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
		console.log("Ruler mouse down");
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const clickX = event.clientX - rect.left;

		setIsDragging(true);
		setHasDragged(false);

		// Update ref state
		dragRef.current = {
			startX: clickX,
			startScrollPos: scrollLeft,
			isDragging: true,
			hasDragged: false,
		};

		// Prevent text selection during drag
		if (event.cancelable) {
			event.preventDefault();
		}
	};

	const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();

		// Handle two-finger pinch gesture start
		if (event.touches.length >= 2) {
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			const distance = Math.hypot(
				touch1.clientX - touch2.clientX,
				touch1.clientY - touch2.clientY,
			);
			const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;

			pinchRef.current = {
				isPinching: true,
				startDistance: Math.max(1, distance),
				startZoom: scale.zoom,
				startScrollLeft: scrollLeft,
				midX,
			};

			setIsPinching(true);
			setIsDragging(false);
			dragRef.current.isDragging = false;
			dragRef.current.hasDragged = true;
			return;
		}

		// Single touch drag
		const touch = event.touches[0];
		const touchX = touch.clientX - rect.left;

		setIsDragging(true);
		setHasDragged(false);

		// Update ref state
		dragRef.current = {
			startX: touchX,
			startScrollPos: scrollLeft,
			isDragging: true,
			hasDragged: false,
		};
	};

	const handleMouseMove = useCallback(
		(event: MouseEvent) => {
			if (!dragRef.current.isDragging) return;

			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const currentX = event.clientX - rect.left;
			const deltaX = Math.abs(dragRef.current.startX - currentX);

			// Only start dragging if we've moved more than 5 pixels
			if (deltaX > 5) {
				dragRef.current.hasDragged = true;
				setHasDragged(true);

				const newScrollLeft = Math.max(
					0,
					dragRef.current.startScrollPos + (dragRef.current.startX - currentX),
				);

				onScroll?.(newScrollLeft);
			}
		},
		[onScroll],
	);

	const handleTouchMove = useCallback(
		(event: React.TouchEvent<HTMLCanvasElement> | TouchEvent) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			// Handle two-finger pinch zoom
			if (event.touches.length >= 2) {
				if (!pinchRef.current.isPinching) {
					const touch1 = event.touches[0];
					const touch2 = event.touches[1];
					const rect = canvas.getBoundingClientRect();
					const distance = Math.hypot(
						touch1.clientX - touch2.clientX,
						touch1.clientY - touch2.clientY,
					);
					const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
					pinchRef.current = {
						isPinching: true,
						startDistance: Math.max(1, distance),
						startZoom: scale.zoom,
						startScrollLeft: scrollLeft,
						midX,
					};
					setIsPinching(true);
					setIsDragging(false);
					dragRef.current.isDragging = false;
					dragRef.current.hasDragged = true;
				}

				if (event.cancelable) {
					event.preventDefault();
				}

				const touch1 = event.touches[0];
				const touch2 = event.touches[1];
				const currentDistance = Math.hypot(
					touch1.clientX - touch2.clientX,
					touch1.clientY - touch2.clientY,
				);

				const ratio = currentDistance / pinchRef.current.startDistance;
				const newZoom = pinchRef.current.startZoom * ratio;

				const minZoom = TIMELINE_ZOOM_LEVELS[0].zoom;
				const maxZoom =
					TIMELINE_ZOOM_LEVELS[TIMELINE_ZOOM_LEVELS.length - 1].zoom;
				const clampedZoom = Math.max(minZoom, Math.min(newZoom, maxZoom));

				// Keep time at midpoint stationary under the pinch fingers
				const focalX =
					pinchRef.current.midX - offsetX + pinchRef.current.startScrollLeft;
				const timeAtFocal = unitsToTimeMs(focalX, pinchRef.current.startZoom);

				let targetScroll = pinchRef.current.startScrollLeft;
				if (Number.isFinite(timeAtFocal)) {
					const newFocalUnits = timeMsToUnits(timeAtFocal, clampedZoom);
					targetScroll = Math.max(
						0,
						newFocalUnits - (pinchRef.current.midX - offsetX),
					);
				}

				pendingScaleRef.current = {
					zoom: clampedZoom,
					scrollLeft: targetScroll,
				};

				if (rafRef.current === null) {
					rafRef.current = requestAnimationFrame(() => {
						rafRef.current = null;
						if (!pendingScaleRef.current) return;
						const { zoom: targetZoom, scrollLeft: nextScroll } =
							pendingScaleRef.current;

						const fitIndex = findIndex(
							TIMELINE_ZOOM_LEVELS,
							(level) => level.zoom > targetZoom,
						);
						const clampedIndex = Math.max(
							0,
							Math.min(fitIndex, TIMELINE_ZOOM_LEVELS.length - 1),
						);
						const segments =
							TIMELINE_ZOOM_LEVELS[clampedIndex]?.segments ?? 5;

						dispatch(TIMELINE_SCALE_CHANGED, {
							payload: {
								scale: {
									index: clampedIndex,
									unit: 1 / targetZoom,
									zoom: targetZoom,
									segments,
								},
							},
						});

						onScroll?.(nextScroll);
						dispatch(`${TIMELINE_PREFIX}:scroll:to`, {
							payload: { scrollLeft: nextScroll },
						});
					});
				}

				return;
			}

			// Single-finger drag
			if (pinchRef.current.isPinching) return;
			if (!dragRef.current.isDragging) return;

			const rect = canvas.getBoundingClientRect();
			const touch = event.touches[0];
			if (!touch) return;
			const currentX = touch.clientX - rect.left;
			const deltaX = Math.abs(dragRef.current.startX - currentX);

			// Only start dragging if we've moved more than 5 pixels
			if (deltaX > 5) {
				dragRef.current.hasDragged = true;
				setHasDragged(true);

				const newScrollLeft = Math.max(
					0,
					dragRef.current.startScrollPos + (dragRef.current.startX - currentX),
				);

				onScroll?.(newScrollLeft);
			}
		},
		[onScroll, offsetX, scale.zoom, scrollLeft],
	);

	const handleMouseUp = useCallback(() => {
		if (dragRef.current.isDragging) {
			dragRef.current.isDragging = false;
			dragRef.current.hasDragged = false;
			setIsDragging(false);
			setHasDragged(false);
		}
	}, []);

	const handleTouchEnd = useCallback(() => {
		if (pinchRef.current.isPinching) {
			pinchRef.current.isPinching = false;
			setIsPinching(false);
			dragRef.current.isDragging = false;
			dragRef.current.hasDragged = true;
			setIsDragging(false);
			setHasDragged(false);
		}
		if (dragRef.current.isDragging) {
			dragRef.current.isDragging = false;
			dragRef.current.hasDragged = false;
			setIsDragging(false);
			setHasDragged(false);
		}
	}, []);

	const handleLocalMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
		// Check if we dragged before resetting state
		const wasDragging = dragRef.current.isDragging;
		const hadDragged = dragRef.current.hasDragged;

		// Always reset drag state on local mouse up
		if (wasDragging) {
			dragRef.current.isDragging = false;
			dragRef.current.hasDragged = false;
			setIsDragging(false);
			setHasDragged(false);
		}

		// Only handle click if we haven't dragged at all
		if (!hadDragged) {
			const canvas = canvasRef.current;
			if (!canvas) return;

			// Get the bounding box of the canvas to calculate the relative click position
			const rect = canvas.getBoundingClientRect();
			const clickX = event.clientX - rect.left;

			// Calculate total x position, including scrollLeft
			const totalX =
				clickX + scrollLeft - timelineOffsetX - TIMELINE_OFFSET_CANVAS_LEFT;

			onClick?.(totalX);
		}
	};

	const handleLocalTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
		const wasPinching = pinchRef.current.isPinching;
		if (wasPinching) {
			pinchRef.current.isPinching = false;
			setIsPinching(false);
			dragRef.current.isDragging = false;
			dragRef.current.hasDragged = true;
			setIsDragging(false);
			setHasDragged(false);
			return;
		}

		// Check if we dragged before resetting state
		const wasDragging = dragRef.current.isDragging;
		const hadDragged = dragRef.current.hasDragged;

		// Always reset drag state on local touch end
		if (wasDragging) {
			dragRef.current.isDragging = false;
			dragRef.current.hasDragged = false;
			setIsDragging(false);
			setHasDragged(false);
		}

		// Only handle tap if we haven't dragged or pinched at all
		if (!hadDragged && !wasPinching && event.changedTouches.length === 1) {
			const canvas = canvasRef.current;
			if (!canvas) return;

			// Get the bounding box of the canvas to calculate the relative touch position
			const rect = canvas.getBoundingClientRect();
			const touch = event.changedTouches[0];
			const touchX = touch.clientX - rect.left;

			// Calculate total x position, including scrollLeft
			const totalX =
				touchX + scrollLeft - timelineOffsetX - TIMELINE_OFFSET_CANVAS_LEFT;

			onClick?.(totalX);
		}
	};

	// Cleanup any scheduled raf on unmount
	useEffect(() => {
		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, []);

	// Add global mouse and touch event listeners for drag and pinch
	useEffect(() => {
		if (isDragging || isPinching) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			document.addEventListener("touchmove", handleTouchMove as any, {
				passive: false,
			});
			document.addEventListener("touchend", handleTouchEnd);
			document.addEventListener("touchcancel", handleTouchEnd);

			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
				document.removeEventListener("touchmove", handleTouchMove as any);
				document.removeEventListener("touchend", handleTouchEnd);
				document.removeEventListener("touchcancel", handleTouchEnd);
			};
		}
	}, [
		isDragging,
		isPinching,
		handleMouseMove,
		handleMouseUp,
		handleTouchMove,
		handleTouchEnd,
	]);

	return (
		<div
			className="border-t border-border"
			style={{
				position: "relative",
				width: "100%",
				height: `${canvasSize.height}px`,
			}}
		>
			<canvas
				onMouseDown={handleMouseDown}
				onMouseUp={handleLocalMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleLocalTouchEnd}
				ref={canvasRef}
				height={canvasSize.height}
				style={{
					cursor: isDragging ? "grabbing" : "grab",
					width: "100%",
					display: "block",
					touchAction: "none", // Prevent default touch behaviors
				}}
			/>
		</div>
	);
};

export default Ruler;
