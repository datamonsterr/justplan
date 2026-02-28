/**
 * Google Sync API Route
 * POST: Trigger a sync job
 * GET: Get sync status
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { internalErrorResponse, invalidRequestResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { googleSyncQueue } from "@/lib/redis/queue";
import { isGoogleConnected } from "@/lib/google";
import type { GoogleSyncJobData } from "@/workers/google-sync.worker";

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
    const { dbUserId } = await requireApiUser();

    // Check if Google is connected
    const connected = await isGoogleConnected(dbUserId);
    if (!connected) {
      return invalidRequestResponse("Google account not connected");
    }

    const body = await request.json();
    const parsed = syncRequestSchema.safeParse(body);

    if (!parsed.success) {
      return invalidRequestResponse("Invalid request", parsed.error.errors);
    }

    const { syncType, daysBack, daysForward } = parsed.data;

    const jobData: GoogleSyncJobData = {
      userId: dbUserId,
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
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("Google sync error:", error);
    return internalErrorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
}

/**
 * GET /api/google/sync
 * Get sync status and recent sync history
 */
export async function GET() {
  try {
    const { dbUserId } = await requireApiUser();

    // Check if Google is connected
    const connected = await isGoogleConnected(dbUserId);

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
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("Get sync status error:", error);
    return internalErrorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
}
