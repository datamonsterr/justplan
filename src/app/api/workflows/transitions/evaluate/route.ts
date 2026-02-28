/**
 * Workflow Transition Evaluation API
 * POST /api/workflows/transitions/evaluate - enqueue transition evaluation
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { internalErrorResponse, invalidRequestResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { queueWorkflowTransitionEvaluation } from "@/services/workflow-transitions.service";

const evaluateSchema = z.object({
  taskIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const body = await request.json().catch(() => ({}));
    const parsed = evaluateSchema.safeParse(body);

    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const { jobId } = await queueWorkflowTransitionEvaluation({
      userId: dbUserId,
      taskIds: parsed.data.taskIds,
    });

    return NextResponse.json({
      data: {
        jobId,
        message: "Workflow transition evaluation queued",
      },
    });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("POST /api/workflows/transitions/evaluate error:", error);
    return internalErrorResponse();
  }
}

