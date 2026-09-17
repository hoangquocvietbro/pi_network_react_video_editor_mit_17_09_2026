import { findIndex } from "./search";
import {
	FRAME_INTERVAL,
	PREVIEW_FRAME_WIDTH,
	TIMELINE_OFFSET_X,
} from "../constants/constants";
import { ITimelineScaleState } from "@designcombo/types";
import { TIMELINE_ZOOM_LEVELS } from "../constants/scale";

export function getPreviousZoomLevel(
	currentZoom: ITimelineScaleState,
): ITimelineScaleState {
	const previousZoom = getPreviousZoom(currentZoom);

	return previousZoom || TIMELINE_ZOOM_LEVELS[0];
}

export function getZoomByIndex(index: number) {
	return TIMELINE_ZOOM_LEVELS[index];
}
export function getNextZoomLevel(
	currentZoom: ITimelineScaleState,
): ITimelineScaleState {
	const nextZoom = getNextZoom(currentZoom);

	return nextZoom || TIMELINE_ZOOM_LEVELS[TIMELINE_ZOOM_LEVELS.length - 1];
}

export const getPreviousZoom = (
	currentZoom: ITimelineScaleState,
): ITimelineScaleState | null => {
	// Filter zoom levels that are smaller than the current zoom
	const smallerZoomLevels = TIMELINE_ZOOM_LEVELS.filter(
		(level) => level.zoom < currentZoom.zoom,
	);

	// If there are no smaller zoom levels, return null (no previous zoom)
	if (smallerZoomLevels.length === 0) {
		return null;
	}

	// Get the zoom level with the largest zoom value that's still smaller than the current zoom
	const previousZoom = smallerZoomLevels.reduce((prev, curr) =>
		curr.zoom > prev.zoom ? curr : prev,
	);

	return previousZoom;
};

export const getNextZoom = (
	currentZoom: ITimelineScaleState,
): ITimelineScaleState | null => {
	// Filter zoom levels that are larger than the current zoom
	const largerZoomLevels = TIMELINE_ZOOM_LEVELS.filter(
		(level) => level.zoom > currentZoom.zoom,
	);

	// If there are no larger zoom levels, return null (no next zoom)
	if (largerZoomLevels.length === 0) {
		return null;
	}

	// Get the zoom level with the smallest zoom value that's still larger than the current zoom
	const nextZoom = largerZoomLevels.reduce((prev, curr) =>
		curr.zoom < prev.zoom ? curr : prev,
	);

	return nextZoom;
};

export function getFitZoomLevel(
	totalLengthMs: number,
	zoom = 1,
	scrollOffset?: number,
): ITimelineScaleState {
	if (!Number.isFinite(totalLengthMs) || totalLengthMs <= 0) {
		return (
			TIMELINE_ZOOM_LEVELS[7] || {
				segments: 5,
				index: 7,
				zoom: 1 / 300,
				unit: 300,
			}
		);
	}

	const getVisibleWidth = () => {
		const timelineCanvas = document.getElementById(
			"designcombo-timeline-canvas",
		) as HTMLElement;
		const offsetWidth =
			timelineCanvas?.offsetWidth ||
			(typeof window !== "undefined" ? window.innerWidth : 800);

		// The canvas tracks have an internal left offset: TIMELINE_OFFSET_CANVAS_LEFT (16px).
		// We add right padding (24px on mobile, 32px on desktop) so media items fit neatly
		// inside the viewport with clean breathing room on both sides without overflowing.
		const isSmall =
			typeof window !== "undefined" && window.innerWidth < 768;
		const horizontalPadding = isSmall ? 40 : 48;

		// Use 1 to prevent NaN because of dividing by 0.
		return Math.max(1, offsetWidth - horizontalPadding);
	};

	const getFullWidth = () => {
		return timeMsToUnits(totalLengthMs, zoom);
	};

	const fullWidth = getFullWidth();
	if (!Number.isFinite(fullWidth) || fullWidth <= 0) {
		return (
			TIMELINE_ZOOM_LEVELS[7] || {
				segments: 5,
				index: 7,
				zoom: 1 / 300,
				unit: 300,
			}
		);
	}

	const multiplier = getVisibleWidth() / fullWidth;
	const targetZoom = zoom * multiplier;

	if (!Number.isFinite(targetZoom) || targetZoom <= 0) {
		return (
			TIMELINE_ZOOM_LEVELS[7] || {
				segments: 5,
				index: 7,
				zoom: 1 / 300,
				unit: 300,
			}
		);
	}

	const fitZoomIndex = findIndex(TIMELINE_ZOOM_LEVELS, (level) => {
		return level.zoom > targetZoom;
	});

	const clampedIndex = Math.max(
		0,
		Math.min(fitZoomIndex, TIMELINE_ZOOM_LEVELS.length - 1),
	);
	const matchedLevel = TIMELINE_ZOOM_LEVELS[clampedIndex];

	return {
		segments: matchedLevel?.segments ?? 5,
		index: clampedIndex,
		zoom: targetZoom,
		unit: 1 / targetZoom,
	};
}

export function timeMsToUnits(timeMs: number, zoom = 1): number {
	const zoomedFrameWidth = PREVIEW_FRAME_WIDTH * zoom;
	const frames = timeMs * (60 / 1000);

	return frames * zoomedFrameWidth;
}

export function unitsToTimeMs(units: number, zoom = 1): number {
	const zoomedFrameWidth = PREVIEW_FRAME_WIDTH * zoom;

	const frames = units / zoomedFrameWidth;

	return frames * FRAME_INTERVAL;
}

export function calculateTimelineWidth(
	totalLengthMs: number,
	zoom = 1,
): number {
	return timeMsToUnits(totalLengthMs, zoom);
}
