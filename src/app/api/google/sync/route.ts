/**
 * Google Sync API Route
 * POST: Trigger a sync job
 * GET: Get sync status
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { googleSyncQueue } from "@/lib/redis/queue";
import { isGoogleConnected } from "@/lib/google";
import type { GoogleSyncJobData } from "@/workers/google-sync.worker";

// TODO: Replace with actual auth
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

// Request validation schema
const syncRequestSchema = z.object({
  syncType: z.enum(["full", "calendar", "tasks"]).optional().default("full"),
  daysBack: z.number().min(1).max(90).optional().default(7),
  daysForward: z.number().min(1).max(90).optional().default(30),
});

/**
 * POST /api/google/sync
 * Queue a Google sync job
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Google is connected
    const connected = await isGoogleConnected(MOCK_USER_ID);
    if (!connected) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = syncRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { syncType, daysBack, daysForward } = parsed.data;

    const jobData: GoogleSyncJobData = {
      userId: MOCK_USER_ID,
      syncType,
      daysBack,
      daysForward,
    };

    const job = await googleSyncQueue.add("sync", jobData, {
      priority: 5,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    return NextResponse.json({
      data: {
        jobId: job.id,
        message: "Sync job queued",
      },
    });
  } catch (error) {
    console.error("Google sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/google/sync
 * Get sync status and recent sync history
 */
export async function GET() {
  try {
    // Check if Google is connected
    const connected = await isGoogleConnected(MOCK_USER_ID);

    // Get queue stats
    const [waiting, active] = await Promise.all([
      googleSyncQueue.getWaitingCount(),
      googleSyncQueue.getActiveCount(),
    ]);

    return NextResponse.json({
      data: {
        connected,
        queueStats: {
          waiting,
          active,
        },
      },
    });
  } catch (error) {
    console.error("Get sync status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
