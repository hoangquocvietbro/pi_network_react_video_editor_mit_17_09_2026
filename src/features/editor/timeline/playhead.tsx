import { useCurrentPlayerFrame } from "../hooks/use-current-frame";
import useStore from "../store/use-store";
import { MouseEvent, TouchEvent, useEffect, useRef, useState } from "react";
import { timeMsToUnits, unitsToTimeMs } from "../utils/timeline";
import { TIMELINE_OFFSET_CANVAS_LEFT } from "../constants/constants";
import { useTimelineOffsetX } from "../hooks/use-timeline-offset";
const Playhead = ({ scrollLeft }: { scrollLeft: number }) => {
	const playheadRef = useRef<HTMLDivElement>(null);
	const { playerRef, fps, scale } = useStore();
	const currentFrame = useCurrentPlayerFrame(playerRef);
	const position =
		timeMsToUnits((currentFrame / fps) * 1000, scale.zoom) - scrollLeft;
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartX, setDragStartX] = useState(0);
	const [dragStartPosition, setDragStartPosition] = useState(position);
	const timelineOffsetX = useTimelineOffsetX();

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleMouseDown = (
		e:
			| MouseEvent<HTMLDivElement, globalThis.MouseEvent>
			| TouchEvent<HTMLDivElement>,
	) => {
		// Only prevent default on mouse events. Touch behavior is controlled via CSS touch-action: none
		if (!("touches" in e) && e.cancelable) {
			e.preventDefault();
		}
		setIsDragging(true);
		const clientX =
			"touches" in e
				? e.touches[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0
				: e.clientX;
		setDragStartX(clientX);
		setDragStartPosition(position);
	};

	const handleMouseMove = (
		e: globalThis.MouseEvent | globalThis.TouchEvent,
	) => {
		if (isDragging) {
			if (!("touches" in e) && e.cancelable) {
				e.preventDefault();
			}
			const clientX =
				"touches" in e
					? e.touches[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0
					: e.clientX;
			const delta = clientX - dragStartX + scrollLeft;
			const newPosition = dragStartPosition + delta;

			const time = unitsToTimeMs(newPosition, scale.zoom);
			if (Number.isFinite(time)) {
				playerRef?.current?.seekTo(Math.max(0, (time * fps) / 1000));
			}
		}
	};

	useEffect(() => {
		const preventDefaultDrag = (e: Event) => {
			if (e.cancelable) {
				e.preventDefault();
			}
		};

		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			document.addEventListener("touchmove", handleMouseMove, {
				passive: false,
			});
			document.addEventListener("touchend", handleMouseUp);
			document.addEventListener("dragstart", preventDefaultDrag);
		} else {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("touchmove", handleMouseMove);
			document.removeEventListener("touchend", handleMouseUp);
			document.removeEventListener("dragstart", preventDefaultDrag);
		}

		// Cleanup event listeners on component unmount
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("touchmove", handleMouseMove);
			document.removeEventListener("touchend", handleMouseUp);
			document.removeEventListener("dragstart", preventDefaultDrag);
		};
	}, [isDragging, handleMouseMove, handleMouseUp]);

	return (
		<div
			ref={playheadRef}
			onMouseDown={handleMouseDown}
			onTouchStart={handleMouseDown}
			onDragStart={(e) => e.preventDefault()}
			style={{
				position: "absolute",
				left: timelineOffsetX + TIMELINE_OFFSET_CANVAS_LEFT + position,
				top: 50,
				width: 1,
				height: "calc(100% - 40px)",
				zIndex: 10,
				cursor: "pointer",
				touchAction: "none", // Prevent default touch actions
			}}
		>
			<div
				style={{
					borderRadius: "0 0 4px 4px",
				}}
				className="absolute top-0 h-4 w-2 -translate-x-1/2 transform bg-white text-xs font-semibold text-zinc-800"
			/>
			<div className="relative h-full">
				<div className="absolute top-0 h-full w-3 -translate-x-1/2 transform" />
				<div className="absolute top-0 h-full w-0.5 -translate-x-1/2 transform bg-white/50" />
			</div>
		</div>
	);
};

export default Playhead;
