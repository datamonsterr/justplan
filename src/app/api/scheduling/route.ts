/**
 * Scheduling API Routes
 * POST: Queue a scheduling job
 * GET: Get queue statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { internalErrorResponse, invalidRequestResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import {
  queueSchedulingJob,
  getQueueStats,
  getUserActiveJobs,
} from "@/services/scheduling.service";

// Request validation schema
const scheduleRequestSchema = z.object({
  taskIds: z.array(z.string().uuid()).optional(),
  schedulingWindowDays: z.number().min(1).max(90).optional().default(14),
  optimizeExisting: z.boolean().optional().default(false),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
});

/**
 * POST /api/scheduling
 * Queue a new scheduling job
 */
export async function POST(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const body = await request.json();
    const parsed = scheduleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return invalidRequestResponse("Invalid request", parsed.error.errors);
    }

    const { taskIds, schedulingWindowDays, optimizeExisting, priority } =
      parsed.data;

    const { jobId } = await queueSchedulingJob({
      userId: dbUserId,
      taskIds,
      schedulingWindowDays,
      optimizeExisting,
      priority,
    });

    return NextResponse.json({
      data: {
        jobId,
        message: "Scheduling job queued",
      },
    });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("Scheduling error:", error);
    return internalErrorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
}

/**
 * GET /api/scheduling
 * Get queue statistics and user's active jobs
 */
export async function GET() {
  try {
    const { dbUserId } = await requireApiUser();
    const [stats, activeJobs] = await Promise.all([
      getQueueStats(),
      getUserActiveJobs(dbUserId),
    ]);

    return NextResponse.json({
      data: {
        stats,
        activeJobs,
      },
    });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("Get scheduling stats error:", error);
    return internalErrorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
}
