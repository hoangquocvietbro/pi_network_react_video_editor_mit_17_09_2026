/**
 * useWebRender - React hook for Client-Side Video Rendering
 * 
 * Wraps @remotion/web-renderer's renderMediaOnWeb() with React state management.
 */

import { renderMediaOnWeb } from '@remotion/web-renderer';
import { useState, useCallback, useRef } from 'react';
import type { IDesign } from "@/types/editor";
import { checkCSRSupport, downloadBlob } from '../utils/web-renderer';

export interface RenderProgress {
    renderedFrames: number;
    encodedFrames: number;
    totalFrames: number;
    percentage: number;
    phase: 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error' | 'cancelled';
}

export interface RenderResult {
    success: boolean;
    blob?: Blob;
    error?: Error;
}

export interface UseWebRenderOptions {
    fps?: number;
    videoBitrate?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
    audioBitrate?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
    container?: 'mp4' | 'webm';
    videoCodec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';
}

export function useWebRender() {
    const [progress, setProgress] = useState<RenderProgress>({
        renderedFrames: 0,
        encodedFrames: 0,
        totalFrames: 0,
        percentage: 0,
        phase: 'preparing',
    });
    const [isRendering, setIsRendering] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Check if CSR is available for the given dimensions
     */
    const checkSupport = useCallback(async (width: number, height: number) => {
        return await checkCSRSupport(width, height);
    }, []);

    /**
     * Start rendering a video using CSR
     */
    const startRender = useCallback(async (
        component: React.FC<{ design: IDesign }>,
        design: IDesign,
        options?: UseWebRenderOptions,
    ): Promise<RenderResult> => {
        // Reset state
        abortControllerRef.current = new AbortController();
        setIsRendering(true);
        setError(null);

        const fps = options?.fps ?? 30;
        const duration = design.duration ?? 0;
        const totalFrames = Math.max(1, Math.round((duration / 1000) * fps));

        setProgress({
            renderedFrames: 0,
            encodedFrames: 0,
            totalFrames,
            percentage: 0,
            phase: 'preparing',
        });

        try {
            // Check browser support first
            const support = await checkCSRSupport(design.size.width, design.size.height, {
                container: options?.container,
                videoCodec: options?.videoCodec,
            });

            if (!support.canRender) {
                const errorMessage = support.issues
                    .filter(i => i.severity === 'error')
                    .map(i => i.message)
                    .join(', ');
                throw new Error(`Browser does not support CSR: ${errorMessage}`);
            }

            setProgress(prev => ({ ...prev, phase: 'rendering' }));

            const { getBlob } = await renderMediaOnWeb({
                composition: {
                    component,
                    durationInFrames: totalFrames,
                    fps,
                    width: design.size.width,
                    height: design.size.height,
                    id: 'veditor-export',
                    defaultProps: { design },
                },
                inputProps: { design },
                container: options?.container ?? 'mp4',
                videoCodec: support.resolvedVideoCodec,
                audioCodec: support.resolvedAudioCodec ?? undefined,
                videoBitrate: options?.videoBitrate ?? 'high',
                audioBitrate: options?.audioBitrate ?? 'medium',
                signal: abortControllerRef.current.signal,
                onProgress: ({ renderedFrames, encodedFrames }) => {
                    const phase = encodedFrames > 0 ? 'encoding' : 'rendering';
                    setProgress({
                        renderedFrames,
                        encodedFrames,
                        totalFrames,
                        percentage: Math.round((encodedFrames / totalFrames) * 100),
                        phase,
                    });
                },
                licenseKey: 'free-license',
            });

            setProgress(prev => ({ ...prev, phase: 'encoding', percentage: 99 }));

            const blob = await getBlob();

            setProgress(prev => ({ ...prev, phase: 'completed', percentage: 100 }));

            return { success: true, blob };
        } catch (err) {
            const isAborted = abortControllerRef.current?.signal.aborted;

            if (isAborted) {
                setProgress(prev => ({ ...prev, phase: 'cancelled' }));
                return { success: false };
            }

            const error = err as Error;
            setError(error);
            setProgress(prev => ({ ...prev, phase: 'error' }));
            return { success: false, error };
        } finally {
            setIsRendering(false);
        }
    }, []);

    /**
     * Cancel an in-progress render
     */
    const cancelRender = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsRendering(false);
        setProgress(prev => ({ ...prev, phase: 'cancelled' }));
    }, []);

    /**
     * Download a rendered video blob
     */
    const downloadVideo = useCallback((blob: Blob, filename?: string) => {
        const name = filename ?? `veditor-export-${Date.now()}.mp4`;
        downloadBlob(blob, name);
    }, []);

    /**
     * Reset the hook state
     */
    const reset = useCallback(() => {
        setProgress({
            renderedFrames: 0,
            encodedFrames: 0,
            totalFrames: 0,
            percentage: 0,
            phase: 'preparing',
        });
        setError(null);
        setIsRendering(false);
    }, []);

    return {
        // State
        progress,
        isRendering,
        error,

        // Actions
        startRender,
        cancelRender,
        downloadVideo,
        checkSupport,
        reset,
    };
}

export default useWebRender;
