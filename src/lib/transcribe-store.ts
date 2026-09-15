// Shared in-memory job storage for transcription
// This is a separate file so it can be imported by multiple route handlers

export interface TranscribeJob {
    status: "pending" | "done" | "error";
    result?: any;
    error?: string;
    createdAt: number;
    updatedAt?: number;
}

// In-memory job storage - supports multiple parallel jobs from different clients
// Note: Jobs are lost on cold start, but transcription typically completes within poll time
const jobStore = new Map<string, TranscribeJob>();

// Clean up old jobs (older than 10 minutes) to prevent memory leak
function cleanupOldJobs() {
    const TEN_MINUTES = 10 * 60 * 1000;
    const now = Date.now();
    for (const [jobId, job] of jobStore.entries()) {
        if (now - job.createdAt > TEN_MINUTES) {
            jobStore.delete(jobId);
        }
    }
}

export function saveJob(jobId: string, data: TranscribeJob) {
    cleanupOldJobs();
    jobStore.set(jobId, data);
}

export function getJob(jobId: string): TranscribeJob | undefined {
    return jobStore.get(jobId);
}
