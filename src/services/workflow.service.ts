/**
 * Workflow Service - Manage workflow states and transitions
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

type WorkflowStateRow = Database["public"]["Tables"]["workflow_states"]["Row"];

export interface WorkflowState {
  id: string;
  userId: string;
  name: string;
  color: string;
  order: number;
  isTerminal: boolean;
  shouldAutoSchedule: boolean;
  schedulingPriorityBoost: number;
  createdAt: string;
}

export interface WorkflowTransition {
  id: string;
  userId: string;
  fromStateId: string;
  toStateId: string;
  conditionType: TransitionConditionType;
  conditionValue: Record<string, unknown> | null;
  isEnabled: boolean;
  createdAt: string;
  // Populated fields
  fromState?: { id: string; name: string; color: string };
  toState?: { id: string; name: string; color: string };
}

export type TransitionConditionType =
  | "deadline_within"
  | "overdue"
  | "time_in_state"
  | "manual"
  | "task_completed"
  | "scheduled_time_passed";

// ============================================================================
// Zod Schemas
// ============================================================================

export const createWorkflowStateSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .default("#6B7280"),
  order: z.number().int().min(0).default(0),
  isTerminal: z.boolean().default(false),
  shouldAutoSchedule: z.boolean().default(true),
  schedulingPriorityBoost: z.number().int().min(-10).max(10).default(0),
});

export const updateWorkflowStateSchema = createWorkflowStateSchema.partial();

export const createTransitionSchema = z.object({
  fromStateId: z.string().uuid("Invalid from state ID"),
  toStateId: z.string().uuid("Invalid to state ID"),
  conditionType: z.enum([
    "deadline_within",
    "overdue",
    "time_in_state",
    "manual",
    "task_completed",
    "scheduled_time_passed",
  ]),
  conditionValue: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().default(true),
});

export const updateTransitionSchema = createTransitionSchema.partial().extend({
  isEnabled: z.boolean().optional(),
});

export type CreateWorkflowStateInput = z.infer<typeof createWorkflowStateSchema>;
export type UpdateWorkflowStateInput = z.infer<typeof updateWorkflowStateSchema>;
export type CreateTransitionInput = z.infer<typeof createTransitionSchema>;
export type UpdateTransitionInput = z.infer<typeof updateTransitionSchema>;

// ============================================================================
// Workflow Service
// ============================================================================

export class WorkflowService extends BaseService {
  /**
   * Transform database row to WorkflowState interface
   */
  private transformState(row: WorkflowStateRow): WorkflowState {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      order: row.order,
      isTerminal: row.is_terminal,
      shouldAutoSchedule: row.should_auto_schedule,
      schedulingPriorityBoost: row.scheduling_priority_boost,
      createdAt: row.created_at,
    };
  }

  /**
   * Transform transition row
   */
  private transformTransition(row: Record<string, unknown>): WorkflowTransition {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      fromStateId: row.from_state_id as string,
      toStateId: row.to_state_id as string,
      conditionType: row.condition_type as TransitionConditionType,
      conditionValue: row.condition_value as Record<string, unknown> | null,
      isEnabled: row.is_enabled as boolean,
      createdAt: row.created_at as string,
      fromState: row.from_state as { id: string; name: string; color: string } | undefined,
      toState: row.to_state as { id: string; name: string; color: string } | undefined,
    };
  }

  // ==========================================================================
  // Workflow States
  // ==========================================================================

  /**
   * Get all workflow states for the user (ordered)
   */
  async getAllStates(): Promise<ApiResponse<WorkflowState[]>> {
    const { data, error } = await this.supabase
      .from("workflow_states")
      .select("*")
      .eq("user_id", this.userId)
      .order("order", { ascending: true });

    if (error) {
      return failure(error.message);
    }

    return success((data || []).map((row) => this.transformState(row)));
  }

  /**
   * Get a single workflow state by ID
   */
  async getStateById(id: string): Promise<ApiResponse<WorkflowState>> {
    const validation = validateInput(uuidSchema, id);
    if (!validation.success) {
      return failure(validation.error!);
    }

    const { data, error } = await this.supabase
      .from("workflow_states")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .single();

    if (error) {
      return failure(error.message);
    }

    return success(this.transformState(data));
  }

  /**
   * Create a new workflow state
   */
  async createState(input: CreateWorkflowStateInput): Promise<ApiResponse<WorkflowState>> {
    const validation = validateInput(createWorkflowStateSchema, input);
    if (!validation.success) {
      return failure(validation.error!);
    }

    // Check max states limit (10)
    const countResult = await this.getAllStates();
    if (countResult.success && countResult.data.length >= 10) {
      return failure("Maximum 10 workflow states allowed");
    }

    const { data, error } = await this.supabase
      .from("workflow_states")
      .insert({
        user_id: this.userId,
        name: input.name,
        color: input.color,
        order: input.order,
        is_terminal: input.isTerminal,
        should_auto_schedule: input.shouldAutoSchedule,
        scheduling_priority_boost: input.schedulingPriorityBoost,
      })
      .select()
      .single();

    if (error) {
      return failure(error.message);
    }

    return success(this.transformState(data));
  }

  /**
   * Update an existing workflow state
   */
  async updateState(
    id: string,
    input: UpdateWorkflowStateInput
  ): Promise<ApiResponse<WorkflowState>> {
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return failure(idValidation.error!);
    }

    const validation = validateInput(updateWorkflowStateSchema, input);
    if (!validation.success) {
      return failure(validation.error!);
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.order !== undefined) updateData.order = input.order;
    if (input.isTerminal !== undefined) updateData.is_terminal = input.isTerminal;
    if (input.shouldAutoSchedule !== undefined)
      updateData.should_auto_schedule = input.shouldAutoSchedule;
    if (input.schedulingPriorityBoost !== undefined)
      updateData.scheduling_priority_boost = input.schedulingPriorityBoost;

    const { data, error } = await this.supabase
      .from("workflow_states")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", this.userId)
      .select()
      .single();

    if (error) {
      return failure(error.message);
    }

    return success(this.transformState(data));
  }

  /**
   * Delete a workflow state (with safety check)
   */
  async deleteState(id: string): Promise<ApiResponse<{ id: string }>> {
    const validation = validateInput(uuidSchema, id);
    if (!validation.success) {
      return failure(validation.error!);
    }

    // Check if any tasks use this state
    const { count } = await this.supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("workflow_state_id", id)
      .eq("user_id", this.userId)
      .is("deleted_at", null);

    if (count && count > 0) {
      return failure(
        `Cannot delete: ${count} task(s) still use this workflow state. Move tasks to another state first.`
      );
    }

    // Delete transitions involving this state
    await this.supabase
      .from("workflow_transitions")
      .delete()
      .or(`from_state_id.eq.${id},to_state_id.eq.${id}`)
      .eq("user_id", this.userId);

    // Delete the state
    const { error } = await this.supabase
      .from("workflow_states")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) {
      return failure(error.message);
    }

    return success({ id });
  }

  /**
   * Reorder workflow states
   */
  async reorderStates(orderedIds: string[]): Promise<ApiResponse<WorkflowState[]>> {
    if (orderedIds.length === 0) {
      return failure("stateIds is required");
    }

    const { data: existingStates, error: existingError } = await this.supabase
      .from("workflow_states")
      .select("id")
      .eq("user_id", this.userId);

    if (existingError) {
      return failure(existingError.message);
    }

    const existingIds = new Set((existingStates || []).map((state) => state.id));
    const uniqueOrderedIds = new Set(orderedIds);
    if (uniqueOrderedIds.size !== orderedIds.length) {
      return failure("stateIds must not contain duplicates");
    }
    if (orderedIds.length !== existingIds.size) {
      return failure("stateIds must include all workflow state IDs");
    }
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        return failure(`Invalid state ID in reorder payload: ${id}`);
      }
    }

    // Update order for each state
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await this.supabase
        .from("workflow_states")
        .update({ order: i })
        .eq("id", orderedIds[i])
        .eq("user_id", this.userId);

      if (error) {
        return failure(error.message);
      }
    }

    return this.getAllStates();
  }

  // ==========================================================================
  // Workflow Transitions
  // ==========================================================================

  /**
   * Get all transitions for the user
   */
  async getAllTransitions(): Promise<ApiResponse<WorkflowTransition[]>> {
    const { data, error } = await this.supabase
      .from("workflow_transitions")
      .select(`
        *,
        from_state:workflow_states!from_state_id (id, name, color),
        to_state:workflow_states!to_state_id (id, name, color)
      `)
      .eq("user_id", this.userId)
      .order("created_at", { ascending: true });

    if (error) {
      return failure(error.message);
    }

    return success(
      (data || []).map((row) =>
        this.transformTransition(row as Record<string, unknown>)
      )
    );
  }

  /**
   * Create a transition rule
   */
  async createTransition(
    input: CreateTransitionInput
  ): Promise<ApiResponse<WorkflowTransition>> {
    const validation = validateInput(createTransitionSchema, input);
    if (!validation.success) {
      return failure(validation.error!);
    }

    // Verify both states belong to user
    const fromState = await this.getStateById(input.fromStateId);
    const toState = await this.getStateById(input.toStateId);

    if (!fromState.success || !toState.success) {
      return failure("Invalid state IDs");
    }

    // Check for duplicate transition
    const { data: existing } = await this.supabase
      .from("workflow_transitions")
      .select("id")
      .eq("user_id", this.userId)
      .eq("from_state_id", input.fromStateId)
      .eq("to_state_id", input.toStateId)
      .eq("condition_type", input.conditionType)
      .maybeSingle();

    if (existing) {
      return failure("Transition rule already exists");
    }

    const { data, error } = await this.supabase
      .from("workflow_transitions")
      .insert({
        user_id: this.userId,
        from_state_id: input.fromStateId,
        to_state_id: input.toStateId,
        condition_type: input.conditionType,
        condition_value: input.conditionValue ?? null,
        is_enabled: input.isEnabled,
      })
      .select(`
        *,
        from_state:workflow_states!from_state_id (id, name, color),
        to_state:workflow_states!to_state_id (id, name, color)
      `)
      .single();

    if (error) {
      return failure(error.message);
    }

    return success(this.transformTransition(data as Record<string, unknown>));
  }

  /**
   * Update a transition rule
   */
  async updateTransition(
    id: string,
    input: UpdateTransitionInput
  ): Promise<ApiResponse<WorkflowTransition>> {
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return failure(idValidation.error!);
    }

    const validation = validateInput(updateTransitionSchema, input);
    if (!validation.success) {
      return failure(validation.error!);
    }

    const updateData: Record<string, unknown> = {};
    if (input.fromStateId !== undefined) updateData.from_state_id = input.fromStateId;
    if (input.toStateId !== undefined) updateData.to_state_id = input.toStateId;
    if (input.conditionType !== undefined) updateData.condition_type = input.conditionType;
    if (input.conditionValue !== undefined) updateData.condition_value = input.conditionValue;
    if (input.isEnabled !== undefined) updateData.is_enabled = input.isEnabled;

    const { data, error } = await this.supabase
      .from("workflow_transitions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", this.userId)
      .select(`
        *,
        from_state:workflow_states!from_state_id (id, name, color),
        to_state:workflow_states!to_state_id (id, name, color)
      `)
      .single();

    if (error) {
      return failure(error.message);
    }

    return success(this.transformTransition(data as Record<string, unknown>));
  }

  /**
   * Delete a transition rule
   */
  async deleteTransition(id: string): Promise<ApiResponse<{ id: string }>> {
    const validation = validateInput(uuidSchema, id);
    if (!validation.success) {
      return failure(validation.error!);
    }

    const { error } = await this.supabase
      .from("workflow_transitions")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) {
      return failure(error.message);
    }

    return success({ id });
  }

  /**
   * Get workflow configuration for React Flow visualization
   */
  async getWorkflowGraph(): Promise<
    ApiResponse<{
      nodes: Array<{
        id: string;
        type: "stateNode";
        data: {
          id: string;
          name: string;
          color: string;
          order: number;
          isDefault: boolean;
          isTerminal: boolean;
          excludeFromScheduling: boolean;
          schedulingPriorityBoost: number;
        };
        position: { x: number; y: number };
      }>;
      edges: Array<{
        id: string;
        type: "transitionEdge";
        source: string;
        target: string;
        data: {
          conditionType: string;
          conditionValue: unknown;
          isEnabled: boolean;
        };
      }>;
    }>
  > {
    const statesResult = await this.getAllStates();
    if (!statesResult.success) {
      return failure(statesResult.error!);
    }

    const transitionsResult = await this.getAllTransitions();
    if (!transitionsResult.success) {
      return failure(transitionsResult.error!);
    }

    const states = statesResult.data;
    const transitions = transitionsResult.data;

    // Generate node positions (circular layout)
    const nodeCount = states.length;
    const radius = 200;
    const centerX = 300;
    const centerY = 250;

    const nodes = states.map((state, index) => {
      const angle = (2 * Math.PI * index) / nodeCount - Math.PI / 2;
      return {
        id: state.id,
        type: "stateNode",
        data: {
          id: state.id,
          name: state.name,
          color: state.color,
          order: state.order,
          isDefault: state.order === 0,
          isTerminal: state.isTerminal,
          excludeFromScheduling: !state.shouldAutoSchedule,
          schedulingPriorityBoost: state.schedulingPriorityBoost,
        },
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });

    const edges = transitions.map((transition) => ({
      id: transition.id,
      type: "transitionEdge",
      source: transition.fromStateId,
      target: transition.toStateId,
      data: {
        conditionType: transition.conditionType,
        conditionValue: transition.conditionValue,
        isEnabled: transition.isEnabled,
      },
    }));

    return success({ nodes, edges });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createWorkflowService(
  supabase: import("./base.service").AnySupabaseClient,
  userId: string
): WorkflowService {
  return new WorkflowService(supabase, userId);
}
