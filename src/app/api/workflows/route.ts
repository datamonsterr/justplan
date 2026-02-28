/**
 * Workflows API - GET (list) and POST (create)
 */

import { NextRequest, NextResponse } from "next/server";
import { invalidRequestResponse, internalErrorResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWorkflowService, createWorkflowStateSchema } from "@/services/workflow.service";

/**
 * GET /api/workflows - List all workflow states
 */
export async function GET() {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.getAllStates();

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("GET /api/workflows error:", error);
    return internalErrorResponse();
  }
}

/**
 * POST /api/workflows - Create a new workflow state
 */
export async function POST(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const body = await request.json();

    // Validate request body
    const parsed = createWorkflowStateSchema.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.createState(parsed.data);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("POST /api/workflows error:", error);
    return internalErrorResponse();
  }
}
