/**
 * Workflow Graph API - Get React Flow compatible workflow data
 */

import { NextResponse } from "next/server";
import { invalidRequestResponse, internalErrorResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWorkflowService } from "@/services/workflow.service";

/**
 * GET /api/workflows/graph - Get workflow as React Flow graph
 */
export async function GET() {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const workflowService = createWorkflowService(supabase, dbUserId);
    const result = await workflowService.getWorkflowGraph();

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("GET /api/workflows/graph error:", error);
    return internalErrorResponse();
  }
}
