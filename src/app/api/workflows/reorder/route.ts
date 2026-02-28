/**
 * Workflow Reorder API
 * PUT /api/workflows/reorder - Reorder workflow states
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { invalidRequestResponse, internalErrorResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWorkflowService } from "@/services/workflow.service";

const reorderSchema = z.object({
  stateIds: z.array(z.string().uuid()).min(1, "stateIds is required"),
});

export async function PUT(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();
    const workflowService = createWorkflowService(supabase, dbUserId);

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const result = await workflowService.reorderStates(parsed.data.stateIds);
    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("PUT /api/workflows/reorder error:", error);
    return internalErrorResponse();
  }
}

