/**
 * Workflow State API - GET, PATCH, DELETE by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWorkflowService, updateWorkflowStateSchema } from "@/services/workflow.service";

// Mock user ID for development
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/workflows/[id] - Get a single workflow state
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.getStateById(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("GET /api/workflows/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/[id] - Update a workflow state
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const body = await request.json();

    // Validate request body
    const parsed = updateWorkflowStateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.updateState(id, parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("PATCH /api/workflows/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id] - Delete a workflow state
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.deleteState(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("DELETE /api/workflows/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
