import TimelineBase from "@designcombo/timeline";
import Video from "./video";
import { throttle } from "lodash";
import Audio from "./audio";
import { TimelineOptions } from "@designcombo/timeline";
import { ITimelineScaleState } from "@designcombo/types";

if (typeof window !== "undefined" && typeof TouchEvent !== "undefined") {
	if (!("clientX" in TouchEvent.prototype)) {
		Object.defineProperty(TouchEvent.prototype, "clientX", {
			get(this: TouchEvent) {
				const touch = this.changedTouches?.[0] || this.touches?.[0];
				return touch ? touch.clientX : 0;
			},
			configurable: true,
		});
	}
	if (!("clientY" in TouchEvent.prototype)) {
		Object.defineProperty(TouchEvent.prototype, "clientY", {
			get(this: TouchEvent) {
				const touch = this.changedTouches?.[0] || this.touches?.[0];
				return touch ? touch.clientY : 0;
			},
			configurable: true,
		});
	}
}

class Timeline extends TimelineBase {
	public isShiftKey: boolean = false;
	constructor(
		canvasEl: HTMLCanvasElement,
		options: Partial<TimelineOptions> & {
			scale: ITimelineScaleState;
			duration: number;
			guideLineColor?: string;
		},
	) {
		super(canvasEl, options); // Call the parent class constructor

		// Add shift keyboard listener
		window.addEventListener("keydown", this.handleKeyDown);
		window.addEventListener("keyup", this.handleKeyUp);
	}

	public _handleEvent(e: Event, type: string) {
		if (e && (e as any).clientX === undefined) {
			const touch =
				(e as TouchEvent).changedTouches?.[0] ||
				(e as TouchEvent).touches?.[0];
			if (touch) {
				try {
					Object.defineProperty(e, "clientX", {
						value: touch.clientX,
						configurable: true,
					});
					Object.defineProperty(e, "clientY", {
						value: touch.clientY,
						configurable: true,
					});
				} catch {
					// Fallback if property definition is blocked
				}
			}
		}
		// @ts-ignore
		super._handleEvent?.(e, type);
	}

	private handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Shift") {
			this.isShiftKey = true;
		}
	};

	private handleKeyUp = (event: KeyboardEvent) => {
		if (event.key === "Shift") {
			this.isShiftKey = false;
		}
	};

	public purge(): void {
		super.purge();

		// Cleanup event listener for Shift key
		window.removeEventListener("keydown", this.handleKeyDown);
		window.removeEventListener("keyup", this.handleKeyUp);
	}

	public setViewportPos(posX: number, posY: number) {
		const limitedPos = this.getViewportPos(posX, posY);
		const vt = this.viewportTransform;
		vt[4] = limitedPos.x;
		vt[5] = limitedPos.y;
		this.requestRenderAll();
		this.setActiveTrackItemCoords();
		this.onScrollChange();

		this.onScroll?.({
			scrollTop: limitedPos.y,
			scrollLeft: limitedPos.x - this.spacing.left,
		});
	}

	public onScrollChange = throttle(async () => {
		const objects = this.getObjects();
		const viewportTransform = this.viewportTransform;
		const scrollLeft = viewportTransform[4];
		for (const object of objects) {
			if (object instanceof Video || object instanceof Audio) {
				object.onScrollChange({ scrollLeft });
			}
		}
	}, 250);

	public scrollTo({
		scrollLeft,
		scrollTop,
	}: {
		scrollLeft?: number;
		scrollTop?: number;
	}): void {
		const vt = this.viewportTransform; // Create a shallow copy
		let hasChanged = false;

		if (typeof scrollLeft === "number") {
			vt[4] = -scrollLeft + this.spacing.left;
			hasChanged = true;
		}
		if (typeof scrollTop === "number") {
			vt[5] = -scrollTop;
			hasChanged = true;
		}

		if (hasChanged) {
			this.viewportTransform = vt;
			this.getActiveObject()?.setCoords();
			this.onScrollChange();
			this.requestRenderAll();
		}
	}
}

export default Timeline;
