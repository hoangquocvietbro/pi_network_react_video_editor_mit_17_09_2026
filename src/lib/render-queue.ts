/**
 * Render Queue - In-memory job queue for render jobs
 * 
 * Simple implementation using Map. Can be upgraded to Redis for production.
 */

export interface RenderJob {
    id: string;
    status: 'pending' | 'bundling' | 'rendering' | 'completed' | 'failed';
    progress: number;
    createdAt: Date;
    updatedAt: Date;
    design: unknown;
    options: RenderOptions;
    outputPath?: string;
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

// In-memory store
const jobs = new Map<string, RenderJob>();

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
    return `render_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Add a new render job to the queue
 */
export function addJob(job: RenderJob): void {
    jobs.set(job.id, job);
}

/**
 * Get a render job by ID
 */
export function getJob(id: string): RenderJob | undefined {
    return jobs.get(id);
}

/**
 * Update a render job
 */
export function updateJob(id: string, updates: Partial<RenderJob>): RenderJob | undefined {
    const job = jobs.get(id);
    if (!job) return undefined;

    const updatedJob: RenderJob = {
        ...job,
        ...updates,
        updatedAt: new Date(),
    };

    jobs.set(id, updatedJob);
    return updatedJob;
}

/**
 * Get all render jobs
 */
export function getAllJobs(): RenderJob[] {
    return Array.from(jobs.values());
}

/**
 * Delete a render job
 */
export function deleteJob(id: string): boolean {
    return jobs.delete(id);
}

/**
 * Clean up old completed/failed jobs (older than 1 hour)
 */
export function cleanupOldJobs(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [id, job] of jobs.entries()) {
        if (
            (job.status === 'completed' || job.status === 'failed') &&
            job.updatedAt < oneHourAgo
        ) {
            jobs.delete(id);
        }
    }
}
