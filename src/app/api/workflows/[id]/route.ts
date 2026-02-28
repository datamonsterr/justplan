/**
 * Workflow State API - GET, PATCH, DELETE by ID
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
  updateWorkflowStateSchema,
} from "@/services/workflow.service";
import { triggerWorkflowTransitionEvaluation } from "@/services/workflow-transition-trigger.service";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/workflows/[id] - Get a single workflow state
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.getStateById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("GET /api/workflows/[id] error:", error);
    return internalErrorResponse();
  }
}

/**
 * PATCH /api/workflows/[id] - Update a workflow state
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const body = await request.json();

    // Validate request body
    const parsed = updateWorkflowStateSchema.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.updateState(id, parsed.data);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    void triggerWorkflowTransitionEvaluation(
      { userId: dbUserId },
      "PATCH /api/workflows/[id]"
    );

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("PATCH /api/workflows/[id] error:", error);
    return internalErrorResponse();
  }
}

/**
 * DELETE /api/workflows/[id] - Delete a workflow state
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.deleteState(id);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("DELETE /api/workflows/[id] error:", error);
    return internalErrorResponse();
  }
}
