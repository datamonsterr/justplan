/**
 * Priority Calculator
 * Scores and ranks tasks for scheduling order
 */

import {
  SchedulingTask,
  PriorityScore,
  PRIORITY_WEIGHTS,
} from "./types";

/**
 * Calculate priority score for a task
 * Higher score = higher priority = should be scheduled first
 */
export function calculatePriorityScore(
  task: SchedulingTask,
  now: Date = new Date()
): PriorityScore {
  const factors = {
    basePriority: getBasePriorityScore(task.priority),
    deadlineUrgency: getDeadlineUrgencyScore(task.deadline, now),
    stateBoost: getStateBoostScore(task.statePriorityBoost),
    dependencyFactor: getDependencyFactor(task),
  };

  // Combine factors with weights
  const score =
    factors.basePriority +
    factors.deadlineUrgency +
    factors.stateBoost +
    factors.dependencyFactor;

  return {
    taskId: task.id,
    score: Math.max(0, Math.round(score)), // Clamp to non-negative
    factors,
  };
}

/**
 * Rank tasks by priority score
 * Returns tasks sorted by priority (highest first)
 */
export function rankTasks(
  tasks: SchedulingTask[],
  now: Date = new Date()
): Array<SchedulingTask & { priorityScore: PriorityScore }> {
  // Filter out tasks that shouldn't be scheduled
  const schedulableTasks = tasks.filter((task) => {
    // Skip tasks in excluded states
    if (task.stateExcludeFromScheduling) return false;
    
    // Skip tasks that are already scheduled
    if (task.scheduledStartTime) return false;
    
    return true;
  });

  // Calculate scores
  const scoredTasks = schedulableTasks.map((task) => ({
    ...task,
    priorityScore: calculatePriorityScore(task, now),
  }));

  // Sort by score (highest first)
  scoredTasks.sort((a, b) => b.priorityScore.score - a.priorityScore.score);

  return scoredTasks;
}

/**
 * Get base priority score from priority level
 */
function getBasePriorityScore(priority: SchedulingTask["priority"]): number {
  return PRIORITY_WEIGHTS.base[priority] || PRIORITY_WEIGHTS.base.medium;
}

/**
 * Get urgency score based on deadline proximity
 */
function getDeadlineUrgencyScore(deadline: Date | null, now: Date): number {
  if (!deadline) {
    return PRIORITY_WEIGHTS.deadlineUrgency.noDeadline;
  }

  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDeadline < 0) {
    // Overdue - highest urgency
    return PRIORITY_WEIGHTS.deadlineUrgency.overdue;
  } else if (hoursUntilDeadline <= 24) {
    // Within 24 hours
    return PRIORITY_WEIGHTS.deadlineUrgency.within24h;
  } else if (hoursUntilDeadline <= 48) {
    // Within 48 hours
    return PRIORITY_WEIGHTS.deadlineUrgency.within48h;
  } else if (hoursUntilDeadline <= 168) {
    // Within 7 days (168 hours)
    return PRIORITY_WEIGHTS.deadlineUrgency.within7d;
  }

  // More than 7 days away - no urgency bonus
  return 0;
}

/**
 * Get priority boost/penalty from workflow state
 */
function getStateBoostScore(boost?: number): number {
  if (!boost) return 0;
  
  // Clamp to max boost range
  return Math.max(
    -PRIORITY_WEIGHTS.maxStateBoost,
    Math.min(PRIORITY_WEIGHTS.maxStateBoost, boost)
  );
}

/**
 * Get factor for dependent tasks
 * Subtasks/dependent tasks get slight boost
 */
function getDependencyFactor(task: SchedulingTask): number {
  // Subtasks should be scheduled after parent, so no boost
  if (task.parentTaskId) {
    return -5;
  }
  
  return 0;
}

/**
 * Check if a task is urgent (needs immediate attention)
 */
export function isUrgentTask(task: SchedulingTask, now: Date = new Date()): boolean {
  const score = calculatePriorityScore(task, now);
  return score.score >= 150; // Threshold for urgency
}

/**
 * Check if a task is overdue
 */
export function isOverdue(task: SchedulingTask, now: Date = new Date()): boolean {
  return task.deadline !== null && task.deadline < now;
}

/**
 * Get human-readable priority explanation
 */
export function explainPriority(score: PriorityScore): string {
  const parts: string[] = [];

  if (score.factors.basePriority >= 60) {
    parts.push("High priority task");
  } else if (score.factors.basePriority >= 30) {
    parts.push("Medium priority task");
  } else {
    parts.push("Low priority task");
  }

  if (score.factors.deadlineUrgency >= 100) {
    parts.push("deadline is very soon");
  } else if (score.factors.deadlineUrgency >= 50) {
    parts.push("deadline is approaching");
  } else if (score.factors.deadlineUrgency >= 20) {
    parts.push("deadline within a week");
  }

  if (score.factors.stateBoost > 0) {
    parts.push(`workflow state adds +${score.factors.stateBoost} priority`);
  } else if (score.factors.stateBoost < 0) {
    parts.push(`workflow state reduces priority by ${Math.abs(score.factors.stateBoost)}`);
  }

  return parts.join(", ");
}

/**
 * Group tasks by urgency level
 */
export function groupByUrgency(
  tasks: Array<SchedulingTask & { priorityScore: PriorityScore }>
): {
  critical: typeof tasks;
  urgent: typeof tasks;
  normal: typeof tasks;
  low: typeof tasks;
} {
  return {
    critical: tasks.filter((t) => t.priorityScore.score >= 200),
    urgent: tasks.filter((t) => t.priorityScore.score >= 100 && t.priorityScore.score < 200),
    normal: tasks.filter((t) => t.priorityScore.score >= 30 && t.priorityScore.score < 100),
    low: tasks.filter((t) => t.priorityScore.score < 30),
  };
}
