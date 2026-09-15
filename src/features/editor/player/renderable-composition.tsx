/**
 * RenderableComposition - Composition for Client-Side Rendering
 * 
 * This composition uses @remotion/media components which are required for CSR.
 * The standard remotion components (OffthreadVideo, Audio) are used in Player preview,
 * but CSR requires @remotion/media versions.
 * 
 * Key difference from editor Composition:
 * - Uses Video/Audio from @remotion/media (CSR compatible)
 * - Gets design data from props instead of store
 * - No editing features
 */

import { AbsoluteFill, useCurrentFrame, Sequence, useVideoConfig } from "remotion";
import { Video as CSRVideo, Audio as CSRAudio } from "@remotion/media";
import type { IDesign, ITrackItem, IVideo, IAudio, IImage, IText } from "@designcombo/types";
import { Img } from "remotion";

interface RenderableCompositionProps {
    design: IDesign;
}

// CSR-compatible Video component
const CSRVideoItem = ({ item, fps }: { item: IVideo; fps: number }) => {
    const { details } = item;
    const playbackRate = item.playbackRate || 1;

    return (
        <div
            style={{
                position: 'absolute',
                left: details.left,
                top: details.top,
                width: details.width,
                height: details.height,
                transform: `rotate(${details.rotate || 0}deg)`,
                opacity: details.opacity ?? 1,
            }}
        >
            <CSRVideo
                src={details.src}
                playbackRate={playbackRate}
                volume={(details.volume ?? 100) / 100}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        </div>
    );
};

// CSR-compatible Audio component
const CSRAudioItem = ({ item, fps }: { item: IAudio; fps: number }) => {
    const { details } = item;
    const playbackRate = item.playbackRate || 1;

    return (
        <CSRAudio
            src={details.src}
            playbackRate={playbackRate}
            volume={(details.volume ?? 100) / 100}
        />
    );
};

// CSR-compatible Image component
const CSRImageItem = ({ item }: { item: IImage }) => {
    const { details } = item;

    return (
        <div
            style={{
                position: 'absolute',
                left: details.left,
                top: details.top,
                width: details.width,
                height: details.height,
                transform: `rotate(${details.rotate || 0}deg)`,
                opacity: details.opacity ?? 1,
            }}
        >
            <Img src={details.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
    );
};

// CSR-compatible Text component
const CSRTextItem = ({ item }: { item: IText }) => {
    const { details } = item;

    return (
        <div
            style={{
                position: 'absolute',
                left: details.left,
                top: details.top,
                width: details.width,
                height: details.height,
                opacity: details.opacity ?? 1,
                fontFamily: details.fontFamily,
                fontSize: details.fontSize,
                fontWeight: details.fontWeight,
                color: details.color,
                textAlign: details.textAlign as React.CSSProperties['textAlign'],
                lineHeight: details.lineHeight,
                letterSpacing: details.letterSpacing,
            }}
            dangerouslySetInnerHTML={{ __html: details.text || '' }}
        />
    );
};

/**
 * Render a single track item based on its type
 */
const renderItem = (item: ITrackItem, fps: number) => {
    switch (item.type) {
        case 'video':
            return <CSRVideoItem key={item.id} item={item as IVideo} fps={fps} />;
        case 'audio':
            return <CSRAudioItem key={item.id} item={item as IAudio} fps={fps} />;
        case 'image':
            return <CSRImageItem key={item.id} item={item as IImage} />;
        case 'text':
            return <CSRTextItem key={item.id} item={item as IText} />;
        default:
            return null;
    }
};

/**
 * RenderableComposition for CSR (renderMediaOnWeb)
 */
export const RenderableComposition: React.FC<RenderableCompositionProps> = ({ design }) => {
    const { width: renderWidth, height: renderHeight } = useVideoConfig(); // Output resolution
    const fps = 30;

    const trackItemIds = design.trackItemIds || [];
    const trackItemsMap = design.trackItemsMap || {};

    // Calculate scale factor matches the output resolution
    const designWidth = design.size.width;
    const designHeight = design.size.height;

    // Determine scale based on width ratio (assuming aspect ratio is maintained)
    const scale = renderWidth / designWidth;

    return (
        <AbsoluteFill style={{ backgroundColor: design.background?.value || '#000000' }}>
            <div
                style={{
                    width: designWidth,
                    height: designHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            >
                {trackItemIds.map((id) => {
                    const item = trackItemsMap[id] as ITrackItem;
                    if (!item) return null;

                    const startFrame = Math.round((item.display.from / 1000) * fps);
                    const durationFrames = Math.round(((item.display.to - item.display.from) / 1000) * fps);

                    return (
                        <Sequence key={item.id} from={startFrame} durationInFrames={durationFrames}>
                            {renderItem(item, fps)}
                        </Sequence>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

export default RenderableComposition;
