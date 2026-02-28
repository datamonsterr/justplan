/**
 * Workflow Transitions API - CRUD operations for transition rules
 */

import { NextRequest, NextResponse } from "next/server";
import {
  invalidRequestResponse,
  internalErrorResponse,
} from "@/lib/api/error-response";
import {
  isApiAuthError,
  requireApiUser,
  toApiAuthErrorResponse,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createWorkflowService,
  createTransitionSchema,
  updateTransitionSchema,
} from "@/services/workflow.service";
import { triggerWorkflowTransitionEvaluation } from "@/services/workflow-transition-trigger.service";
import { z } from "zod";

/**
 * GET /api/workflows/transitions - List all transition rules
 */
export async function GET() {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.getAllTransitions();

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("GET /api/workflows/transitions error:", error);
    return internalErrorResponse();
  }
}

/**
 * POST /api/workflows/transitions - Create a new transition rule
 */
export async function POST(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const body = await request.json();

    // Validate request body
    const parsed = createTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.createTransition(parsed.data);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    void triggerWorkflowTransitionEvaluation(
      { userId: dbUserId },
      "POST /api/workflows/transitions"
    );

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("POST /api/workflows/transitions error:", error);
    return internalErrorResponse();
  }
}

/**
 * PATCH /api/workflows/transitions - Update a transition rule
 */
export async function PATCH(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const body = await request.json();

    // Expect id in body for PATCH
    const bodyWithId = z
      .object({ id: z.string().uuid() })
      .merge(updateTransitionSchema);
    const parsed = bodyWithId.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const { id, ...updateData } = parsed.data;

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.updateTransition(id, updateData);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    void triggerWorkflowTransitionEvaluation(
      { userId: dbUserId },
      "PATCH /api/workflows/transitions"
    );

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("PATCH /api/workflows/transitions error:", error);
    return internalErrorResponse();
  }
}

/**
 * DELETE /api/workflows/transitions - Delete a transition rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return invalidRequestResponse("Transition ID is required");
    }

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.deleteTransition(id);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    void triggerWorkflowTransitionEvaluation(
      { userId: dbUserId },
      "DELETE /api/workflows/transitions"
    );

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("DELETE /api/workflows/transitions error:", error);
    return internalErrorResponse();
  }
}
