/**
 * Render Script - Standalone Node.js script for video rendering
 * 
 * This script is called by the API route as a child process to avoid
 * conflicts between @remotion/bundler and Next.js webpack.
 * 
 * Optimizations:
 * - Concurrency: Uses 50% of CPU cores for parallel rendering
 * - Verbose: Disabled for faster rendering
 * - Logging: Writes to public/renders/logs/<job-id>.log
 * 
 * Usage: npx tsx scripts/render-video.ts <job-file-path>
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, getCompositions } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

interface RenderJob {
    id: string;
    design: unknown;
    options: {
        fps: number;
        width: number;
        height: number;
        format: 'mp4' | 'webm';
    };
}

interface StatusFile {
    status: 'pending' | 'bundling' | 'rendering' | 'completed' | 'failed';
    progress: number;
    outputUrl?: string;
    error?: string;
}

const REMOTION_ENTRY = path.resolve(process.cwd(), "remotion/index.tsx");
const OUTPUT_DIR = path.resolve(process.cwd(), "public/renders");
const LOGS_DIR = path.resolve(process.cwd(), "public/renders/logs");
const COMPOSITION_ID = "VEditor";

// Optimized configuration
const CONFIG = {
    // Use 50% of CPU cores for parallel rendering (significant speedup)
    concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
    // Disable verbose for speed
    verbose: false,
    // Timeout for render
    timeoutMs: 180000,
};

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Logger that writes to both console and file
class Logger {
    private logFile: string;

    constructor(jobId: string) {
        this.logFile = path.join(LOGS_DIR, `${jobId}.log`);
        fs.writeFileSync(this.logFile, `=== Render Log for ${jobId} ===\nStarted: ${new Date().toISOString()}\nConfig: ${JSON.stringify(CONFIG, null, 2)}\n\n`);
    }

    log(message: string) {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] ${message}\n`;
        console.log(message);
        fs.appendFileSync(this.logFile, line);
    }

    error(message: string, error?: unknown) {
        const timestamp = new Date().toISOString();
        let line = `[${timestamp}] ERROR: ${message}\n`;
        if (error instanceof Error) {
            line += `  Message: ${error.message}\n`;
            if (error.stack) {
                line += `  Stack: ${error.stack}\n`;
            }
        } else if (error) {
            line += `  Details: ${JSON.stringify(error)}\n`;
        }
        console.error(message, error);
        fs.appendFileSync(this.logFile, line);
    }
}

async function main() {
    const jobFilePath = process.argv[2];

    if (!jobFilePath) {
        console.error("Usage: npx tsx scripts/render-video.ts <job-file-path>");
        process.exit(1);
    }

    // Read job file
    const jobContent = fs.readFileSync(jobFilePath, "utf-8");
    const job: RenderJob = JSON.parse(jobContent);
    const statusFilePath = jobFilePath.replace(".json", ".status.json");

    // Initialize logger
    const logger = new Logger(job.id);

    const updateStatus = (status: StatusFile) => {
        fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
    };

    try {
        logger.log(`Starting job: ${job.id}`);
        logger.log(`Options: ${JSON.stringify(job.options)}`);
        logger.log(`Concurrency: ${CONFIG.concurrency} threads`);

        updateStatus({ status: 'bundling', progress: 5 });

        // Step 1: Bundle
        logger.log(`Bundling from: ${REMOTION_ENTRY}`);
        const bundleStart = Date.now();

        const bundlePath = await bundle({
            entryPoint: REMOTION_ENTRY,
            onProgress: (progress) => {
                const scaledProgress = Math.round(5 + progress * 10);
                updateStatus({ status: 'bundling', progress: scaledProgress });
            },
        });

        const bundleTime = ((Date.now() - bundleStart) / 1000).toFixed(1);
        logger.log(`Bundle created in ${bundleTime}s: ${bundlePath}`);

        // Step 2: Select composition
        logger.log("Selecting composition...");
        const inputProps = { design: job.design };

        const compositions = await getCompositions(bundlePath, { inputProps });
        logger.log(`Available compositions: ${compositions.map(c => c.id).join(", ")}`);

        const composition = await selectComposition({
            serveUrl: bundlePath,
            id: COMPOSITION_ID,
            inputProps,
        });

        logger.log(`Composition: ${composition.id} - ${composition.durationInFrames} frames @ ${composition.fps}fps`);
        logger.log(`Resolution: ${composition.width}x${composition.height}`);

        updateStatus({ status: 'rendering', progress: 20 });

        // Step 3: Render
        const outputPath = path.join(OUTPUT_DIR, `${job.id}.${job.options.format}`);
        logger.log(`Rendering to: ${outputPath}`);

        const renderStart = Date.now();

        await renderMedia({
            composition,
            serveUrl: bundlePath,
            codec: job.options.format === 'webm' ? 'vp8' : 'h264',
            outputLocation: outputPath,
            inputProps,
            verbose: CONFIG.verbose,
            concurrency: CONFIG.concurrency,
            timeoutInMilliseconds: CONFIG.timeoutMs,
            chromiumOptions: {
                disableWebSecurity: true,
                gl: 'angle',
            },
            onProgress: ({ progress, renderedFrames, stitchStage }) => {
                const scaledProgress = 20 + Math.round(progress * 75);
                updateStatus({ status: 'rendering', progress: scaledProgress });

                // Log every 10%
                const pct = Math.round(progress * 100);
                if (pct % 10 === 0) {
                    logger.log(`Progress: ${pct}% | Frames: ${renderedFrames}/${composition.durationInFrames} | Stage: ${stitchStage}`);
                }
            },
        });

        // Step 4: Complete
        const renderTime = ((Date.now() - renderStart) / 1000).toFixed(1);
        const effectiveFps = (composition.durationInFrames / parseFloat(renderTime)).toFixed(1);

        const outputUrl = `/renders/${job.id}.${job.options.format}`;
        updateStatus({ status: 'completed', progress: 100, outputUrl });

        logger.log(`Render completed in ${renderTime}s (${effectiveFps} fps effective)`);
        logger.log(`Output: ${outputUrl}`);

    } catch (error) {
        logger.error("Render failed", error);

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        updateStatus({
            status: 'failed',
            progress: 0,
            error: errorMessage
        });

        process.exit(1);
    }
}

main();
