// app/api/status/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DB_FILE = path.resolve("jobs.json");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  let db: any = {};
  try {
    db = JSON.parse(await fs.readFile(DB_FILE, "utf-8"));
  } catch {}

  const job = db[jobId];
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
