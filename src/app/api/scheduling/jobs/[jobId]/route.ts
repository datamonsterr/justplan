/**
 * Scheduling Job Status API
 * GET: Get job status
 * DELETE: Cancel a job
 */

import { NextRequest, NextResponse } from "next/server";
import {
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { cancelJob, checkJobAccess, getJobStatus } from "@/services/scheduling.service";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/scheduling/jobs/[jobId]
 * Get scheduling job status
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { dbUserId } = await requireApiUser();
    const { jobId } = await context.params;
    const access = await checkJobAccess(jobId, dbUserId);

    if (access === "not_found") {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (access === "forbidden") {
      return forbiddenResponse("Access denied");
    }

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
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("Get job status error:", error);
    return internalErrorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
}

/**
 * DELETE /api/scheduling/jobs/[jobId]
 * Cancel a scheduling job
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { dbUserId } = await requireApiUser();
    const { jobId } = await context.params;
    const access = await checkJobAccess(jobId, dbUserId);

    if (access === "not_found") {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (access === "forbidden") {
      return forbiddenResponse("Access denied");
    }

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
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("Cancel job error:", error);
    return internalErrorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
}
