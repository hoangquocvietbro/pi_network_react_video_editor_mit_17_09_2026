/**
 * Render Service - Supports both local and remote rendering
 * 
 * Mode is determined by RENDER_MODE environment variable:
 * - 'local': Spawns render script as child process (development)
 * - 'remote': Calls external render server API (production on Vercel)
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import type { IDesign } from "@designcombo/types";
import { SERVER_ENV } from "./server-env";
import { PUBLIC_ENV } from "./public-env";
// Configuration
const JOBS_DIR = path.resolve(process.cwd(), "public/renders/jobs");
const OUTPUT_DIR = path.resolve(process.cwd(), "public/renders");
const RENDER_MODE = PUBLIC_ENV.RENDER_MODE || 'remote';
const RENDER_SERVER_URL = PUBLIC_ENV.RENDER_SERVER_URL || 'https://hoangquocviet-veditor-render-server.hf.space';

export interface RenderJob {
    id: string;
    status: 'pending' | 'bundling' | 'rendering' | 'completed' | 'failed';
    progress: number;
    createdAt: Date;
    updatedAt: Date;
    outputUrl?: string;
    error?: string;
}

export interface RenderOptions {
    fps: number;
    width: number;
    height: number;
    format: 'mp4' | 'webm';
    quality?: 'high' | 'standard' | 'low';
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
    return `render_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Ensure directories exist (for local mode)
 */
function ensureDirs(): void {
    if (RENDER_MODE === 'local') {
        if (!fs.existsSync(JOBS_DIR)) {
            fs.mkdirSync(JOBS_DIR, { recursive: true });
        }
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
    }
}

/**
 * Create a new render job
 */
export async function createRenderJob(
    design: IDesign,
    options: Partial<RenderOptions> = {}
): Promise<RenderJob> {
    ensureDirs();

    // Calculate dimensions based on quality
    let width = design.size.width;
    let height = design.size.height;

    if (options.quality === 'standard') {
        const scale = 720 / Math.min(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    } else if (options.quality === 'low') {
        const scale = 480 / Math.min(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    // Ensure even dimensions
    width = Math.round(width / 2) * 2;
    height = Math.round(height / 2) * 2;

    const renderOptions: RenderOptions = {
        fps: options.fps || 30,
        width,
        height,
        format: options.format || 'mp4',
        quality: options.quality || 'high',
    };

    // Use remote or local mode
    if (RENDER_MODE === 'remote') {
        return createRemoteRenderJob(design, renderOptions);
    } else {
        return createLocalRenderJob(design, renderOptions);
    }
}

/**
 * Create render job on remote server (Hugging Face)
 */
async function createRemoteRenderJob(
    design: IDesign,
    options: RenderOptions
): Promise<RenderJob> {
    console.log("[RenderService] Creating remote render job on:", RENDER_SERVER_URL);

    const response = await fetch(`${RENDER_SERVER_URL}/render`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVER_ENV.RENDER_SERVER_TOKEN}`,
        },
        body: JSON.stringify({ design, options }),
    });

    if (!response.ok) {
        throw new Error(`Remote render failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        id: data.jobId,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Create render job locally (spawn child process)
 */
async function createLocalRenderJob(
    design: IDesign,
    options: RenderOptions
): Promise<RenderJob> {
    const jobId = generateJobId();

    // Write job file
    const jobFilePath = path.join(JOBS_DIR, `${jobId}.json`);
    const statusFilePath = path.join(JOBS_DIR, `${jobId}.status.json`);

    const jobData = {
        id: jobId,
        design,
        options,
    };

    fs.writeFileSync(jobFilePath, JSON.stringify(jobData, null, 2));
    fs.writeFileSync(statusFilePath, JSON.stringify({
        status: 'pending',
        progress: 0,
    }));

    // Spawn render script as background process
    const scriptPath = path.resolve(process.cwd(), "scripts/render-video.ts");

    console.log("[RenderService] Spawning local render process for job:", jobId);

    const child = spawn("npx", ["tsx", scriptPath, jobFilePath], {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
        shell: true,
    });

    child.unref();

    return {
        id: jobId,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Get render job status
 */
export async function getRenderJobStatus(jobId: string): Promise<RenderJob | undefined> {
    if (RENDER_MODE === 'remote') {
        return getRemoteJobStatus(jobId);
    } else {
        return getLocalJobStatus(jobId);
    }
}

/**
 * Get status from remote server
 */
async function getRemoteJobStatus(jobId: string): Promise<RenderJob | undefined> {
    try {
        const response = await fetch(`${RENDER_SERVER_URL}/render/${jobId}`,
            {
                headers: {
                    'Authorization': `Bearer ${SERVER_ENV.RENDER_SERVER_TOKEN}`,
                },
            }
        );

        if (!response.ok) {
            return undefined;
        }

        const data = await response.json();

        // If completed, adjust outputUrl to use remote server (only for relative paths)
        let outputUrl = data.outputUrl;
        if (outputUrl && RENDER_MODE === 'remote' && outputUrl.startsWith('/')) {
            // Only prepend server URL for relative paths (like /videos/xxx.mp4)
            // Firebase URLs are already absolute and shouldn't be modified
            outputUrl = `${RENDER_SERVER_URL}${outputUrl}`;
        }

        return {
            id: jobId,
            status: data.status,
            progress: data.progress,
            outputUrl,
            error: data.error,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    } catch {
        return undefined;
    }
}

/**
 * Get status from local status file
 */
function getLocalJobStatus(jobId: string): RenderJob | undefined {
    const statusFilePath = path.join(JOBS_DIR, `${jobId}.status.json`);

    if (!fs.existsSync(statusFilePath)) {
        return undefined;
    }

    try {
        const statusContent = fs.readFileSync(statusFilePath, "utf-8");
        const status = JSON.parse(statusContent);

        return {
            id: jobId,
            status: status.status,
            progress: status.progress,
            outputUrl: status.outputUrl,
            error: status.error,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    } catch {
        return undefined;
    }
}
