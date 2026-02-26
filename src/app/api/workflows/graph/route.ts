/**
 * Workflow Graph API - Get React Flow compatible workflow data
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWorkflowService } from "@/services/workflow.service";

// Mock user ID for development
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * GET /api/workflows/graph - Get workflow as React Flow graph
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.getWorkflowGraph();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("GET /api/workflows/graph error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
