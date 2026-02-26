/**
 * Tasks API - GET (list) and POST (create)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTaskService, createTaskSchema } from "@/services/task.service";

// Mock user ID for development (replace with auth when ready)
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * GET /api/tasks - List all tasks
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user from auth (or use mock for development)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const taskService = createTaskService(supabase, userId);

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const includeSubtasks = searchParams.get("includeSubtasks") === "true";
    const workflowStateId = searchParams.get("workflowStateId") ?? undefined;
    const priority = searchParams.get("priority") as "low" | "medium" | "high" | undefined;
    const parentOnly = searchParams.get("parentOnly") === "true";

    const result = await taskService.getAllTasks({
      includeSubtasks,
      workflowStateId,
      priority,
      parentOnly,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const body = await request.json();

    // Validate request body
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const taskService = createTaskService(supabase, userId);
    const result = await taskService.createTask(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
