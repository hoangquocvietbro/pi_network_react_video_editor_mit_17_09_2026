// MIT License - Clean-room StateManager
import { BehaviorSubject, Subscription } from "rxjs";
import { cloneDeep, isEqual } from "lodash";
import { nanoid } from "nanoid";
import {
	IDesign,
	IKindHistory,
	ISize,
	IStateManager,
	ITimelineScaleState,
	ITrack,
	ITrackItem,
	ITransition,
	IUpdateStateOptions,
	ItemStructure,
	State,
} from "@/types/editor";
import {
	ACTIVE_CLONE,
	ACTIVE_DELETE,
	ACTIVE_SET,
	ACTIVE_SPLIT,
	ADD_AUDIO,
	ADD_CAPTIONS,
	ADD_HILL_AUDIO_BARS,
	ADD_IMAGE,
	ADD_ITEMS,
	ADD_LINEAL_AUDIO_BARS,
	ADD_RADIAL_AUDIO_BARS,
	ADD_RECT,
	ADD_TEXT,
	ADD_VIDEO,
	ADD_WAVE_AUDIO_BARS,
	DESIGN_LOAD,
	DESIGN_RESIZE,
	EDIT_OBJECT,
	HISTORY_REDO,
	HISTORY_UNDO,
	LAYER_CLONE,
	LAYER_DELETE,
	LAYER_SELECT,
	LAYER_SELECTION,
	MOVE_ITEM_TRACK,
	REORDER_TRACKS,
	REPLACE_MEDIA,
	TIMELINE_SCALE_CHANGED,
	subject,
} from "./events";

export interface StateManagerConfig {
	size?: ISize;
	fps?: number;
	scale?: ITimelineScaleState;
	acceptsMap?: Record<string, string[]>;
	cors?: {
		audio?: boolean;
		video?: boolean;
		image?: boolean;
	};
}

export interface StateHistory {
	handleUndo: boolean;
	handleRedo: boolean;
}

const DEFAULT_STATE: State = {
	size: {
		width: 1080,
		height: 1920,
	},
	fps: 30,
	tracks: [],
	trackItemIds: [],
	trackItemsMap: {},
	transitionIds: [],
	transitionsMap: {},
	scale: {
		index: 7,
		unit: 300,
		zoom: 1 / 300,
		segments: 5,
	},
	duration: 0,
	activeIds: [],
	structure: [],
	background: {
		type: "color",
		value: "transparent",
	},
};

export class StateManager implements IStateManager {
	private stateSubject: BehaviorSubject<State>;
	private stateHistorySubject: BehaviorSubject<StateHistory>;
	private prevState: State;
	public background: State["background"];
	public undos: State[] = [];
	public redos: State[] = [];
	private listener?: Subscription;

	constructor(initialState?: Partial<State>, config?: StateManagerConfig) {
		const merged: State = {
			...DEFAULT_STATE,
			...initialState,
			...(config?.size ? { size: config.size } : {}),
			...(config?.fps ? { fps: config.fps } : {}),
			...(config?.scale ? { scale: config.scale } : {}),
		};

		this.prevState = cloneDeep(merged);
		this.background = merged.background;
		this.stateSubject = new BehaviorSubject<State>(merged);
		this.stateHistorySubject = new BehaviorSubject<StateHistory>({
			handleUndo: false,
			handleRedo: false,
		});

		this.initListeners();
	}

	public initListeners(): void {
		this.destroyListeners();

		this.listener = subject.subscribe(({ key, value }) => {
			const payload = value?.payload;
			const options = value?.options;

			switch (key) {
				case ADD_VIDEO:
				case ADD_AUDIO:
				case ADD_IMAGE:
				case ADD_TEXT:
				case ADD_CAPTIONS:
				case ADD_RECT:
				case ADD_LINEAL_AUDIO_BARS:
				case ADD_RADIAL_AUDIO_BARS:
				case ADD_WAVE_AUDIO_BARS:
				case ADD_HILL_AUDIO_BARS: {
					this.handleAddItem(key, payload, options);
					break;
				}
				case ADD_ITEMS: {
					this.handleAddItems(payload);
					break;
				}
				case EDIT_OBJECT: {
					this.handleEditObject(payload);
					break;
				}
				case REPLACE_MEDIA: {
					this.handleReplaceMedia(payload);
					break;
				}
				case LAYER_DELETE:
				case ACTIVE_DELETE: {
					this.handleDelete(payload);
					break;
				}
				case ACTIVE_SPLIT: {
					this.handleSplit(payload);
					break;
				}
				case LAYER_CLONE:
				case ACTIVE_CLONE: {
					this.handleClone(payload);
					break;
				}
				case LAYER_SELECT:
				case LAYER_SELECTION:
				case ACTIVE_SET: {
					this.handleSelect(payload);
					break;
				}
				case DESIGN_LOAD: {
					this.handleDesignLoad(payload);
					break;
				}
				case DESIGN_RESIZE: {
					if (payload?.size) {
						this.updateState({ size: payload.size }, { updateHistory: true });
					}
					break;
				}
				case TIMELINE_SCALE_CHANGED: {
					if (payload?.scale) {
						this.updateState({ scale: payload.scale });
					}
					break;
				}
				case HISTORY_UNDO: {
					this.undo();
					break;
				}
				case HISTORY_REDO: {
					this.redo();
					break;
				}
				case MOVE_ITEM_TRACK: {
					this.handleMoveItemTrack(payload);
					break;
				}
				case REORDER_TRACKS: {
					this.handleReorderTracks(payload);
					break;
				}
			}
		});
	}

	public destroyListeners(): void {
		if (this.listener) {
			this.listener.unsubscribe();
			this.listener = undefined;
		}
	}

	public purge(): void {
		this.destroyListeners();
	}

	public getState(): State {
		return this.stateSubject.getValue();
	}

	public subscribe(callback: (state: State) => void): Subscription {
		return this.stateSubject.subscribe(callback);
	}

	public getStateHistory(): StateHistory {
		return this.stateHistorySubject.getValue();
	}

	public subscribeHistory(callback: (history: StateHistory) => void): Subscription {
		return this.stateHistorySubject.subscribe(callback);
	}

	public updateState(
		partialState: Partial<State>,
		options: IUpdateStateOptions = { updateHistory: false },
	): void {
		const currentState = this.getState();
		const nextState: State = {
			...currentState,
			...partialState,
		};

		if (isEqual(currentState, nextState)) {
			return;
		}

		if (options.updateHistory) {
			this.pushHistory(currentState);
		}

		this.prevState = currentState;
		this.background = nextState.background;
		this.stateSubject.next(nextState);
	}

	private pushHistory(state: State): void {
		this.undos.push(cloneDeep(state));
		if (this.undos.length > 50) {
			this.undos.shift();
		}
		this.redos = [];
		this.updateHistoryStatus();
	}

	private updateHistoryStatus(): void {
		this.stateHistorySubject.next({
			handleUndo: this.undos.length > 0,
			handleRedo: this.redos.length > 0,
		});
	}

	public undo(): void {
		if (this.undos.length === 0) return;
		const currentState = this.getState();
		const previousState = this.undos.pop()!;
		this.redos.push(cloneDeep(currentState));
		this.updateHistoryStatus();

		this.prevState = currentState;
		this.background = previousState.background;
		this.stateSubject.next(previousState);
	}

	public redo(): void {
		if (this.redos.length === 0) return;
		const currentState = this.getState();
		const nextState = this.redos.pop()!;
		this.undos.push(cloneDeep(currentState));
		this.updateHistoryStatus();

		this.prevState = currentState;
		this.background = nextState.background;
		this.stateSubject.next(nextState);
	}

	private calculateDuration(trackItemsMap: Record<string, ITrackItem>): number {
		const items = Object.values(trackItemsMap);
		if (items.length === 0) return 0;
		return items.reduce((max, item) => Math.max(max, item.display?.to || 0), 0);
	}

	private handleAddItem(
		eventKey: string,
		payload: any,
		options?: any,
	): void {
		if (!payload) return;

		let type = "video";
		if (eventKey === ADD_AUDIO) type = "audio";
		else if (eventKey === ADD_IMAGE) type = "image";
		else if (eventKey === ADD_TEXT) type = "text";
		else if (eventKey === ADD_CAPTIONS) type = "caption";

		const id = payload.id || nanoid(10);
		const currentState = this.getState();

		const defaultDuration =
			payload.duration ||
			(payload.display?.to && payload.display?.from
				? payload.display.to - payload.display.from
				: 5000);

		// Determine insertion time
		const from = payload.display?.from ?? 0;
		const to = payload.display?.to ?? from + defaultDuration;

		const newItem: ITrackItem = {
			name: payload.name || `${type}_${id.slice(0, 4)}`,
			type: (payload.type || type) as any,
			display: { from, to },
			trim: payload.trim || { from: 0, to: to - from },
			details: {
				opacity: 100,
				...(payload.details || {}),
			},
			preview: payload.preview || payload.metadata?.previewUrl || "",
			...payload,
			id,
		} as ITrackItem;

		const newTracks = cloneDeep(currentState.tracks);
		const targetTrackId = options?.targetTrackId;

		let assignedTrack: ITrack | undefined = targetTrackId
			? newTracks.find((t) => t.id === targetTrackId)
			: undefined;

		if (!assignedTrack) {
			// Find a track without overlapping items or create a new track
			assignedTrack = newTracks.find((track) => {
				return !track.items.some((itemId) => {
					const existing = currentState.trackItemsMap[itemId];
					if (!existing) return false;
					return Math.max(from, existing.display.from) < Math.min(to, existing.display.to);
				});
			});
		}

		if (!assignedTrack) {
			const createdTrack: ITrack = {
				id: nanoid(10),
				items: [],
				type: type as any,
				muted: false,
			};
			newTracks.push(createdTrack);
			assignedTrack = createdTrack;
		}

		assignedTrack.items.push(id);

		const newTrackItemsMap = {
			...currentState.trackItemsMap,
			[id]: newItem,
		};

		const newTrackItemIds = [...currentState.trackItemIds, id];
		const duration = Math.max(currentState.duration, to);

		this.updateState(
			{
				tracks: newTracks,
				trackItemsMap: newTrackItemsMap,
				trackItemIds: newTrackItemIds,
				duration,
				activeIds: [id],
			},
			{ updateHistory: true },
		);
	}

	private handleAddItems(payload: { trackItems?: ITrackItem[] }): void {
		if (!payload?.trackItems || payload.trackItems.length === 0) return;
		const currentState = this.getState();
		const newTracks = cloneDeep(currentState.tracks);
		const newTrackItemsMap = { ...currentState.trackItemsMap };
		const newTrackItemIds = [...currentState.trackItemIds];
		const newActiveIds: string[] = [];

		let maxTo = currentState.duration;

		for (const rawItem of payload.trackItems) {
			const id = rawItem.id || nanoid(10);
			const item: ITrackItem = {
				...rawItem,
				id,
				name: rawItem.name || `${rawItem.type}_${id.slice(0, 4)}`,
			};

			newTrackItemsMap[id] = item;
			newTrackItemIds.push(id);
			newActiveIds.push(id);
			maxTo = Math.max(maxTo, item.display.to);

			// Add to an appropriate track
			let track = newTracks.find((t) => {
				return !t.items.some((existingId) => {
					const existing = newTrackItemsMap[existingId];
					if (!existing) return false;
					return (
						Math.max(item.display.from, existing.display.from) <
						Math.min(item.display.to, existing.display.to)
					);
				});
			});

			if (!track) {
				const createdTrack: ITrack = {
					id: nanoid(10),
					items: [],
					type: (item.type as any) || "video",
					muted: false,
				};
				newTracks.push(createdTrack);
				track = createdTrack;
			}
			track.items.push(id);
		}

		this.updateState(
			{
				tracks: newTracks,
				trackItemsMap: newTrackItemsMap,
				trackItemIds: newTrackItemIds,
				duration: maxTo,
				activeIds: newActiveIds,
			},
			{ updateHistory: true },
		);
	}

	private handleEditObject(payload: Record<string, Partial<ITrackItem>>): void {
		if (!payload) return;
		const currentState = this.getState();
		const newTrackItemsMap = cloneDeep(currentState.trackItemsMap);
		let hasChanges = false;

		for (const [id, updates] of Object.entries(payload)) {
			if (!newTrackItemsMap[id]) continue;
			newTrackItemsMap[id] = {
				...newTrackItemsMap[id],
				...updates,
				details: {
					...newTrackItemsMap[id].details,
					...(updates.details || {}),
				},
				display: {
					...newTrackItemsMap[id].display,
					...(updates.display || {}),
				},
			} as ITrackItem;
			hasChanges = true;
		}

		if (hasChanges) {
			const duration = this.calculateDuration(newTrackItemsMap);
			this.updateState(
				{
					trackItemsMap: newTrackItemsMap,
					duration,
				},
				{ updateHistory: true },
			);
		}
	}

	private handleReplaceMedia(payload: Record<string, { details?: { src?: string } }>): void {
		if (!payload) return;
		const currentState = this.getState();
		const newTrackItemsMap = cloneDeep(currentState.trackItemsMap);
		let hasChanges = false;

		for (const [id, update] of Object.entries(payload)) {
			if (newTrackItemsMap[id] && update.details?.src) {
				newTrackItemsMap[id].details.src = update.details.src;
				hasChanges = true;
			}
		}

		if (hasChanges) {
			this.updateState({ trackItemsMap: newTrackItemsMap }, { updateHistory: true });
		}
	}

	private handleDelete(payload?: { id?: string }): void {
		const currentState = this.getState();
		const idsToDelete = payload?.id
			? [payload.id]
			: currentState.activeIds.length > 0
				? currentState.activeIds
				: [];

		if (idsToDelete.length === 0) return;

		const deleteSet = new Set(idsToDelete);
		const newTrackItemsMap = { ...currentState.trackItemsMap };
		for (const id of idsToDelete) {
			delete newTrackItemsMap[id];
		}

		const newTrackItemIds = currentState.trackItemIds.filter((id) => !deleteSet.has(id));
		const newTracks = currentState.tracks
			.map((track) => ({
				...track,
				items: track.items.filter((id) => !deleteSet.has(id)),
			}))
			.filter((track) => track.items.length > 0);

		const duration = this.calculateDuration(newTrackItemsMap);

		this.updateState(
			{
				tracks: newTracks,
				trackItemsMap: newTrackItemsMap,
				trackItemIds: newTrackItemIds,
				duration,
				activeIds: [],
			},
			{ updateHistory: true },
		);
	}

	private handleSplit(payload?: { id?: string; splitTime?: number }): void {
		const currentState = this.getState();
		const targetId = payload?.id || currentState.activeIds[0];
		if (!targetId || !currentState.trackItemsMap[targetId]) return;

		const original = currentState.trackItemsMap[targetId];
		const splitTime = payload?.splitTime ?? (original.display.from + (original.display.to - original.display.from) / 2);

		if (splitTime <= original.display.from || splitTime >= original.display.to) {
			return;
		}

		const item1Duration = splitTime - original.display.from;
		const item2Duration = original.display.to - splitTime;

		const item1: ITrackItem = {
			...cloneDeep(original),
			display: { from: original.display.from, to: splitTime },
			trim: { from: original.trim?.from || 0, to: (original.trim?.from || 0) + item1Duration },
		};

		const item2Id = nanoid(10);
		const item2: ITrackItem = {
			...cloneDeep(original),
			id: item2Id,
			display: { from: splitTime, to: original.display.to },
			trim: {
				from: (original.trim?.from || 0) + item1Duration,
				to: (original.trim?.from || 0) + item1Duration + item2Duration,
			},
		};

		const newTrackItemsMap = {
			...currentState.trackItemsMap,
			[targetId]: item1,
			[item2Id]: item2,
		};

		const newTrackItemIds = [...currentState.trackItemIds, item2Id];
		const newTracks = currentState.tracks.map((track) => {
			const index = track.items.indexOf(targetId);
			if (index !== -1) {
				const nextItems = [...track.items];
				nextItems.splice(index + 1, 0, item2Id);
				return { ...track, items: nextItems };
			}
			return track;
		});

		this.updateState(
			{
				tracks: newTracks,
				trackItemsMap: newTrackItemsMap,
				trackItemIds: newTrackItemIds,
				activeIds: [item2Id],
			},
			{ updateHistory: true },
		);
	}

	private handleClone(payload?: { id?: string }): void {
		const currentState = this.getState();
		const targetId = payload?.id || currentState.activeIds[0];
		if (!targetId || !currentState.trackItemsMap[targetId]) return;

		const original = currentState.trackItemsMap[targetId];
		const newId = nanoid(10);
		const duration = original.display.to - original.display.from;
		const from = original.display.to;
		const to = from + duration;

		const cloned: ITrackItem = {
			...cloneDeep(original),
			id: newId,
			name: `${original.name}_copy`,
			display: { from, to },
		};

		const newTrackItemsMap = {
			...currentState.trackItemsMap,
			[newId]: cloned,
		};

		const newTrackItemIds = [...currentState.trackItemIds, newId];
		const newTracks = cloneDeep(currentState.tracks);

		const track = newTracks.find((t) => t.items.includes(targetId));
		if (track) {
			track.items.push(newId);
		} else {
			newTracks.push({ id: nanoid(10), items: [newId], type: (original.type as any) || "video", muted: false });
		}

		this.updateState(
			{
				tracks: newTracks,
				trackItemsMap: newTrackItemsMap,
				trackItemIds: newTrackItemIds,
				duration: Math.max(currentState.duration, to),
				activeIds: [newId],
			},
			{ updateHistory: true },
		);
	}

	private handleSelect(payload?: { id?: string; activeIds?: string[] }): void {
		let nextActive: string[] = [];
		if (payload?.activeIds) {
			nextActive = payload.activeIds;
		} else if (payload?.id) {
			nextActive = [payload.id];
		}
		this.updateState({ activeIds: nextActive });
	}

	private handleMoveItemTrack(payload?: {
		itemId?: string;
		direction?: "up" | "down" | "new";
	}): void {
		if (!payload) return;
		const currentState = this.getState();
		const itemId = payload.itemId || currentState.activeIds[0];
		if (!itemId || !currentState.trackItemsMap[itemId]) return;

		const item = currentState.trackItemsMap[itemId];
		const tracks = cloneDeep(currentState.tracks);
		const currentTrackIndex = tracks.findIndex((t) => t.items.includes(itemId));
		if (currentTrackIndex === -1) return;

		const currentTrack = tracks[currentTrackIndex];

		const canFitInTrack = (track: ITrack) => {
			return !track.items.some((existingId) => {
				if (existingId === itemId) return false;
				const existing = currentState.trackItemsMap[existingId];
				if (!existing) return false;
				return (
					Math.max(item.display.from, existing.display.from) <
					Math.min(item.display.to, existing.display.to)
				);
			});
		};

		if (payload.direction === "new") {
			currentTrack.items = currentTrack.items.filter((id) => id !== itemId);
			const newTrack: ITrack = {
				id: nanoid(10),
				items: [itemId],
				type: (item.type as any) || "video",
				muted: false,
			};
			tracks.splice(currentTrackIndex, 0, newTrack);
		} else if (payload.direction === "up") {
			currentTrack.items = currentTrack.items.filter((id) => id !== itemId);
			if (currentTrackIndex > 0) {
				const targetTrack = tracks[currentTrackIndex - 1];
				if (canFitInTrack(targetTrack)) {
					targetTrack.items.push(itemId);
				} else {
					const newTrack: ITrack = {
						id: nanoid(10),
						items: [itemId],
						type: (item.type as any) || "video",
						muted: false,
					};
					tracks.splice(currentTrackIndex, 0, newTrack);
				}
			} else {
				const newTrack: ITrack = {
					id: nanoid(10),
					items: [itemId],
					type: (item.type as any) || "video",
					muted: false,
				};
				tracks.unshift(newTrack);
			}
		} else if (payload.direction === "down") {
			currentTrack.items = currentTrack.items.filter((id) => id !== itemId);
			if (currentTrackIndex < tracks.length - 1) {
				const targetTrack = tracks[currentTrackIndex + 1];
				if (canFitInTrack(targetTrack)) {
					targetTrack.items.push(itemId);
				} else {
					const newTrack: ITrack = {
						id: nanoid(10),
						items: [itemId],
						type: (item.type as any) || "video",
						muted: false,
					};
					tracks.splice(currentTrackIndex + 1, 0, newTrack);
				}
			} else {
				const newTrack: ITrack = {
					id: nanoid(10),
					items: [itemId],
					type: (item.type as any) || "video",
					muted: false,
				};
				tracks.push(newTrack);
			}
		}

		const cleanedTracks = tracks.filter((t) => t.items.length > 0);
		if (cleanedTracks.length === 0) {
			cleanedTracks.push({
				id: nanoid(10),
				items: [],
				type: "video",
				muted: false,
			});
		}

		this.updateState(
			{
				tracks: cleanedTracks,
				activeIds: [itemId],
			},
			{ updateHistory: true },
		);
	}

	private handleReorderTracks(payload?: { trackIds?: string[] }): void {
		if (!payload?.trackIds || payload.trackIds.length === 0) return;
		const currentState = this.getState();
		const trackMap = new Map(currentState.tracks.map((t) => [t.id, t]));
		const reorderedTracks: ITrack[] = [];

		for (const id of payload.trackIds) {
			const track = trackMap.get(id);
			if (track) {
				reorderedTracks.push(track);
				trackMap.delete(id);
			}
		}
		for (const remaining of trackMap.values()) {
			reorderedTracks.push(remaining);
		}

		this.updateState({ tracks: reorderedTracks }, { updateHistory: true });
	}

	private handleDesignLoad(payload?: Partial<IDesign>): void {
		if (!payload) return;
		const tracks = payload.tracks || [];
		const trackItemsMap = payload.trackItemsMap || {};
		const trackItemIds = payload.trackItemIds || Object.keys(trackItemsMap);
		const transitionIds = payload.transitionIds || [];
		const transitionsMap = payload.transitionsMap || {};
		const duration = payload.duration ?? this.calculateDuration(trackItemsMap);
		const fps = payload.fps || 30;
		const size = payload.size || { width: 1080, height: 1920 };
		const background = payload.background || { type: "color", value: "transparent" };
		const structure = payload.structure || [];

		const nextState: State = {
			...DEFAULT_STATE,
			tracks,
			trackItemsMap,
			trackItemIds,
			transitionIds,
			transitionsMap,
			duration,
			fps,
			size,
			background,
			structure,
			activeIds: [],
		};

		this.undos = [];
		this.redos = [];
		this.updateHistoryStatus();
		this.prevState = cloneDeep(nextState);
		this.background = background;
		this.stateSubject.next(nextState);
	}

	// ==================== Subscriptions ====================

	public subscribeToUpdateStateDetails(
		callback: (stateDetails: { size: State["size"]; background: State["background"] }) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (!isEqual(state.size, this.prevState.size) || !isEqual(state.background, this.prevState.background)) {
				callback({ size: state.size, background: state.background });
			}
		});
	}

	public subscribeToScale(callback: (v: { scale: State["scale"] }) => void): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (!isEqual(state.scale, this.prevState.scale)) {
				callback({ scale: state.scale });
			}
		});
	}

	public subscribeToFps(callback: (fps: { fps: State["fps"] }) => void): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (state.fps !== this.prevState.fps) {
				callback({ fps: state.fps });
			}
		});
	}

	public subscribeToUpdateTrackItem(
		callback: (trackItemUpdate: { trackItemsMap: State["trackItemsMap"] }) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (!isEqual(state.trackItemsMap, this.prevState.trackItemsMap)) {
				callback({ trackItemsMap: state.trackItemsMap });
			}
		});
	}

	public subscribeToUpdateAnimations(
		callback: (trackItemUpdate: {
			trackItemsMap: State["trackItemsMap"];
			changedAnimationIds?: string[];
		}) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			callback({ trackItemsMap: state.trackItemsMap });
		});
	}

	public subscribeToUpdateTrackItemTiming(
		callback: (trackItemUpdate: {
			trackItemsMap: State["trackItemsMap"];
			changedTrimIds?: string[];
			changedDisplayIds?: string[];
		}) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			callback({ trackItemsMap: state.trackItemsMap });
		});
	}

	public subscribeToUpdateItemDetails(
		callback: (trackItemUpdate: { trackItemsMap: State["trackItemsMap"] }) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (!isEqual(state.trackItemsMap, this.prevState.trackItemsMap)) {
				callback({ trackItemsMap: state.trackItemsMap });
			}
		});
	}

	public subscribeToDuration(callback: (duration: { duration: State["duration"] }) => void): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (state.duration !== this.prevState.duration) {
				callback({ duration: state.duration });
			}
		});
	}

	public subscribeToHistory(
		callback: (history: {
			tracks: State["tracks"];
			trackItemsMap: State["trackItemsMap"];
			trackItemIds: State["trackItemIds"];
			transitionIds: State["transitionIds"];
			transitionsMap: State["transitionsMap"];
			type: IKindHistory;
		}) => void,
	): Subscription {
		return this.stateHistorySubject.subscribe(() => {
			const s = this.getState();
			callback({
				tracks: s.tracks,
				trackItemsMap: s.trackItemsMap,
				trackItemIds: s.trackItemIds,
				transitionIds: s.transitionIds,
				transitionsMap: s.transitionsMap,
				type: "trackItems" as any,
			});
		});
	}

	public subscribeToAddOrRemoveItems(
		callback: (trackItemIds: { trackItemIds: State["trackItemIds"] }) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (!isEqual(state.trackItemIds, this.prevState.trackItemIds)) {
				callback({ trackItemIds: state.trackItemIds });
			}
		});
	}

	public subscribeToActiveIds(callback: (activeIds: { activeIds: State["activeIds"] }) => void): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (!isEqual(state.activeIds, this.prevState.activeIds)) {
				callback({ activeIds: state.activeIds });
			}
		});
	}

	public subscribeToTracks(
		callback: (tracksUpdate: { tracks: State["tracks"]; changedTracks: string[] }) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			if (!isEqual(state.tracks, this.prevState.tracks)) {
				callback({ tracks: state.tracks, changedTracks: state.tracks.map((t) => t.id) });
			}
		});
	}

	public subscribeToUpdateTracks(
		callback: (tracksUpdate: {
			tracks: State["tracks"];
			duration: State["duration"];
			trackItemsMap: State["trackItemsMap"];
		}) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			callback({
				tracks: state.tracks,
				duration: state.duration,
				trackItemsMap: state.trackItemsMap,
			});
		});
	}

	public subscribeToState(
		callback: (tracksInfo: {
			tracks: State["tracks"];
			trackItemIds: State["trackItemIds"];
			trackItemsMap: State["trackItemsMap"];
			transitionIds: State["transitionIds"];
			transitionsMap: State["transitionsMap"];
			structure: State["structure"];
		}) => void,
	): Subscription {
		return this.stateSubject.subscribe((state) => {
			callback({
				tracks: state.tracks,
				trackItemIds: state.trackItemIds,
				trackItemsMap: state.trackItemsMap,
				transitionIds: state.transitionIds,
				transitionsMap: state.transitionsMap,
				structure: state.structure,
			});
		});
	}

	public toJSON(): {
		fps: number;
		tracks: ITrack[];
		size: ISize;
		trackItemIds: string[];
		transitionsMap: Record<string, ITransition>;
		trackItemsMap: Record<string, ITrackItem>;
		transitionIds: string[];
	} {
		const s = this.getState();
		return {
			fps: s.fps,
			tracks: s.tracks,
			size: s.size,
			trackItemIds: s.trackItemIds,
			transitionsMap: s.transitionsMap,
			trackItemsMap: s.trackItemsMap,
			transitionIds: s.transitionIds,
		};
	}
}

export default StateManager;
