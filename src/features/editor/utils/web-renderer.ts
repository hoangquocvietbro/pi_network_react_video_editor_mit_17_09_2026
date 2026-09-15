/**
 * Web Renderer Utilities for Client-Side Rendering
 * 
 * This module provides utilities for checking browser compatibility
 * and rendering videos directly in the browser using @remotion/web-renderer.
 */

import {
  canRenderMediaOnWeb,
  getEncodableVideoCodecs,
  getEncodableAudioCodecs,
  type CanRenderIssue,
  type WebRendererVideoCodec,
  type WebRendererAudioCodec,
} from '@remotion/web-renderer';

// Types
export interface CSRSupportResult {
  canRender: boolean;
  issues: CanRenderIssue[];
  resolvedVideoCodec: WebRendererVideoCodec;
  resolvedAudioCodec: WebRendererAudioCodec | null;
  resolvedOutputTarget: 'web-fs' | 'arraybuffer';
}

export interface AvailableCodecs {
  videoCodecs: WebRendererVideoCodec[];
  audioCodecs: WebRendererAudioCodec[];
}

export type RenderMode = 'csr' | 'ssr' | 'ssr-local';

export interface RenderOptions {
  mode: RenderMode;
  container?: 'mp4' | 'webm';
  videoCodec?: WebRendererVideoCodec;
  audioCodec?: WebRendererAudioCodec;
  videoBitrate?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  audioBitrate?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
}

/**
 * Check if the current browser supports Client-Side Rendering
 */
export async function checkCSRSupport(
  width: number,
  height: number,
  options?: {
    container?: 'mp4' | 'webm';
    videoCodec?: WebRendererVideoCodec;
    audioCodec?: WebRendererAudioCodec;
  }
): Promise<CSRSupportResult> {
  try {
    const result = await canRenderMediaOnWeb({
      container: options?.container ?? 'mp4',
      videoCodec: options?.videoCodec ?? 'h264',
      audioCodec: options?.audioCodec,
      width,
      height,
    });

    return {
      canRender: result.canRender,
      issues: result.issues,
      resolvedVideoCodec: result.resolvedVideoCodec as WebRendererVideoCodec,
      resolvedAudioCodec: result.resolvedAudioCodec,
      resolvedOutputTarget: result.resolvedOutputTarget,
    };
  } catch (error) {
    // WebCodecs API not available
    return {
      canRender: false,
      issues: [{
        type: 'webcodecs-unavailable',
        message: 'WebCodecs API is not available in this browser',
        severity: 'error',
      }],
      resolvedVideoCodec: 'h264',
      resolvedAudioCodec: null,
      resolvedOutputTarget: 'arraybuffer',
    };
  }
}

/**
 * Get available video and audio codecs for the current browser
 */
export async function getAvailableCodecs(
  container: 'mp4' | 'webm' = 'mp4'
): Promise<AvailableCodecs> {
  try {
    const [videoCodecs, audioCodecs] = await Promise.all([
      getEncodableVideoCodecs(container),
      getEncodableAudioCodecs(container),
    ]);

    return { videoCodecs, audioCodecs };
  } catch (error) {
    // Fallback for browsers without WebCodecs
    return {
      videoCodecs: [],
      audioCodecs: [],
    };
  }
}

/**
 * Format CSR error messages for user display
 */
export function formatCSRErrors(issues: CanRenderIssue[]): string[] {
  return issues
    .filter(issue => issue.severity === 'error')
    .map(issue => issue.message);
}

/**
 * Format CSR warnings for user display
 */
export function formatCSRWarnings(issues: CanRenderIssue[]): string[] {
  return issues
    .filter(issue => issue.severity === 'warning')
    .map(issue => issue.message);
}

/**
 * Check if WebCodecs API is available in the browser
 */
export function isWebCodecsAvailable(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined';
}

/**
 * Get recommended render mode based on browser support
 */
export async function getRecommendedRenderMode(
  width: number,
  height: number
): Promise<RenderMode> {
  const support = await checkCSRSupport(width, height);
  return support.canRender ? 'csr' : 'ssr';
}

/**
 * Get default render options with browser-specific adjustments
 */
export async function getDefaultRenderOptions(
  width: number,
  height: number
): Promise<RenderOptions> {
  const support = await checkCSRSupport(width, height);

  return {
    mode: support.canRender ? 'csr' : 'ssr',
    container: 'mp4',
    videoCodec: support.resolvedVideoCodec,
    audioCodec: support.resolvedAudioCodec ?? undefined,
    videoBitrate: 'high',
    audioBitrate: 'medium',
  };
}

/**
 * Check if running inside Pi Browser environment
 */
export function isPiBrowserEnv(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).Pi ||
    /PiBrowser/i.test(navigator.userAgent)
  );
}

/**
 * Check if the device is a mobile or tablet device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Direct client-side download without uploading to any server (0 MB network transfer):
 * 1. Uses showSaveFilePicker (Save As folder dialog) if available
 * 2. Standard HTML5 anchor download (<a download>) with 120s delayed revoke
 */
export async function downloadDirectBlob(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; method: string }> {
  // On Desktop with File System Access API (Save As / folder picker dialog)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'MP4 Video',
            accept: { 'video/mp4': ['.mp4'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, method: 'file-picker' };
    } catch (pickerErr: any) {
      if (pickerErr?.name === 'AbortError') {
        return { success: true, method: 'user-cancelled' };
      }
      console.warn('[downloadDirectBlob] showSaveFilePicker failed, falling back to anchor:', pickerErr);
    }
  }

  // Standard HTML5 <a download>
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 120000);
    return { success: true, method: 'anchor-download' };
  } catch (err) {
    console.error('[downloadDirectBlob] Anchor download failed:', err);
    return { success: false, method: 'failed' };
  }
}

// Alias for backward compatibility
export const downloadBlob = downloadDirectBlob;

/**
 * Share video blob via social apps (Zalo, Facebook, Messenger, Files...)
 * 100% Client-side (0 MB upload transfer)
 */
export async function shareBlob(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; method: string }> {
  // Try Web Share API with File object
  if (typeof navigator !== 'undefined' && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: blob.type || 'video/mp4' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: 'Veditor Video Export',
        });
        return { success: true, method: 'web-share' };
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        return { success: true, method: 'user-cancelled' };
      }
      console.warn('[shareBlob] Web Share API failed, falling back:', shareErr);
    }
  }

  // Try Pi SDK native shareFile
  if (typeof window !== 'undefined') {
    const pi = (window as any).Pi;
    if (pi && typeof pi.shareFile === 'function' && blob.size <= 10 * 1024 * 1024) {
      try {
        await pi.shareFile({
          file: blob,
          filename: filename,
          mimeType: blob.type || 'video/mp4',
          title: filename,
        });
        return { success: true, method: 'pi-share-file' };
      } catch (piErr) {
        console.warn('[shareBlob] Pi.shareFile failed:', piErr);
      }
    }
  }

  throw new Error('Device or browser does not support native sharing.');
}

/**
 * Upload video blob to Firebase Storage and return the permanent public download URL
 */
export async function uploadBlobToCloud(blob: Blob, filename: string): Promise<string> {
  const file = new File([blob], filename, { type: blob.type || 'video/mp4' });
  const { uploadSingleFileToFirebase } = await import('@/utils/firebase-upload');
  return await uploadSingleFileToFirebase(file);
}

/**
 * Open URL in native system browser (Google Chrome / Safari) via Pi SDK
 */
export async function openUrlInSystemBrowser(url: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const pi = (window as any).Pi;
  if (pi?.openUrlInSystemBrowser) {
    await pi.openUrlInSystemBrowser(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Upload blob to Firebase Storage and open in system browser (Chrome/Safari) via Pi SDK
 */
export async function openBlobInSystemBrowser(blob: Blob, filename: string): Promise<string> {
  const cloudUrl = await uploadBlobToCloud(blob, filename);
  await openUrlInSystemBrowser(cloudUrl);
  return cloudUrl;
}



