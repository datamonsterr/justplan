/**
 * Task Service - CRUD operations for tasks with subtask support
 */

import { z } from "zod";
import {
  BaseService,
  ApiResponse,
  success,
  failure,
  validateInput,
  uuidSchema,
} from "./base.service";
import type { Database } from "@/types/database.types";

// ============================================================================
// Types
// ============================================================================

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  estimatedDurationMinutes: number;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  workflowStateId: string | null;
  isScheduled: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  isPinned: boolean;
  googleTaskId: string | null;
  googleCalendarEventId: string | null;
  parentTaskId: string | null;
  dependsOnTaskId: string | null;
  aiGenerated: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Populated fields
  workflowState?: WorkflowStateBasic;
  subtasks?: Task[];
}

interface WorkflowStateBasic {
  id: string;
  name: string;
  color: string;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const deadlineSchema = z
  .union([
    z.string().datetime(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  ])
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000).optional(),
  estimatedDurationMinutes: z
    .number()
    .int()
    .positive("Duration must be positive")
    .max(480, "Duration cannot exceed 8 hours"),
  deadline: deadlineSchema,
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  workflowStateId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  dependsOnTaskId: z.string().uuid().optional(),
  isPinned: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  dependsOnTaskId: z.string().uuid().nullable().optional(),
  isScheduled: z.boolean().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ============================================================================
// Task Service
// ============================================================================

export class TaskService extends BaseService {
  /**
   * Transform database row to Task interface
   */
  private transformTask(
    row: TaskRow & { workflow_states?: WorkflowStateBasic | null }
  ): Task {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      estimatedDurationMinutes: row.estimated_duration_minutes,
      deadline: row.deadline,
      priority: row.priority,
      workflowStateId: row.workflow_state_id,
      isScheduled: row.is_scheduled,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      isPinned: row.is_pinned,
      googleTaskId: row.google_task_id,
      googleCalendarEventId: row.google_calendar_event_id,
      parentTaskId:
        ((row as Record<string, unknown>).parent_task_id as string | null) ??
        null,
      dependsOnTaskId:
        ((row as Record<string, unknown>).depends_on_task_id as
          | string
          | null) ?? null,
      aiGenerated:
        ((row as Record<string, unknown>).ai_generated as boolean) ?? false,
      metadata:
        typeof row.metadata === "object" && row.metadata !== null
          ? (row.metadata as Record<string, unknown>)
          : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      workflowState: row.workflow_states ?? undefined,
    };
  }

  private async validateDependency(
    dependsOnTaskId: string,
    taskIdToExclude?: string
  ): Promise<ApiResponse<true>> {
    if (taskIdToExclude && dependsOnTaskId === taskIdToExclude) {
      return failure("A task cannot depend on itself");
    }

    const { data: dependencyTask, error: dependencyError } = await this.supabase
      .from("tasks")
      .select("id, depends_on_task_id")
      .eq("id", dependsOnTaskId)
      .eq("user_id", this.userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (dependencyError || !dependencyTask) {
      return failure("Dependency task not found");
    }

    // Prevent direct circular dependency A -> B while B -> A.
    if (
      taskIdToExclude &&
      (dependencyTask as Record<string, unknown>).depends_on_task_id ===
        taskIdToExclude
    ) {
      return failure("Circular dependency detected");
    }

    return success(true);
  }

  private async isTaskDependencyResolved(taskId: string): Promise<boolean> {
    const { data: taskRow } = await this.supabase
      .from("tasks")
      .select("depends_on_task_id")
      .eq("id", taskId)
      .eq("user_id", this.userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!taskRow) {
      return false;
    }

    const dependencyId = (taskRow as Record<string, unknown>)
      .depends_on_task_id as string | null;

    if (!dependencyId) {
      return true;
    }

    const { data: dependency } = await this.supabase
      .from("tasks")
      .select(
        `
        id,
        workflow_states (
          is_terminal
        )
      `
      )
      .eq("id", dependencyId)
      .eq("user_id", this.userId)
      .is("deleted_at", null)
      .maybeSingle();

    return !!(
      dependency &&
      (dependency as Record<string, unknown>).workflow_states &&
      (
        (dependency as Record<string, unknown>).workflow_states as Record<
          string,
          unknown
        >
      ).is_terminal === true
    );
  }

  /**
   * Get all tasks for the user (excluding soft-deleted)
   */
  async getAllTasks(options?: {
    includeSubtasks?: boolean;
    workflowStateId?: string;
    priority?: "low" | "medium" | "high";
    parentOnly?: boolean;
  }): Promise<ApiResponse<Task[]>> {
    let query = this.supabase
      .from("tasks")
      .select(
        `
        *,
        workflow_states (
          id,
          name,
          color
        )
      `
      )
      .eq("user_id", this.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Filter by workflow state
    if (options?.workflowStateId) {
      query = query.eq("workflow_state_id", options.workflowStateId);
    }

    // Filter by priority
    if (options?.priority) {
      query = query.eq("priority", options.priority);
    }

    // Only parent tasks (no subtasks)
    if (options?.parentOnly) {
      query = query.is("parent_task_id", null);
    }

    const { data, error } = await query;

    if (error) {
      return failure(error.message);
    }

    const tasks = (data || []).map((row) => this.transformTask(row as TaskRow));

    // If includeSubtasks, nest subtasks under their parents
    if (options?.includeSubtasks) {
      const taskMap = new Map<string, Task>();
      const parentTasks: Task[] = [];

      // First pass: create map and identify parents
      for (const task of tasks) {
        taskMap.set(task.id, { ...task, subtasks: [] });
      }

      // Second pass: nest subtasks
      for (const task of tasks) {
        const mappedTask = taskMap.get(task.id)!;
        if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
          const parent = taskMap.get(task.parentTaskId)!;
          parent.subtasks = parent.subtasks || [];
          parent.subtasks.push(mappedTask);
        } else if (!task.parentTaskId) {
          parentTasks.push(mappedTask);
        }
      }

      return success(parentTasks);
    }

    return success(tasks);
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    const validation = validateInput(uuidSchema, id);
    if (!validation.success) {
      return failure(validation.error!);
    }

    const { data, error } = await this.supabase
      .from("tasks")
      .select(
        `
        *,
        workflow_states (
          id,
          name,
          color
        )
      `
      )
      .eq("id", id)
      .eq("user_id", this.userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      return failure(error.message);
    }

    // Fetch subtasks
    const { data: subtasksData } = await this.supabase
      .from("tasks")
      .select(
        `
        *,
        workflow_states (
          id,
          name,
          color
        )
      `
      )
      .eq("parent_task_id", id)
      .eq("user_id", this.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    const task = this.transformTask(data as TaskRow);
    task.subtasks = (subtasksData || []).map((row) =>
      this.transformTask(row as TaskRow)
    );

    return success(task);
  }

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput): Promise<ApiResponse<Task>> {
    const validation = validateInput(createTaskSchema, input);
    if (!validation.success) {
      return failure(validation.error!);
    }

    if (input.dependsOnTaskId) {
      const dependencyValidation = await this.validateDependency(
        input.dependsOnTaskId
      );
      if (!dependencyValidation.success) {
        return failure(dependencyValidation.error!);
      }
    }

    const { data, error } = await this.supabase
      .from("tasks")
      .insert({
        user_id: this.userId,
        title: input.title,
        description: input.description,
        estimated_duration_minutes: input.estimatedDurationMinutes,
        deadline: input.deadline,
        priority: input.priority,
        workflow_state_id: input.workflowStateId,
        parent_task_id: input.parentTaskId,
        depends_on_task_id: input.dependsOnTaskId,
        is_pinned: input.isPinned,
        metadata: input.metadata,
      })
      .select(
        `
        *,
        workflow_states (
          id,
          name,
          color
        )
      `
      )
      .single();

    if (error) {
      return failure(error.message);
    }

    return success(this.transformTask(data as TaskRow));
  }

  /**
   * Update an existing task
   */
  async updateTask(
    id: string,
    input: UpdateTaskInput
  ): Promise<ApiResponse<Task>> {
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return failure(idValidation.error!);
    }

    const validation = validateInput(updateTaskSchema, input);
    if (!validation.success) {
      return failure(validation.error!);
    }

    if (input.dependsOnTaskId !== undefined && input.dependsOnTaskId !== null) {
      const dependencyValidation = await this.validateDependency(
        input.dependsOnTaskId,
        id
      );
      if (!dependencyValidation.success) {
        return failure(dependencyValidation.error!);
      }
    }

    if (input.workflowStateId) {
      const { data: targetState } = await this.supabase
        .from("workflow_states")
        .select("is_terminal")
        .eq("id", input.workflowStateId)
        .eq("user_id", this.userId)
        .maybeSingle();

      if (
        targetState &&
        (targetState as Record<string, unknown>).is_terminal === true
      ) {
        let resolved: boolean;
        if (input.dependsOnTaskId === null) {
          resolved = true;
        } else if (typeof input.dependsOnTaskId === "string") {
          const { data: dependency } = await this.supabase
            .from("tasks")
            .select(
              `
              id,
              workflow_states (
                is_terminal
              )
            `
            )
            .eq("id", input.dependsOnTaskId)
            .eq("user_id", this.userId)
            .is("deleted_at", null)
            .maybeSingle();

          const state = dependency
            ? ((dependency as Record<string, unknown>)
                .workflow_states as Record<string, unknown> | null)
            : null;
          resolved = !!state && state.is_terminal === true;
        } else {
          resolved = await this.isTaskDependencyResolved(id);
        }

        if (!resolved) {
          return failure("Cannot complete task before dependency is completed");
        }
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.estimatedDurationMinutes !== undefined)
      updateData.estimated_duration_minutes = input.estimatedDurationMinutes;
    if (input.deadline !== undefined) updateData.deadline = input.deadline;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.workflowStateId !== undefined)
      updateData.workflow_state_id = input.workflowStateId;
    if (input.parentTaskId !== undefined)
      updateData.parent_task_id = input.parentTaskId;
    if (input.dependsOnTaskId !== undefined)
      updateData.depends_on_task_id = input.dependsOnTaskId;
    if (input.isPinned !== undefined) updateData.is_pinned = input.isPinned;
    if (input.isScheduled !== undefined)
      updateData.is_scheduled = input.isScheduled;
    if (input.scheduledStart !== undefined)
      updateData.scheduled_start = input.scheduledStart;
    if (input.scheduledEnd !== undefined)
      updateData.scheduled_end = input.scheduledEnd;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", this.userId)
      .is("deleted_at", null)
      .select(
        `
        *,
        workflow_states (
          id,
          name,
          color
        )
      `
      )
      .single();

    if (error) {
      return failure(error.message);
    }

    return success(this.transformTask(data as TaskRow));
  }

  /**
   * Soft delete a task (and all nested subtasks)
   */
  async deleteTask(id: string): Promise<ApiResponse<{ id: string }>> {
    const validation = validateInput(uuidSchema, id);
    if (!validation.success) {
      return failure(validation.error!);
    }

    const deletedAt = new Date().toISOString();

    const { data: relationRows, error: relationError } = await this.supabase
      .from("tasks")
      .select("id, parent_task_id")
      .eq("user_id", this.userId)
      .is("deleted_at", null);

    if (relationError) {
      return failure(relationError.message);
    }

    const childrenByParent = new Map<string, string[]>();
    for (const row of relationRows || []) {
      const rowRecord = row as Record<string, unknown>;
      const taskId = rowRecord.id as string;
      const parentId = rowRecord.parent_task_id as string | null;
      if (!parentId) continue;
      const children = childrenByParent.get(parentId) ?? [];
      children.push(taskId);
      childrenByParent.set(parentId, children);
    }

    const taskIdsToDelete = new Set<string>([id]);
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childrenByParent.get(current) ?? [];
      for (const childId of children) {
        if (taskIdsToDelete.has(childId)) continue;
        taskIdsToDelete.add(childId);
        queue.push(childId);
      }
    }

    const { error } = await this.supabase
      .from("tasks")
      .update({ deleted_at: deletedAt })
      .in("id", Array.from(taskIdsToDelete))
      .eq("user_id", this.userId);

    if (error) {
      return failure(error.message);
    }

    return success({ id });
  }

  /**
   * Create multiple subtasks (used by AI breakdown)
   */
  async createSubtasks(
    parentTaskId: string,
    subtasks: Array<{
      title: string;
      description?: string;
      estimatedDurationMinutes: number;
    }>
  ): Promise<ApiResponse<Task[]>> {
    const validation = validateInput(uuidSchema, parentTaskId);
    if (!validation.success) {
      return failure(validation.error!);
    }

    // Get parent task to copy workflow state
    const parentResult = await this.getTaskById(parentTaskId);
    if (!parentResult.success) {
      return failure(`Parent task not found: ${parentResult.error}`);
    }

    const parent = parentResult.data;

    // Insert all subtasks
    const { data, error } = await this.supabase.from("tasks").insert(
      subtasks.map((s) => ({
        user_id: this.userId,
        title: s.title,
        description: s.description ?? null,
        estimated_duration_minutes: s.estimatedDurationMinutes,
        priority: parent.priority,
        workflow_state_id: parent.workflowStateId,
        parent_task_id: parentTaskId,
        ai_generated: true,
        metadata: { source: "ai-breakdown" },
      }))
    ).select(`
        *,
        workflow_states (
          id,
          name,
          color
        )
      `);

    if (error) {
      return failure(error.message);
    }

    return success(
      (data || []).map((row) => this.transformTask(row as TaskRow))
    );
  }

  /**
   * Get tasks that need scheduling (not scheduled, not pinned, should auto-schedule)
   */
  async getUnscheduledTasks(): Promise<ApiResponse<Task[]>> {
    const { data, error } = await this.supabase
      .from("tasks")
      .select(
        `
        *,
        workflow_states!inner (
          id,
          name,
          color,
          should_auto_schedule,
          scheduling_priority_boost
        )
      `
      )
      .eq("user_id", this.userId)
      .eq("is_scheduled", false)
      .eq("is_pinned", false)
      .eq("workflow_states.should_auto_schedule", true)
      .is("deleted_at", null)
      .is("parent_task_id", null) // Only parent tasks
      .order("deadline", { ascending: true, nullsFirst: false });

    if (error) {
      return failure(error.message);
    }

    const tasks = (data || []).map((row) => this.transformTask(row as TaskRow));
    const dependencyIds = tasks
      .map((task) => task.dependsOnTaskId)
      .filter((id): id is string => !!id);

    if (dependencyIds.length === 0) {
      return success(tasks);
    }

    const { data: dependencyRows } = await this.supabase
      .from("tasks")
      .select(
        `
        id,
        workflow_states (
          is_terminal
        )
      `
      )
      .in("id", dependencyIds)
      .eq("user_id", this.userId)
      .is("deleted_at", null);

    const resolvedDependencyIds = new Set(
      (dependencyRows || [])
        .filter((row) => {
          const state = (row as Record<string, unknown>)
            .workflow_states as Record<string, unknown> | null;
          return !!state && state.is_terminal === true;
        })
        .map((row) => (row as Record<string, unknown>).id as string)
    );

    return success(
      tasks.filter(
        (task) =>
          !task.dependsOnTaskId ||
          resolvedDependencyIds.has(task.dependsOnTaskId)
      )
    );
  }

  /**
   * Bulk update task schedules (used by scheduling engine)
   */
  async updateTaskSchedules(
    schedules: Array<{
      id: string;
      scheduledStart: string;
      scheduledEnd: string;
    }>
  ): Promise<ApiResponse<number>> {
    let updated = 0;

    for (const schedule of schedules) {
      const { error } = await this.supabase
        .from("tasks")
        .update({
          is_scheduled: true,
          scheduled_start: schedule.scheduledStart,
          scheduled_end: schedule.scheduledEnd,
        })
        .eq("id", schedule.id)
        .eq("user_id", this.userId);

      if (!error) {
        updated++;
      }
    }

    return success(updated);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTaskService(
  supabase: import("./base.service").AnySupabaseClient,
  userId: string
): TaskService {
  return new TaskService(supabase, userId);
}
