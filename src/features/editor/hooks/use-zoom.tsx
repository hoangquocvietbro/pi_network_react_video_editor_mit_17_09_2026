import { ISize } from "@designcombo/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type ZoomPreset = "fit" | 0.25 | 0.5 | 0.75 | 1 | 1.5 | 2;

function useZoom(containerRef: React.RefObject<HTMLDivElement>, size: ISize) {
	const [zoom, setZoom] = useState(0.01);
	const [fitZoom, setFitZoom] = useState(0.01);
	const [zoomMode, setZoomMode] = useState<"fit" | "custom">("fit");
	const [isPinching, setIsPinching] = useState(false);
	const currentZoomRef = useRef(0.01);
	const zoomModeRef = useRef<"fit" | "custom">("fit");
	const touchStartDistRef = useRef<number>(0);
	const touchStartZoomRef = useRef<number>(0.01);

	currentZoomRef.current = zoom;
	zoomModeRef.current = zoomMode;

	const calculateZoom = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const PADDING = 32;
		const containerHeight = Math.max(10, container.clientHeight - PADDING);
		const containerWidth = Math.max(10, container.clientWidth - PADDING);
		const { width, height } = size;

		if (!width || !height) return;
		const desiredZoom = Math.min(
			containerWidth / width,
			containerHeight / height,
		);
		const safeZoom = Math.max(0.01, Math.min(10, desiredZoom));
		setFitZoom(safeZoom);

		if (zoomModeRef.current === "fit") {
			setZoom(safeZoom);
		}
	}, [containerRef, size]);
	// Recalculate zoom when size changes or mode set to fit
	useEffect(() => {
		calculateZoom();
	}, [calculateZoom]);
	// Watch for container resize
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Use ResizeObserver to watch for container size changes
		const resizeObserver = new ResizeObserver(() => {
			calculateZoom();
		});

		resizeObserver.observe(container);

		// Also listen for window resize events
		const handleWindowResize = () => {
			calculateZoom();
		};

		window.addEventListener("resize", handleWindowResize);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", handleWindowResize);
		};
	}, [calculateZoom]);

	// Set explicit preset zoom (Fit, 25%, 50%, 75%, 100%, 150%, 200%)
	const setPresetZoom = useCallback((preset: ZoomPreset | number) => {
		if (preset === "fit") {
			setZoomMode("fit");
			zoomModeRef.current = "fit";
			calculateZoom();
		} else {
			const numericZoom = typeof preset === "number" ? preset : 1;
			const clamped = Math.max(0.05, Math.min(5.0, numericZoom));
			setZoomMode("custom");
			zoomModeRef.current = "custom";
			setZoom(clamped);
		}
	}, [calculateZoom]);

	// Mobile multi-touch pinch-to-zoom
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const getTouchDistance = (e: TouchEvent): number => {
			if (e.touches.length < 2) return 0;
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const dx = t1.clientX - t2.clientX;
			const dy = t1.clientY - t2.clientY;
			return Math.sqrt(dx * dx + dy * dy);
		};

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				// Prevent default browser viewport zoom
				e.preventDefault();
				const dist = getTouchDistance(e);
				touchStartDistRef.current = dist;
				touchStartZoomRef.current = currentZoomRef.current;
				setIsPinching(true);
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2 && touchStartDistRef.current > 0) {
				e.preventDefault();
				const currentDist = getTouchDistance(e);
				if (currentDist > 0) {
					const ratio = currentDist / touchStartDistRef.current;
					const newZoom = Math.max(0.05, Math.min(5.0, touchStartZoomRef.current * ratio));
					setZoomMode("custom");
					zoomModeRef.current = "custom";
					setZoom(newZoom);
				}
			}
		};

		const handleTouchEnd = (e: TouchEvent) => {
			if (e.touches.length < 2) {
				touchStartDistRef.current = 0;
				setIsPinching(false);
			}
		};

		// Trackpad / Ctrl+Wheel zoom
		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				const factor = e.deltaY > 0 ? 0.92 : 1.08;
				const newZoom = Math.max(0.05, Math.min(5.0, currentZoomRef.current * factor));
				setZoomMode("custom");
				zoomModeRef.current = "custom";
				setZoom(newZoom);
			}
		};

		container.addEventListener("touchstart", handleTouchStart, { passive: false });
		container.addEventListener("touchmove", handleTouchMove, { passive: false });
		container.addEventListener("touchend", handleTouchEnd, { passive: true });
		container.addEventListener("touchcancel", handleTouchEnd, { passive: true });
		container.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			container.removeEventListener("touchstart", handleTouchStart);
			container.removeEventListener("touchmove", handleTouchMove);
			container.removeEventListener("touchend", handleTouchEnd);
			container.removeEventListener("touchcancel", handleTouchEnd);
			container.removeEventListener("wheel", handleWheel);
		};
	}, [containerRef]);

	const handlePinch = useCallback((e: any) => {
		const deltaY = (e as any)?.inputEvent?.deltaY ?? 0;
		const changer = deltaY > 0 ? 0.0085 : -0.0085;
		const currentZoom = currentZoomRef.current;
		const newZoom = Math.max(0.05, Math.min(5.0, currentZoom + changer));
		setZoomMode("custom");
		zoomModeRef.current = "custom";
		setZoom(newZoom);
	}, []);

	return {
		zoom,
		fitZoom,
		zoomPercent: Math.round(zoom * 100),
		zoomMode,
		isPinching,
		setPresetZoom,
		handlePinch,
		recalculateZoom: calculateZoom
	};
}

export default useZoom;
