/**
 * Remotion Root - Entry point for SSR-local rendering
 * 
 * This file defines the Remotion composition for server-side rendering.
 * It uses SSRComposition which shares the same rendering logic as Player
 * via composition-core.tsx.
 * 
 * Any rendering updates to Player will automatically apply here!
 */

import React from "react";
import { Composition } from "remotion";
import { SSRComposition } from "../features/editor/player/ssr-composition";
import type { IDesign, ITrackItem } from "@designcombo/types";

// Default empty design for type safety
const defaultDesign: IDesign = {
    id: "default",
    size: { width: 1920, height: 1080 },
    fps: 30,
    trackItemIds: [],
    trackItemsMap: {},
    tracks: [],
    transitionIds: [],
    transitionsMap: {},
    duration: 5000,
};

/**
 * Calculate the actual duration of the design based on track items
 */
const calculateDesignDuration = (design: IDesign): number => {
    const trackItems = Object.values(design.trackItemsMap || {}) as ITrackItem[];

    if (trackItems.length === 0) {
        return design.duration || 5000;
    }

    // Find the maximum end time (display.to) across all items
    const maxEndTime = Math.max(
        ...trackItems.map(item => item.display?.to || 0)
    );

    return maxEndTime || design.duration || 5000;
};

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="VEditor"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                component={SSRComposition as React.ComponentType<any>}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{
                    design: defaultDesign,
                }}
                calculateMetadata={async ({ props }) => {
                    const design = (props as { design: IDesign }).design;
                    const fps = design.fps || 30;

                    // Calculate actual duration from track items
                    const durationMs = calculateDesignDuration(design);
                    const durationInFrames = Math.max(1, Math.ceil((durationMs / 1000) * fps));

                    console.log('[Remotion] Calculated metadata:', {
                        durationMs,
                        durationInFrames,
                        fps,
                        width: design.size?.width || 1920,
                        height: design.size?.height || 1080,
                        trackItems: Object.keys(design.trackItemsMap || {}).length
                    });

                    return {
                        durationInFrames,
                        fps,
                        width: design.size?.width || 1920,
                        height: design.size?.height || 1080,
                    };
                }}
            />
        </>
    );
};
