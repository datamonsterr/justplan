/**
 * Workflow Transitions API - CRUD operations for transition rules
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createWorkflowService,
  createTransitionSchema,
  updateTransitionSchema,
} from "@/services/workflow.service";
import { z } from "zod";

// Mock user ID for development
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * GET /api/workflows/transitions - List all transition rules
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.getAllTransitions();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("GET /api/workflows/transitions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows/transitions - Create a new transition rule
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const body = await request.json();

    // Validate request body
    const parsed = createTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.createTransition(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/workflows/transitions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/transitions - Update a transition rule
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const body = await request.json();

    // Expect id in body for PATCH
    const bodyWithId = z.object({ id: z.string().uuid() }).merge(updateTransitionSchema);
    const parsed = bodyWithId.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.updateTransition(id, updateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("PATCH /api/workflows/transitions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/transitions - Delete a transition rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transition ID is required" },
        { status: 400 }
      );
    }

    const workflowService = createWorkflowService(supabase, userId);
    const result = await workflowService.deleteTransition(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("DELETE /api/workflows/transitions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
