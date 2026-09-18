/**
 * CompositionContent - Shared Rendering Logic for Player and SSR
 * 
 * This component contains ALL rendering logic (items, transitions, etc.)
 * Both Player (composition.tsx) and SSR-local (ssr-composition.tsx) use this.
 * 
 * ⚠️ ANY CHANGES HERE will automatically apply to both Player AND SSR!
 * 
 * For editing features (handleTextChange, onTextBlur, etc.), 
 * pass them as optional props - SSR won't use them.
 */

import React from "react";
import { ISize, ITrackItem, ITrackItemsMap, ITransition } from "@/types/editor";
import { TransitionSeries, Transitions } from "../../../modules/transitions/index.es.js";
import { groupTrackItems } from "../utils/track-items";
import { SequenceItem } from "./sequence-item";
import { SequenceItemOptions } from "./base-sequence";

export interface CompositionContentProps {
    // Essential data for rendering
    trackItemIds: string[];
    trackItemsMap: ITrackItemsMap;
    transitionsMap: Record<string, ITransition>;
    fps: number;
    size: ISize;

    // Optional editing features (only used by Player, not SSR)
    handleTextChange?: (id: string, text: string) => void;
    onTextBlur?: (id: string, text: string) => void;
    editableTextId?: string | null;
    frame?: number;
}

/**
 * Shared composition content that renders all items and transitions.
 * Used by both Player (with editing) and SSR (render only).
 */
export const CompositionContent: React.FC<CompositionContentProps> = ({
    trackItemIds,
    trackItemsMap,
    transitionsMap,
    fps,
    size,
    handleTextChange,
    onTextBlur,
    editableTextId,
    frame = 0
}) => {
    // Group items with their transitions
    const groupedItems = groupTrackItems({
        trackItemIds,
        transitionsMap,
        trackItemsMap
    });

    return (
        <>
            {groupedItems.map((group, index) => {
                // Single item without transition
                if (group.length === 1) {
                    const item = trackItemsMap[group[0].id];
                    if (!item) return null;

                    const itemType = item.type as keyof typeof SequenceItem;
                    if (!SequenceItem[itemType]) return null;

                    return SequenceItem[itemType](item as ITrackItem, {
                        fps,
                        handleTextChange,
                        onTextBlur,
                        editableTextId,
                        frame,
                        size,
                        isTransition: false
                    } as SequenceItemOptions);
                }

                // Group with transitions
                const firstItem = trackItemsMap[group[0].id];
                if (!firstItem) return null;

                const from = (firstItem.display.from / 1000) * fps;

                return (
                    <TransitionSeries name={`transition-series-${index}`} from={from} key={index} layout="absolute-fill">
                        {group.map((groupItem) => {
                            // Render transition effect
                            if (groupItem.type === "transition") {
                                const transition = groupItem as ITransition;
                                const durationInFrames = (transition.duration / 1000) * fps;

                                const transitionKind = transition.kind as keyof typeof Transitions;
                                if (!Transitions[transitionKind]) return null;

                                return Transitions[transitionKind]({
                                    durationInFrames,
                                    ...size,
                                    id: transition.id,
                                    direction: transition.direction
                                });
                            }

                            // Render track item within transition series
                            const item = trackItemsMap[groupItem.id];
                            if (!item) return null;

                            const itemType = item.type as keyof typeof SequenceItem;
                            if (!SequenceItem[itemType]) return null;

                            return SequenceItem[itemType](item as ITrackItem, {
                                fps,
                                handleTextChange,
                                editableTextId,
                                isTransition: true,
                                size
                            } as SequenceItemOptions);
                        })}
                    </TransitionSeries>
                );
            })}
        </>
    );
};

export default CompositionContent;
