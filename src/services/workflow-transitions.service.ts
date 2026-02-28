import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateTransitionCondition } from "@/lib/workflows/transition-conditions";

export interface WorkflowTransitionJobData {
  userId: string;
  taskIds?: string[];
}

export interface WorkflowTransitionJobResult {
  success: boolean;
  evaluated: number;
  transitioned: number;
  errors: string[];
}

interface WorkflowTransitionRow {
  id: string;
  from_state_id: string;
  to_state_id: string;
  condition_type:
    | "deadline_within"
    | "overdue"
    | "time_in_state"
    | "manual"
    | "task_completed"
    | "scheduled_time_passed";
  condition_value: Record<string, unknown> | null;
  created_at: string;
}

interface WorkflowTaskRow {
  id: string;
  workflow_state_id: string | null;
  deadline: string | null;
  scheduled_end: string | null;
  created_at: string;
}

export async function queueWorkflowTransitionEvaluation(
  input: WorkflowTransitionJobData
) {
  const { workflowTransitionsQueue } = await import("@/lib/redis/queue");
  const job = await workflowTransitionsQueue.add(
    "evaluate-transitions",
    input,
    {
      priority: 5,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );

  return { jobId: job.id! };
}

export async function evaluateWorkflowTransitions(
  input: WorkflowTransitionJobData
): Promise<WorkflowTransitionJobResult> {
  const supabase = createAdminClient();
  const now = new Date();
  const result: WorkflowTransitionJobResult = {
    success: true,
    evaluated: 0,
    transitioned: 0,
    errors: [],
  };

  const { data: stateRows, error: stateError } = await supabase
    .from("workflow_states")
    .select("id, is_terminal")
    .eq("user_id", input.userId);

  if (stateError) {
    return {
      success: false,
      evaluated: 0,
      transitioned: 0,
      errors: [stateError.message],
    };
  }

  const terminalStateIds = new Set(
    (stateRows || []).filter((row) => row.is_terminal).map((row) => row.id)
  );

  const { data: transitionsData, error: transitionsError } = await supabase
    .from("workflow_transitions")
    .select(
      "id, from_state_id, to_state_id, condition_type, condition_value, created_at"
    )
    .eq("user_id", input.userId)
    .eq("is_enabled", true)
    .order("created_at", { ascending: true });

  if (transitionsError) {
    return {
      success: false,
      evaluated: 0,
      transitioned: 0,
      errors: [transitionsError.message],
    };
  }

  const transitionsByFromState = new Map<string, WorkflowTransitionRow[]>();
  for (const row of (transitionsData || []) as WorkflowTransitionRow[]) {
    if (!transitionsByFromState.has(row.from_state_id)) {
      transitionsByFromState.set(row.from_state_id, []);
    }
    transitionsByFromState.get(row.from_state_id)!.push(row);
  }

  let taskQuery = supabase
    .from("tasks")
    .select("id, workflow_state_id, deadline, scheduled_end, created_at")
    .eq("user_id", input.userId)
    .is("deleted_at", null);

  if (input.taskIds && input.taskIds.length > 0) {
    taskQuery = taskQuery.in("id", input.taskIds);
  }

  const { data: tasksData, error: tasksError } = await taskQuery;
  if (tasksError) {
    return {
      success: false,
      evaluated: 0,
      transitioned: 0,
      errors: [tasksError.message],
    };
  }

  const tasks = (tasksData || []) as WorkflowTaskRow[];
  if (tasks.length === 0) {
    return result;
  }

  const taskIds = tasks.map((task) => task.id);
  const { data: historyRows } = await supabase
    .from("task_state_history")
    .select("task_id, transitioned_at")
    .in("task_id", taskIds)
    .order("transitioned_at", { ascending: false });

  const transitionedAtMap = new Map<string, Date>();
  for (const row of historyRows || []) {
    const taskId = (row as Record<string, unknown>).task_id as string;
    if (!transitionedAtMap.has(taskId)) {
      transitionedAtMap.set(
        taskId,
        new Date((row as Record<string, unknown>).transitioned_at as string)
      );
    }
  }

  const { data: subtasksRows } = await supabase
    .from("tasks")
    .select(
      `
      parent_task_id,
      workflow_state_id,
      workflow_states (
        is_terminal
      )
    `
    )
    .eq("user_id", input.userId)
    .is("deleted_at", null)
    .not("parent_task_id", "is", null);

  const completedSubtaskByParent = new Map<
    string,
    { total: number; done: number }
  >();
  for (const row of subtasksRows || []) {
    const parentId = (row as Record<string, unknown>).parent_task_id as
      | string
      | null;
    if (!parentId) continue;
    const current = completedSubtaskByParent.get(parentId) ?? {
      total: 0,
      done: 0,
    };
    current.total += 1;
    const state = (row as Record<string, unknown>).workflow_states as Record<
      string,
      unknown
    > | null;
    if (state?.is_terminal === true) {
      current.done += 1;
    }
    completedSubtaskByParent.set(parentId, current);
  }

  const completedParentIds = new Set(
    Array.from(completedSubtaskByParent.entries())
      .filter(([, value]) => value.total > 0 && value.done === value.total)
      .map(([parentId]) => parentId)
  );

  for (const task of tasks) {
    if (!task.workflow_state_id) continue;
    const transitions =
      transitionsByFromState.get(task.workflow_state_id) || [];
    if (transitions.length === 0) continue;

    result.evaluated += 1;

    for (const transition of transitions) {
      const passes = evaluateTransitionCondition({
        conditionType: transition.condition_type,
        conditionValue: transition.condition_value,
        task: {
          id: task.id,
          deadline: task.deadline,
          scheduledEnd: task.scheduled_end,
          workflowStateId: task.workflow_state_id,
          createdAt: task.created_at,
        },
        now,
        transitionedAt: transitionedAtMap.get(task.id),
        terminalStateIds,
        completedParentIds,
      });

      if (!passes) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          workflow_state_id: transition.to_state_id,
          updated_at: now.toISOString(),
        })
        .eq("id", task.id)
        .eq("user_id", input.userId);

      if (updateError) {
        result.errors.push(updateError.message);
        break;
      }

      const { error: historyInsertError } = await supabase
        .from("task_state_history")
        .insert({
          task_id: task.id,
          from_state_id: transition.from_state_id,
          to_state_id: transition.to_state_id,
          trigger_type: "automatic",
          transition_rule_id: transition.id,
          transitioned_at: now.toISOString(),
        });

      if (historyInsertError) {
        result.errors.push(historyInsertError.message);
      }

      transitionedAtMap.set(task.id, now);
      result.transitioned += 1;
      break;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}
