/**
 * POST /api/render-local
 * 
 * Start a new local render job using Node.js Remotion renderer.
 * Returns job ID for status polling.
 */

import { NextResponse } from "next/server";
import { createRenderJob } from "../../../lib/render-service";
import type { IDesign } from "@/types/editor";

interface RenderRequestBody {
    design: IDesign;
    options?: {
        fps?: number;
        format?: 'mp4' | 'webm';
        quality?: 'high' | 'standard' | 'low';
    };
}

export async function POST(request: Request) {
    try {
        const body: RenderRequestBody = await request.json();

        if (!body.design) {
            return NextResponse.json(
                { message: "design is required" },
                { status: 400 }
            );
        }

        // Validate design has required fields
        if (!body.design.size || !body.design.trackItemIds) {
            return NextResponse.json(
                { message: "Invalid design: missing size or trackItemIds" },
                { status: 400 }
            );
        }

        console.log("[API render-local] Starting render job...");
        console.log("[API render-local] Design size:", body.design.size);
        console.log("[API render-local] Track items:", body.design.trackItemIds.length);

        // Create render job (processing happens in background)
        const job = await createRenderJob(body.design, body.options);

        console.log("[API render-local] Job created:", job.id);

        return NextResponse.json(
            {
                success: true,
                job: {
                    id: job.id,
                    status: job.status,
                    progress: job.progress,
                    createdAt: job.createdAt,
                },
            },
            { status: 202 } // Accepted - processing
        );
    } catch (error) {
        console.error("[API render-local] Error:", error);
        return NextResponse.json(
            {
                message: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}
