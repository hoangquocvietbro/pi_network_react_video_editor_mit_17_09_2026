/**
 * SSRComposition - Server-Side Rendering Composition
 * 
 * This composition is used for SSR-local (Node.js) rendering.
 * It uses the same rendering logic as Player via CompositionContent,
 * ensuring SSR output always matches the Player preview.
 * 
 * Unlike Player's composition.tsx, this receives design data from props
 * rather than the store, making it suitable for server-side rendering.
 * 
 * NO editing features are included - this is render-only.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import type { IDesign } from "@designcombo/types";
import { CompositionContent } from "./composition-core";

export interface SSRCompositionProps {
    design: IDesign;
}

/**
 * SSR Composition that wraps CompositionContent with design props.
 * Used by remotion/Root.tsx for SSR-local rendering.
 */
export const SSRComposition: React.FC<SSRCompositionProps> = ({ design }) => {
    const fps = design.fps || 30;
    const trackItemIds = design.trackItemIds || [];
    const trackItemsMap = design.trackItemsMap || {};
    const transitionsMap = design.transitionsMap || {};
    const size = design.size || { width: 1920, height: 1080 };

    // Get background color from design
    const backgroundColor =
        typeof design.background === 'object' && design.background?.value
            ? design.background.value
            : typeof design.background === 'string'
                ? design.background
                : '#000000';

    return (
        <AbsoluteFill style={{ backgroundColor }}>
            <CompositionContent
                trackItemIds={trackItemIds}
                trackItemsMap={trackItemsMap}
                transitionsMap={transitionsMap}
                fps={fps}
                size={size}
                // No editing features for SSR
                handleTextChange={undefined}
                onTextBlur={undefined}
                editableTextId={null}
                frame={0}
            />
        </AbsoluteFill>
    );
};

export default SSRComposition;
