/**
 * AI Task Breakdown API
 * POST /api/ai/breakdown - Break down a task into subtasks
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createTaskService } from "@/services/task.service";
import { breakdownTask } from "@/lib/ai";

// Mock user ID for development
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

// Request validation schema
const breakdownRequestSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  createSubtasks: z.boolean().default(true),
});

/**
 * POST /api/ai/breakdown
 * Break down a task into subtasks using AI
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const body = await request.json();

    // Validate request
    const parsed = breakdownRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { taskId, createSubtasks } = parsed.data;

    // Get the task to break down
    const taskService = createTaskService(supabase, userId);
    const taskResult = await taskService.getTaskById(taskId);

    if (!taskResult.success) {
      return NextResponse.json(
        { error: `Task not found: ${taskResult.error}` },
        { status: 404 }
      );
    }

    const task = taskResult.data;

    // Check if task already has subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      return NextResponse.json(
        { error: "Task already has subtasks. Delete existing subtasks first." },
        { status: 400 }
      );
    }

    // Call AI breakdown agent
    const breakdownResult = await breakdownTask(userId, {
      taskId: task.id,
      title: task.title,
      description: task.description ?? undefined,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      priority: task.priority,
      deadline: task.deadline ?? undefined,
    });

    if (!breakdownResult.success) {
      return NextResponse.json(
        { error: `AI breakdown failed: ${breakdownResult.error}` },
        { status: 500 }
      );
    }

    const breakdown = breakdownResult.data;

    // Optionally create subtasks in database
    let createdSubtasks = null;
    if (createSubtasks) {
      const subtasksResult = await taskService.createSubtasks(
        taskId,
        breakdown.subtasks.map((s) => ({
          title: s.title,
          description: s.description,
          estimatedDurationMinutes: s.estimatedDurationMinutes,
        }))
      );

      if (subtasksResult.success) {
        createdSubtasks = subtasksResult.data;
      }
    }

    return NextResponse.json({
      data: {
        breakdown: breakdown.subtasks,
        reasoning: breakdown.reasoning,
        totalEstimatedMinutes: breakdown.totalEstimatedMinutes,
        subtasksCreated: createdSubtasks ? createdSubtasks.length : 0,
        subtasks: createdSubtasks,
        usage: breakdownResult.usage,
      },
    });
  } catch (error) {
    console.error("POST /api/ai/breakdown error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
