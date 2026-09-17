import { useEffect, useRef, useState } from "react";
import { Selection, Moveable } from "@interactify/toolkit";
import { getIdFromClassName } from "../utils/scene";
import { dispatch } from "@designcombo/events";
import { EDIT_OBJECT } from "@designcombo/state";
import {
	SelectionInfo,
	emptySelection,
	getSelectionByIds,
	getTargetById,
} from "../utils/target";
import useStore from "../store/use-store";
import StateManager from "@designcombo/state";
import { getCurrentTime } from "../utils/time";

let holdGroupPosition: Record<string, any> | null = null;
let dragStartEnd = false;

interface SceneInteractionsProps {
	stateManager: StateManager;
	containerRef: React.RefObject<HTMLDivElement>;
	zoom: number;
	size: { width: number; height: number };
	isPinching?: boolean;
}
export function SceneInteractions({
	stateManager,
	containerRef,
	zoom,
	size,
	isPinching
}: SceneInteractionsProps) {
	const [targets, setTargets] = useState<HTMLDivElement[]>([]);
	const [selection, setSelection] = useState<Selection>();
	const { activeIds, setState, trackItemsMap, playerRef, setSceneMoveableRef } =
		useStore();
	const moveableRef = useRef<Moveable>(null);
	const [selectionInfo, setSelectionInfo] =
		useState<SelectionInfo>(emptySelection);

	useEffect(() => {
		const updateTargets = (time?: number) => {
			const currentTime = time || getCurrentTime();
			const { trackItemsMap } = useStore.getState();
			const targetIds = activeIds.filter((id) => {
				return (
					trackItemsMap[id]?.display.from <= currentTime &&
					trackItemsMap[id]?.display.to >= currentTime
				);
			});
			const targets = targetIds.map(
				(id) => getTargetById(id) as HTMLDivElement,
			);
			selection?.setSelectedTargets(targets);
			const selInfo = getSelectionByIds(targetIds);
			setSelectionInfo(selInfo);
			setTargets(selInfo.targets as HTMLDivElement[]);
		};
		const timer = setTimeout(() => {
			updateTargets();
		});

		const onSeeked = (v: any) => {
			setTimeout(() => {
				const { fps } = useStore.getState();
				const seekedTime = (v.detail.frame / fps) * 1000;
				updateTargets(seekedTime);
			});
		};
		playerRef?.current?.addEventListener("seeked", onSeeked);

		return () => {
			playerRef?.current?.removeEventListener("seeked", onSeeked);
			clearTimeout(timer);
		};
	}, [activeIds, playerRef, trackItemsMap]);

	useEffect(() => {
		const selection = new Selection({
			container: containerRef.current,
			boundContainer: true,
			hitRate: 0,
			selectableTargets: [".designcombo-scene-item"],
			selectFromInside: false,
			selectByClick: true,
			toggleContinueSelect: "shift",
			dragCondition: (e: any) => {
				if (e.inputEvent?.touches && e.inputEvent.touches.length > 1) {
					return false;
				}
				return true;
			}
		})
			.on("select", (e) => {
				// Filter out audio items from selection
				const filteredSelected = e.selected.filter(
					(el) => !el.className.includes("designcombo-scene-item-type-audio"),
				);

				const ids = filteredSelected.map((el) =>
					getIdFromClassName(el.className),
				);

				setTargets(filteredSelected as HTMLDivElement[]);

				stateManager.updateState(
					{
						activeIds: ids,
					},
					{
						updateHistory: false,
						kind: "layer:selection",
					},
				);
			})
			.on("dragStart", (e) => {
				const target = e.inputEvent.target as HTMLDivElement;
				dragStartEnd = false;

				if (targets.includes(target)) {
					e.stop();
				}
				if (
					target &&
					moveableRef?.current?.moveable.isMoveableElement(target)
				) {
					e.stop();
				}
			})
			.on("dragEnd", () => {
				dragStartEnd = true;
			})
			.on("selectEnd", (e) => {
				const moveable = moveableRef.current;
				if (e.isDragStart) {
					e.inputEvent.preventDefault();
					setTimeout(() => {
						if (!dragStartEnd) {
							moveable?.moveable.dragStart(e.inputEvent);
						}
					});
				} else {
					// Filter out audio items from selection
					const filteredSelected = e.selected.filter(
						(el) => !el.className.includes("designcombo-scene-item-type-audio"),
					) as HTMLDivElement[];

					const ids = filteredSelected.map((el) =>
						getIdFromClassName(el.className),
					);

					stateManager.updateState(
						{
							activeIds: ids,
						},
						{
							updateHistory: false,
							kind: "layer:selection",
						},
					);

					setTargets(filteredSelected);
				}
			});
		setSelection(selection);
		return () => {
			selection.destroy();
		};
	}, []);

	useEffect(() => {
		const activeSelectionSubscription = stateManager.subscribeToActiveIds(
			(newState) => {
				setState(newState);
			},
		);

		return () => {
			activeSelectionSubscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		const handle = requestAnimationFrame(() => {
			moveableRef.current?.moveable.updateRect();
		});
		return () => cancelAnimationFrame(handle);
	}, [trackItemsMap, targets, zoom, size]);


	useEffect(() => {
		setSceneMoveableRef(moveableRef as React.RefObject<Moveable>);
	}, [moveableRef]);
	return (
		<Moveable
			ref={moveableRef}
			rotationPosition={"bottom"}
			renderDirections={selectionInfo.controls}
			{...selectionInfo.ables}
			origin={false}
			target={isPinching ? [] : targets}
			zoom={1 / zoom}
			className={`designcombo-scene-moveable ${isPinching ? "pointer-events-none" : ""}`}
			onDrag={({ target, top, left }) => {
				target.style.top = `${top}px`;
				target.style.left = `${left}px`;
			}}
			onDragEnd={({ target, isDrag }) => {
				if (!isDrag) return;
				const targetId = getIdFromClassName(target.className) as string;

				dispatch(EDIT_OBJECT, {
					payload: {
						[targetId]: {
							details: {
								left: target.style.left,
								top: target.style.top,
							},
						},
					},
				});
			}}
			onScale={({ target, transform, direction }) => {
				const [xControl, yControl] = direction;

				const moveX = xControl === -1;
				const moveY = yControl === -1;

				const scaleRegex = /scale\(([^)]+)\)/;
				const match = target.style.transform ? target.style.transform.match(scaleRegex) : null;

				//get current scale safely (handles scale(s) and scale(sx, sy), default 1)
				let scaleX = 1;
				let scaleY = 1;
				if (match) {
					const parts1 = match[1].split(",");
					const rawScaleX = Number.parseFloat(parts1[0].trim());
					scaleX = isNaN(rawScaleX) ? 1 : rawScaleX;
					const rawScaleY = parts1[1] ? Number.parseFloat(parts1[1].trim()) : scaleX;
					scaleY = isNaN(rawScaleY) ? scaleX : rawScaleY;
				}

				//get new Scale safely
				const match2 = transform.match(scaleRegex);
				let newScaleX = scaleX;
				let newScaleY = scaleY;
				if (match2) {
					const parts2 = match2[1].split(",");
					const rawNewScaleX = Number.parseFloat(parts2[0].trim());
					newScaleX = isNaN(rawNewScaleX) ? scaleX : rawNewScaleX;
					const rawNewScaleY = parts2[1] ? Number.parseFloat(parts2[1].trim()) : newScaleX;
					newScaleY = isNaN(rawNewScaleY) ? newScaleX : rawNewScaleY;
				}

				const htmlTarget = target as HTMLElement;
				const baseWidth = htmlTarget.clientWidth || htmlTarget.offsetWidth || parseFloat(htmlTarget.style?.width) || 100;
				const baseHeight = htmlTarget.clientHeight || htmlTarget.offsetHeight || parseFloat(htmlTarget.style?.height) || 100;

				const currentWidth = baseWidth * scaleX;
				const currentHeight = baseHeight * scaleY;

				const newWidth = baseWidth * newScaleX;
				const newHeight = baseHeight * newScaleY;
				target.style.transform = transform;

				//Move element to initial Left position
				const diffX = currentWidth - newWidth;
				let newLeft = Number.parseFloat(target.style.left || "0") - diffX / 2;

				const diffY = currentHeight - newHeight;
				let newTop = Number.parseFloat(target.style.top || "0") - diffY / 2;

				if (moveX) {
					newLeft += diffX;
				}
				if (moveY) {
					newTop += diffY;
				}
				target.style.left = `${newLeft}px`;
				target.style.top = `${newTop}px`;
			}}
			onScaleEnd={({ target }) => {
				if (!target.style.transform) return;
				const targetId = getIdFromClassName(target.className) as string;

				dispatch(EDIT_OBJECT, {
					payload: {
						[targetId]: {
							details: {
								transform: target.style.transform,
								left: Number.parseFloat(target.style.left),
								top: Number.parseFloat(target.style.top),
							},
						},
					},
				});
			}}
			onRotate={({ target, transform }) => {
				target.style.transform = transform;
			}}
			onRotateEnd={({ target }) => {
				if (!target.style.transform) return;
				const targetId = getIdFromClassName(target.className) as string;
				dispatch(EDIT_OBJECT, {
					payload: {
						[targetId]: {
							details: {
								transform: target.style.transform,
							},
						},
					},
				});
			}}
			onDragGroup={({ events }) => {
				holdGroupPosition = {};
				for (let i = 0; i < events.length; i++) {
					const event = events[i];
					const id = getIdFromClassName(event.target.className);
					const trackItem = trackItemsMap[id];
					const left =
						Number.parseFloat(trackItem?.details.left as string) +
						event.beforeTranslate[0];
					const top =
						Number.parseFloat(trackItem?.details.top as string) +
						event.beforeTranslate[1];
					event.target.style.left = `${left}px`;
					event.target.style.top = `${top}px`;
					holdGroupPosition[id] = {
						left: left,
						top: top,
					};
				}
			}}
			onResize={({
				target,
				width: nextWidth,
				height: nextHeight,
				direction,
			}) => {
				if (direction[1] === 1) {
					const currentWidth = target.clientWidth;
					const currentHeight = target.clientHeight;

					// Get new width and height
					const scaleY = nextHeight / currentHeight;
					const scale = scaleY;

					// Update target dimensions
					target.style.width = `${currentWidth * scale}px`;
					target.style.height = `${currentHeight * scale}px`;

					// Safely access nested elements
					const animationDiv = target.firstElementChild
						?.firstElementChild as HTMLDivElement | null;
					if (animationDiv) {
						animationDiv.style.width = `${currentWidth * scale}px`;
						animationDiv.style.height = `${currentHeight * scale}px`;

						const textDiv =
							animationDiv.firstElementChild as HTMLDivElement | null;
						if (textDiv) {
							const fontSize = Number.parseFloat(
								getComputedStyle(textDiv).fontSize,
							);
							textDiv.style.fontSize = `${fontSize * scale}px`;
							textDiv.style.width = `${currentWidth * scale}px`;
							textDiv.style.height = `${currentHeight * scale}px`;
						}
					}
				} else {
					target.style.width = `${nextWidth}px`;
					target.style.height = `${nextHeight}px`;

					// Safely access nested elements
					const animationDiv = target.firstElementChild
						?.firstElementChild as HTMLDivElement | null;
					if (animationDiv) {
						animationDiv.style.width = `${nextWidth}px`;
						animationDiv.style.height = `${nextHeight}px`;

						const textDiv =
							animationDiv.firstElementChild as HTMLDivElement | null;
						if (textDiv) {
							textDiv.style.width = `${nextWidth}px`;
							textDiv.style.height = `${nextHeight}px`;
						}
					}
				}
			}}
			onResizeEnd={({ target }) => {
				const targetId = getIdFromClassName(target.className) as string;
				const textDiv = target.firstElementChild?.firstElementChild
					?.firstElementChild as HTMLDivElement;
				dispatch(EDIT_OBJECT, {
					payload: {
						[targetId]: {
							details: {
								width: Number.parseFloat(target.style.width),
								height: Number.parseFloat(target.style.height),
								fontSize: Number.parseFloat(textDiv.style.fontSize),
							},
						},
					},
				});
			}}
			onDragGroupEnd={() => {
				if (holdGroupPosition) {
					const payload: Record<string, Partial<any>> = {};
					for (const id of Object.keys(holdGroupPosition)) {
						const left = holdGroupPosition[id].left;
						const top = holdGroupPosition[id].top;
						payload[id] = {
							details: {
								top: `${top}px`,
								left: `${left}px`,
							},
						};
					}
					dispatch(EDIT_OBJECT, {
						payload: payload,
					});
					holdGroupPosition = null;
				}
			}}
		/>
	);
}
