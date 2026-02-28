/**
 * Tasks API - GET (list) and POST (create)
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
import { createTaskService, createTaskSchema } from "@/services/task.service";
import { triggerWorkflowTransitionEvaluation } from "@/services/workflow-transition-trigger.service";

/**
 * GET /api/tasks - List all tasks
 */
export async function GET(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const taskService = createTaskService(supabase, dbUserId);

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const includeSubtasks = searchParams.get("includeSubtasks") === "true";
    const workflowStateId = searchParams.get("workflowStateId") ?? undefined;
    const priority = searchParams.get("priority") as
      | "low"
      | "medium"
      | "high"
      | undefined;
    const parentOnly = searchParams.get("parentOnly") === "true";

    const result = await taskService.getAllTasks({
      includeSubtasks,
      workflowStateId,
      priority,
      parentOnly,
    });

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("GET /api/tasks error:", error);
    return internalErrorResponse(
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined
    );
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const body = await request.json();

    // Validate request body
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const taskService = createTaskService(supabase, dbUserId);
    const result = await taskService.createTask(parsed.data);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    void triggerWorkflowTransitionEvaluation(
      { userId: dbUserId, taskIds: [result.data.id] },
      "POST /api/tasks"
    );

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("POST /api/tasks error:", error);
    return internalErrorResponse(
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined
    );
  }
}
