/**
 * GET /api/render-local/[id]
 * 
 * Get the status of a render job by ID.
 */

import { NextResponse } from "next/server";
import { getRenderJobStatus } from "../../../../lib/render-service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { message: "Job ID is required" },
                { status: 400 }
            );
        }

        const job = await getRenderJobStatus(id);

        if (!job) {
            return NextResponse.json(
                { message: "Job not found" },
                { status: 404 }
            );
        }

        // Return job status
        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                status: job.status,
                progress: job.progress,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
                outputUrl: job.outputUrl,
                error: job.error,
            },
        });
    } catch (error) {
        console.error("[API render-local/[id]] Error:", error);
        return NextResponse.json(
            {
                message: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}
