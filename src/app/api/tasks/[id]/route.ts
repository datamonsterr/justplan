/**
 * Task API - GET, PATCH, DELETE by ID
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
import { createTaskService, updateTaskSchema } from "@/services/task.service";
import { triggerWorkflowTransitionEvaluation } from "@/services/workflow-transition-trigger.service";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id] - Get a single task
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const taskService = createTaskService(supabase, dbUserId);
    const result = await taskService.getTaskById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("GET /api/tasks/[id] error:", error);
    return internalErrorResponse(
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined
    );
  }
}

/**
 * PATCH /api/tasks/[id] - Update a task
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const body = await request.json();

    // Validate request body
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const taskService = createTaskService(supabase, dbUserId);
    const result = await taskService.updateTask(id, parsed.data);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    void triggerWorkflowTransitionEvaluation(
      { userId: dbUserId, taskIds: [id] },
      "PATCH /api/tasks/[id]"
    );

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("PATCH /api/tasks/[id] error:", error);
    return internalErrorResponse(
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined
    );
  }
}

/**
 * DELETE /api/tasks/[id] - Soft delete a task
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { dbUserId } = await requireApiUser();
    const supabase = createAdminClient();

    const taskService = createTaskService(supabase, dbUserId);
    const result = await taskService.deleteTask(id);

    if (!result.success) {
      return invalidRequestResponse(result.error);
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("DELETE /api/tasks/[id] error:", error);
    return internalErrorResponse(
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined
    );
  }
}
