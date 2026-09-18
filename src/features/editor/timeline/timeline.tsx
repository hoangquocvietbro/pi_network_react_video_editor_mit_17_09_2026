// MIT License - React Timeline Editor Implementation with 100% MIT Dependencies
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "./header";
import {
	Timeline as ReactTimelineEditor,
	TimelineState,
} from "@xzdarcy/react-timeline-editor";
import "@xzdarcy/react-timeline-editor/dist/react-timeline-editor.css";

export interface TimelineAction {
	id: string;
	start: number;
	end: number;
	effectId: string;
	selected?: boolean;
	flexible?: boolean;
	movable?: boolean;
	minStart?: number;
	maxEnd?: number;
	data?: any;
}

export interface TimelineRow {
	id: string;
	actions: TimelineAction[];
	rowHeight?: number;
	selected?: boolean;
}

export interface TimelineEffect {
	id: string;
	name?: string;
	source?: any;
}

import useStore from "../store/use-store";
import { useCurrentPlayerFrame } from "../hooks/use-current-frame";
import { useStateManagerEvents } from "../hooks/use-state-manager-events";
import StateManager from "@/lib/state-manager";
import {
	dispatch,
	ACTIVE_SET,
	EDIT_OBJECT,
	MOVE_ITEM_TRACK,
	REORDER_TRACKS,
	ACTIVE_SPLIT,
	ACTIVE_CLONE,
	ACTIVE_DELETE,
} from "@/lib/events";
import {
	Video,
	Music,
	Image as ImageIcon,
	Type,
	Sparkles,
	ChevronUp,
	ChevronDown,
	ArrowUp,
	ArrowDown,
	Plus,
	Scissors,
	Copy,
	Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ITrackItem } from "@/types/editor";
import { generateVideoThumbnail } from "../utils/video-thumbnail";

interface TimelineProps {
	stateManager: StateManager;
}

interface TimelineClipProps {
	action: TimelineAction;
	item?: ITrackItem;
	isSelected: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
}

const TimelineClip = ({
	action,
	item,
	isSelected,
	onMoveUp,
	onMoveDown,
}: TimelineClipProps) => {
	const durationSec = Math.max(0, action.end - action.start);
	const [videoThumb, setVideoThumb] = useState<string | null>(null);

	const initialThumb =
		item?.preview ||
		item?.metadata?.previewUrl ||
		(item?.type === "image" ? item?.details?.src : null);

	useEffect(() => {
		let isMounted = true;
		if (!initialThumb && item?.type === "video" && item?.details?.src) {
			generateVideoThumbnail(item.details.src).then((url) => {
				if (isMounted && url) {
					setVideoThumb(url);
				}
			});
		}
		return () => {
			isMounted = false;
		};
	}, [initialThumb, item?.details?.src, item?.type]);

	const thumbnail = initialThumb || videoThumb;

	let theme = {
		bg: "from-blue-700/60 via-blue-600/40 to-indigo-700/60 border-blue-400/50 text-blue-100",
		icon: <Video className="w-3.5 h-3.5 shrink-0 text-blue-300" />,
	};

	if (item?.type === "audio") {
		theme = {
			bg: "from-emerald-700/60 via-teal-600/40 to-cyan-700/60 border-emerald-400/50 text-emerald-100",
			icon: <Music className="w-3.5 h-3.5 shrink-0 text-emerald-300" />,
		};
	} else if (item?.type === "image") {
		theme = {
			bg: "from-amber-700/60 via-orange-600/40 to-yellow-700/60 border-amber-400/50 text-amber-100",
			icon: <ImageIcon className="w-3.5 h-3.5 shrink-0 text-amber-300" />,
		};
	} else if (item?.type === "text" || item?.type === "caption") {
		theme = {
			bg: "from-purple-700/60 via-violet-600/40 to-pink-700/60 border-purple-400/50 text-purple-100",
			icon: <Type className="w-3.5 h-3.5 shrink-0 text-purple-300" />,
		};
	} else if (item?.type?.includes("AudioBars")) {
		theme = {
			bg: "from-rose-700/60 via-pink-600/40 to-purple-700/60 border-rose-400/50 text-rose-100",
			icon: <Sparkles className="w-3.5 h-3.5 shrink-0 text-rose-300" />,
		};
	}

	return (
		<div
			className={cn(
				"relative h-full w-full flex items-center px-1.5 text-xs font-medium rounded-md overflow-hidden select-none border transition-all cursor-pointer backdrop-blur-sm group",
				"bg-gradient-to-r",
				theme.bg,
				isSelected
					? "ring-2 ring-primary ring-offset-1 ring-offset-[#141619] border-white text-white shadow-[0_0_14px_rgba(59,130,246,0.6)]"
					: "hover:brightness-125",
			)}
		>
			{/* Background thumbnail preview if available */}
			{thumbnail && (
				<div
					className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center"
					style={{ backgroundImage: `url(${thumbnail})` }}
				/>
			)}

			{/* Audio waveform illustration */}
			{item?.type === "audio" && (
				<div className="absolute inset-0 flex items-center justify-around opacity-30 px-2 pointer-events-none">
					{[30, 70, 45, 90, 60, 80, 40, 100, 65, 85, 35, 75, 55, 95, 50].map(
						(h, idx) => (
							<div
								key={idx}
								className="w-[2px] bg-emerald-300 rounded-full"
								style={{ height: `${h}%` }}
							/>
						),
					)}
				</div>
			)}

			{/* Left thumbnail image for video and image */}
			{thumbnail ? (
				<div className="h-7 w-11 rounded overflow-hidden mr-1.5 shrink-0 border border-white/20 bg-black/50 relative shadow-sm z-10">
					<img
						src={thumbnail}
						alt=""
						className="w-full h-full object-cover pointer-events-none"
						crossOrigin="anonymous"
					/>
				</div>
			) : (
				<div className="z-10 mr-1.5">{theme.icon}</div>
			)}

			{/* Title and details */}
			<div className="flex-1 min-w-0 flex items-center gap-1 z-10">
				<span className="truncate font-sans text-[11px]">
					{item?.type === "text" || item?.type === "caption" ? (
						<span className="italic">
							"{item?.details?.text || item?.name || "Text"}"
						</span>
					) : (
						item?.name || item?.type || "Clip"
					)}
				</span>
			</div>

			{/* Duration badge */}
			<span className="ml-1 text-[10px] opacity-80 shrink-0 bg-black/60 px-1.5 py-0.5 rounded font-mono z-10">
				{durationSec.toFixed(1)}s
			</span>

			{/* Move Up/Down Buttons */}
			<div className="flex items-center gap-0.5 ml-1 z-20 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
				<button
					type="button"
					title="Chuyển lên track trên (Alt+↑)"
					onClick={(e) => {
						e.stopPropagation();
						onMoveUp();
					}}
					className="p-0.5 hover:bg-white/30 rounded text-white transition-colors cursor-pointer"
				>
					<ChevronUp className="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					title="Chuyển xuống track dưới (Alt+↓)"
					onClick={(e) => {
						e.stopPropagation();
						onMoveDown();
					}}
					className="p-0.5 hover:bg-white/30 rounded text-white transition-colors cursor-pointer"
				>
					<ChevronDown className="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	);
};

export const Timeline = ({ stateManager }: TimelineProps) => {
	const timelineRef = useRef<TimelineState>(null);
	const { tracks, trackItemsMap, activeIds, scale, playerRef, fps, setTimeline } =
		useStore();
	const currentFrame = useCurrentPlayerFrame(playerRef);

	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		actionId: string;
	} | null>(null);

	// Synchronize state manager events with Zustand store
	useStateManagerEvents(stateManager);

	// Register timeline ref with Zustand store for external access
	useEffect(() => {
		if (timelineRef.current) {
			setTimeline(timelineRef.current);
		}
		return () => {
			setTimeline(null);
		};
	}, [setTimeline]);

	// Sync playback playhead cursor with Remotion Player frame
	useEffect(() => {
		if (timelineRef.current && playerRef?.current) {
			const timeInSeconds = currentFrame / fps;
			timelineRef.current.setTime(timeInSeconds);
		}
	}, [currentFrame, fps, playerRef]);

	// Close context menu when clicking anywhere
	useEffect(() => {
		const handleGlobalClick = () => {
			setContextMenu(null);
		};
		window.addEventListener("click", handleGlobalClick);
		return () => window.removeEventListener("click", handleGlobalClick);
	}, []);

	// Keyboard shortcut: Alt + ArrowUp/ArrowDown to move active clip between tracks
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (activeIds.length === 0) return;
			if (e.altKey && e.key === "ArrowUp") {
				e.preventDefault();
				dispatch(MOVE_ITEM_TRACK, {
					payload: { itemId: activeIds[0], direction: "up" },
				});
			} else if (e.altKey && e.key === "ArrowDown") {
				e.preventDefault();
				dispatch(MOVE_ITEM_TRACK, {
					payload: { itemId: activeIds[0], direction: "down" },
				});
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeIds]);

	// Build editor rows from tracks
	const editorData: TimelineRow[] = useMemo(() => {
		if (!tracks || tracks.length === 0) {
			return [
				{
					id: "default-track",
					actions: [],
					rowHeight: 48,
				},
			];
		}

		return tracks.map((track) => ({
			id: track.id,
			rowHeight: 48,
			actions: (track.items || [])
				.map((itemId) => {
					const item = trackItemsMap[itemId];
					if (!item) return null;
					const start = (item.display?.from || 0) / 1000;
					const end = (item.display?.to || 0) / 1000;
					return {
						id: item.id,
						start,
						end: end > start ? end : start + 0.5,
						effectId: item.type || "video",
						data: item,
					};
				})
				.filter(Boolean) as TimelineAction[],
		}));
	}, [tracks, trackItemsMap]);

	// Define timeline effects matching supported item types
	const effects: Record<string, TimelineEffect> = useMemo(
		() => ({
			video: { id: "video", name: "Video" },
			audio: { id: "audio", name: "Audio" },
			image: { id: "image", name: "Image" },
			text: { id: "text", name: "Text" },
			caption: { id: "caption", name: "Caption" },
			template: { id: "template", name: "Template" },
			composition: { id: "composition", name: "Composition" },
			illustration: { id: "illustration", name: "Illustration" },
			shape: { id: "shape", name: "Shape" },
			rect: { id: "rect", name: "Rectangle" },
			progressBar: { id: "progressBar", name: "Progress Bar" },
			progressSquare: { id: "progressSquare", name: "Progress Square" },
			progressFrame: { id: "progressFrame", name: "Progress Frame" },
			radialAudioBars: { id: "radialAudioBars", name: "Radial Audio Bars" },
			linealAudioBars: { id: "linealAudioBars", name: "Lineal Audio Bars" },
			waveAudioBars: { id: "waveAudioBars", name: "Wave Audio Bars" },
			hillAudioBars: { id: "hillAudioBars", name: "Hill Audio Bars" },
		}),
		[],
	);

	// Calculate dynamic scale width from zoom factor
	const scaleWidth = useMemo(() => {
		const zoomFactor = (scale?.zoom || 1 / 300) * 300;
		return Math.max(60, Math.min(500, Math.round(160 * zoomFactor)));
	}, [scale?.zoom]);

	// Custom clip renderer with thumbnail & track movement buttons
	const getActionRender = (action: TimelineAction) => {
		const item = trackItemsMap[action.id];
		const isSelected = activeIds.includes(action.id);

		return (
			<TimelineClip
				action={action}
				item={item}
				isSelected={isSelected}
				onMoveUp={() => {
					dispatch(MOVE_ITEM_TRACK, {
						payload: { itemId: action.id, direction: "up" },
					});
				}}
				onMoveDown={() => {
					dispatch(MOVE_ITEM_TRACK, {
						payload: { itemId: action.id, direction: "down" },
					});
				}}
			/>
		);
	};

	// Handle dragging a clip horizontally
	const handleActionMoveEnd = ({
		action,
		start,
		end,
	}: {
		action: TimelineAction;
		row: TimelineRow;
		start: number;
		end: number;
	}) => {
		const from = Math.max(0, Math.round(start * 1000));
		const to = Math.max(from + 100, Math.round(end * 1000));

		dispatch(EDIT_OBJECT, {
			payload: {
				[action.id]: {
					display: { from, to },
				},
			},
		});
	};

	// Handle trimming a clip from left or right
	const handleActionResizeEnd = ({
		action,
		start,
		end,
	}: {
		action: TimelineAction;
		row: TimelineRow;
		start: number;
		end: number;
		dir: "right" | "left";
	}) => {
		const from = Math.max(0, Math.round(start * 1000));
		const to = Math.max(from + 100, Math.round(end * 1000));
		const duration = to - from;

		dispatch(EDIT_OBJECT, {
			payload: {
				[action.id]: {
					display: { from, to },
					trim: { from: 0, to: duration },
				},
			},
		});
	};

	// Handle selecting a clip
	const handleClickAction = (
		_e: React.MouseEvent<HTMLElement>,
		param: { action: TimelineAction },
	) => {
		dispatch(ACTIVE_SET, { payload: { activeIds: [param.action.id] } });
	};

	// Right-click context menu for actions
	const handleContextMenuAction = (
		e: React.MouseEvent<HTMLElement>,
		param: { action: TimelineAction },
	) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(ACTIVE_SET, { payload: { activeIds: [param.action.id] } });
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			actionId: param.action.id,
		});
	};

	// Handle reordering tracks via drag and drop
	const handleRowDragEnd = (params: {
		row: TimelineRow;
		editorData: TimelineRow[];
	}) => {
		const trackIds = params.editorData.map((r) => r.id);
		dispatch(REORDER_TRACKS, { payload: { trackIds } });
	};

	// Handle playhead scrubbing
	const handleCursorDrag = (time: number) => {
		if (playerRef?.current) {
			playerRef.current.seekTo(Math.max(0, time * fps));
		}
	};

	const handleClickTimeArea = (time: number) => {
		if (playerRef?.current) {
			playerRef.current.seekTo(Math.max(0, time * fps));
		}
		return true;
	};

	return (
		<div
			id="timeline-container"
			className="bg-[#141619] relative h-full w-full flex flex-col select-none overflow-hidden"
		>
			<Header />
			<div className="relative flex-1 w-full overflow-hidden bg-[#101214]">
				<ReactTimelineEditor
					ref={timelineRef}
					editorData={editorData}
					effects={effects}
					scale={1}
					scaleWidth={scaleWidth}
					scaleSplitCount={10}
					startLeft={20}
					rowHeight={48}
					gridSnap={true}
					dragLine={true}
					hideCursor={false}
					autoScroll={true}
					enableRowDrag={true}
					onRowDragEnd={handleRowDragEnd}
					getActionRender={getActionRender}
					onActionMoveEnd={handleActionMoveEnd}
					onActionResizeEnd={handleActionResizeEnd}
					onClickAction={handleClickAction}
					onContextMenuAction={handleContextMenuAction}
					onCursorDrag={handleCursorDrag}
					onClickTimeArea={handleClickTimeArea}
					style={{
						width: "100%",
						height: "100%",
						backgroundColor: "#101214",
					}}
				/>
			</div>

			{/* Context Menu on Right Click */}
			{contextMenu && (
				<div
					className="fixed z-50 min-w-[210px] bg-[#1a1d21]/95 border border-white/15 rounded-lg shadow-2xl py-1.5 text-xs text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
					style={{
						top: Math.min(contextMenu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 260),
						left: Math.min(contextMenu.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 230),
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="px-3 py-1 text-[11px] font-semibold text-gray-400 border-b border-white/10 mb-1">
						Tùy chọn Clip
					</div>
					<button
						type="button"
						onClick={() => {
							dispatch(MOVE_ITEM_TRACK, {
								payload: { itemId: contextMenu.actionId, direction: "up" },
							});
							setContextMenu(null);
						}}
						className="w-full flex items-center px-3 py-1.5 hover:bg-primary/20 hover:text-primary transition-colors text-left gap-2 cursor-pointer"
					>
						<ArrowUp className="w-3.5 h-3.5" />
						<span>Chuyển lên track trên</span>
						<span className="ml-auto text-[10px] text-gray-500 font-mono">Alt+↑</span>
					</button>
					<button
						type="button"
						onClick={() => {
							dispatch(MOVE_ITEM_TRACK, {
								payload: { itemId: contextMenu.actionId, direction: "down" },
							});
							setContextMenu(null);
						}}
						className="w-full flex items-center px-3 py-1.5 hover:bg-primary/20 hover:text-primary transition-colors text-left gap-2 cursor-pointer"
					>
						<ArrowDown className="w-3.5 h-3.5" />
						<span>Chuyển xuống track dưới</span>
						<span className="ml-auto text-[10px] text-gray-500 font-mono">Alt+↓</span>
					</button>
					<button
						type="button"
						onClick={() => {
							dispatch(MOVE_ITEM_TRACK, {
								payload: { itemId: contextMenu.actionId, direction: "new" },
							});
							setContextMenu(null);
						}}
						className="w-full flex items-center px-3 py-1.5 hover:bg-primary/20 hover:text-primary transition-colors text-left gap-2 cursor-pointer"
					>
						<Plus className="w-3.5 h-3.5" />
						<span>Tách sang track riêng</span>
					</button>
					<div className="h-[1px] bg-white/10 my-1" />
					<button
						type="button"
						onClick={() => {
							dispatch(ACTIVE_SPLIT, {
								payload: {
									id: contextMenu.actionId,
									splitTime: (currentFrame / fps) * 1000,
								},
							});
							setContextMenu(null);
						}}
						className="w-full flex items-center px-3 py-1.5 hover:bg-white/10 transition-colors text-left gap-2 cursor-pointer"
					>
						<Scissors className="w-3.5 h-3.5" />
						<span>Cắt tại vị trí phát</span>
					</button>
					<button
						type="button"
						onClick={() => {
							dispatch(ACTIVE_CLONE, { payload: { id: contextMenu.actionId } });
							setContextMenu(null);
						}}
						className="w-full flex items-center px-3 py-1.5 hover:bg-white/10 transition-colors text-left gap-2 cursor-pointer"
					>
						<Copy className="w-3.5 h-3.5" />
						<span>Nhân bản clip</span>
					</button>
					<div className="h-[1px] bg-white/10 my-1" />
					<button
						type="button"
						onClick={() => {
							dispatch(ACTIVE_DELETE, { payload: { id: contextMenu.actionId } });
							setContextMenu(null);
						}}
						className="w-full flex items-center px-3 py-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-left gap-2 cursor-pointer"
					>
						<Trash2 className="w-3.5 h-3.5" />
						<span>Xóa clip</span>
						<span className="ml-auto text-[10px] text-gray-500 font-mono">Del</span>
					</button>
				</div>
			)}
		</div>
	);
};

export default Timeline;
