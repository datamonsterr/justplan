/**
 * Scheduling API Routes
 * POST: Queue a scheduling job
 * GET: Get queue statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  queueSchedulingJob,
  getQueueStats,
  getUserActiveJobs,
} from "@/services/scheduling.service";

// TODO: Replace with actual auth
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

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
    const body = await request.json();
    const parsed = scheduleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { taskIds, schedulingWindowDays, optimizeExisting, priority } =
      parsed.data;

    const { jobId } = await queueSchedulingJob({
      userId: MOCK_USER_ID,
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
    console.error("Scheduling error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scheduling
 * Get queue statistics and user's active jobs
 */
export async function GET() {
  try {
    const [stats, activeJobs] = await Promise.all([
      getQueueStats(),
      getUserActiveJobs(MOCK_USER_ID),
    ]);

    return NextResponse.json({
      data: {
        stats,
        activeJobs,
      },
    });
  } catch (error) {
    console.error("Get scheduling stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
