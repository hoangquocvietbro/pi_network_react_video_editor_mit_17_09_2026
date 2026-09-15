import { NextRequest, NextResponse } from "next/server";
import { SERVER_ENV } from "../../../lib/server-env";
/**
 * Proxy download API - Fetches video from remote server and streams it back
 * with proper headers to force download instead of opening in new tab.
 * 
 * Usage: GET /api/download?url=<encoded_url>&filename=<optional_filename>
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoUrl = searchParams.get("url");
        const filename = searchParams.get("filename") || `veditor-export-${Date.now()}.mp4`;

        if (!videoUrl) {
            return NextResponse.json(
                { error: "Missing 'url' parameter" },
                { status: 400 }
            );
        }

        // Fetch the video from remote server
        const response = await fetch(videoUrl, {
            headers: {
                // Pass auth token if it's our render server
                ...(videoUrl.includes(SERVER_ENV.RENDER_SERVER_URL || '') && {
                    'Authorization': `Bearer ${SERVER_ENV.RENDER_SERVER_TOKEN}`,
                }),
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch video: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Get the video data as array buffer
        const videoBuffer = await response.arrayBuffer();

        // Return with headers that force download
        return new NextResponse(videoBuffer, {
            status: 200,
            headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": videoBuffer.byteLength.toString(),
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("Download proxy error:", error);
        return NextResponse.json(
            {
                error: "Failed to download video",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
