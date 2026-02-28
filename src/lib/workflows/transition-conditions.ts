export interface TransitionConditionInput {
  conditionType:
    | "deadline_within"
    | "overdue"
    | "time_in_state"
    | "manual"
    | "task_completed"
    | "scheduled_time_passed";
  conditionValue: Record<string, unknown> | null;
  task: {
    id: string;
    deadline: string | null;
    scheduledEnd: string | null;
    workflowStateId: string | null;
    createdAt: string;
  };
  now: Date;
  transitionedAt?: Date;
  terminalStateIds?: Set<string>;
  completedParentIds?: Set<string>;
}

export function getConditionHours(conditionValue: Record<string, unknown> | null): number {
  if (!conditionValue) return 24;
  const hours = conditionValue.hours;
  if (typeof hours === "number" && Number.isFinite(hours)) {
    return hours;
  }
  const days = conditionValue.days;
  if (typeof days === "number" && Number.isFinite(days)) {
    return days * 24;
  }
  return 24;
}

export function evaluateTransitionCondition(input: TransitionConditionInput): boolean {
  const {
    conditionType,
    conditionValue,
    task,
    now,
    transitionedAt,
    terminalStateIds = new Set<string>(),
    completedParentIds = new Set<string>(),
  } = input;

  switch (conditionType) {
    case "manual":
      return false;
    case "overdue":
      return !!task.deadline && new Date(task.deadline).getTime() < now.getTime();
    case "deadline_within": {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const diffMs = deadline.getTime() - now.getTime();
      if (diffMs < 0) return false;
      const hours = getConditionHours(conditionValue);
      return diffMs <= hours * 60 * 60 * 1000;
    }
    case "time_in_state": {
      const since = transitionedAt ?? new Date(task.createdAt);
      const hoursInState = (now.getTime() - since.getTime()) / (60 * 60 * 1000);
      const threshold = getConditionHours(conditionValue);
      return hoursInState >= threshold;
    }
    case "task_completed":
      return (
        completedParentIds.has(task.id) ||
        (task.workflowStateId ? terminalStateIds.has(task.workflowStateId) : false)
      );
    case "scheduled_time_passed":
      return !!task.scheduledEnd && new Date(task.scheduledEnd).getTime() <= now.getTime();
    default:
      return false;
  }
}

