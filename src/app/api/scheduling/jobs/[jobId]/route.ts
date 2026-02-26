/**
 * Scheduling Job Status API
 * GET: Get job status
 * DELETE: Cancel a job
 */

import { NextRequest, NextResponse } from "next/server";
import { getJobStatus, cancelJob } from "@/services/scheduling.service";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/scheduling/jobs/[jobId]
 * Get scheduling job status
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { jobId } = await context.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: status,
    });
  } catch (error) {
    console.error("Get job status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scheduling/jobs/[jobId]
 * Cancel a scheduling job
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { jobId } = await context.params;
    const cancelled = await cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: "Cannot cancel job (may be already running or completed)" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        jobId,
        cancelled: true,
      },
    });
  } catch (error) {
    console.error("Cancel job error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
