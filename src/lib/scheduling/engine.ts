/**
 * Scheduling Engine
 * Core algorithm for automatic task scheduling
 * 
 * Uses a greedy algorithm:
 * 1. Rank tasks by priority score
 * 2. Calculate available time slots
 * 3. For each task (highest priority first):
 *    - Find best available slot
 *    - Assign task to slot
 *    - Update availability
 */

import {
  SchedulingContext,
  SchedulingResult,
  ScheduledBlock,
  TimeSlot,
  DEFAULT_PREFERENCES,
} from "./types";
import {
  calculateAvailability,
  findBestSlot,
  mergeAdjacentSlots,
  getTotalAvailableMinutes,
} from "./availability";
import { rankTasks, isOverdue } from "./priority";

/**
 * Run the scheduling algorithm
 * Schedules unscheduled tasks into available time slots
 */
export function runSchedulingEngine(context: SchedulingContext): SchedulingResult {
  const {
    tasks,
    existingEvents,
    preferences = DEFAULT_PREFERENCES,
    schedulingWindowDays = 14,
    now,
  } = context;

  const warnings: string[] = [];
  const scheduledTasks: ScheduledBlock[] = [];
  const unscheduledTasks: Array<{ taskId: string; reason: string }> = [];

  // Calculate scheduling window
  const windowStart = new Date(now);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + schedulingWindowDays);

  // Get initial availability
  let availableSlots = calculateAvailability(
    windowStart,
    windowEnd,
    existingEvents,
    preferences
  );

  // Track total available time
  const initialAvailableMinutes = getTotalAvailableMinutes(availableSlots);

  if (initialAvailableMinutes === 0) {
    warnings.push("No available time slots in the scheduling window");
  }

  // Rank tasks by priority
  const rankedTasks = rankTasks(tasks, now);

  // Check for overdue tasks
  const overdueTasks = tasks.filter((t) => isOverdue(t, now));
  if (overdueTasks.length > 0) {
    warnings.push(`${overdueTasks.length} task(s) are overdue`);
  }

  // Schedule each task
  for (const task of rankedTasks) {
    // Determine task duration
    const duration = task.estimatedDuration || preferences.defaultTaskDuration;

    // Find best available slot
    const bestSlot = findBestSlot(
      duration,
      availableSlots,
      preferences,
      task.deadline || undefined
    );

    if (!bestSlot) {
      unscheduledTasks.push({
        taskId: task.id,
        reason: `No available ${duration}min slot before deadline`,
      });
      continue;
    }

    // Check if deadline constraint is satisfied
    if (task.deadline && bestSlot.end > task.deadline) {
      warnings.push(
        `Task "${task.title}" scheduled ${formatTimeDiff(bestSlot.end, task.deadline)} after deadline`
      );
    }

    // Create scheduled block
    const block: ScheduledBlock = {
      taskId: task.id,
      start: bestSlot.start,
      end: bestSlot.end,
      duration,
    };
    scheduledTasks.push(block);

    // Update availability (remove scheduled slot)
    availableSlots = subtractScheduledBlock(availableSlots, block, preferences);
  }

  // Calculate stats
  const totalScheduledMinutes = scheduledTasks.reduce(
    (sum, block) => sum + block.duration,
    0
  );

  return {
    success: true,
    scheduledTasks,
    unscheduledTasks,
    warnings,
    stats: {
      totalTasksProcessed: rankedTasks.length,
      tasksScheduled: scheduledTasks.length,
      tasksSkipped: unscheduledTasks.length,
      totalScheduledMinutes,
      utilizationPercent:
        initialAvailableMinutes > 0
          ? Math.round((totalScheduledMinutes / initialAvailableMinutes) * 100)
          : 0,
    },
  };
}

/**
 * Remove a scheduled block from available slots
 * Also adds break time after the task
 */
function subtractScheduledBlock(
  slots: TimeSlot[],
  block: ScheduledBlock,
  preferences: { breakBetweenTasks: number }
): TimeSlot[] {
  // Create a "busy" slot that includes break time
  const busyEnd = new Date(block.end.getTime() + preferences.breakBetweenTasks * 60 * 1000);
  const busySlot: TimeSlot = { start: block.start, end: busyEnd };

  // Remove this slot from all available slots
  const newSlots: TimeSlot[] = [];

  for (const slot of slots) {
    // No overlap
    if (slot.end <= busySlot.start || slot.start >= busySlot.end) {
      newSlots.push(slot);
      continue;
    }

    // Partial overlap - keep the non-overlapping parts
    if (slot.start < busySlot.start) {
      newSlots.push({
        start: slot.start,
        end: busySlot.start,
      });
    }
    if (slot.end > busySlot.end) {
      newSlots.push({
        start: busySlot.end,
        end: slot.end,
      });
    }
  }

  // Merge and return
  return mergeAdjacentSlots(newSlots);
}

/**
 * Format time difference for warnings
 */
function formatTimeDiff(date1: Date, date2: Date): string {
  const diffMs = date1.getTime() - date2.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMins) < 60) {
    return `${Math.abs(diffMins)} minutes`;
  }

  const diffHours = Math.round(diffMins / 60);
  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)} hours`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${Math.abs(diffDays)} days`;
}

/**
 * Quick utility to schedule a single task
 * Useful for rescheduling or on-demand scheduling
 */
export function scheduleSingleTask(
  taskId: string,
  context: SchedulingContext
): ScheduledBlock | null {
  const task = context.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  // Run scheduler with just this task
  const result = runSchedulingEngine({
    ...context,
    tasks: [task],
  });

  return result.scheduledTasks[0] || null;
}

/**
 * Verify a schedule is still valid
 * Check that scheduled blocks don't conflict with events
 */
export function validateSchedule(
  scheduledTasks: ScheduledBlock[],
  context: SchedulingContext
): {
  valid: boolean;
  conflicts: Array<{
    taskId: string;
    conflictWith: string;
    reason: string;
  }>;
} {
  const conflicts: Array<{
    taskId: string;
    conflictWith: string;
    reason: string;
  }> = [];

  // Check each scheduled task
  for (const block of scheduledTasks) {
    // Check against existing events
    for (const event of context.existingEvents) {
      if (event.isAllDay) {
        const eventDate = new Date(event.start);
        const blockDate = new Date(block.start);
        if (
          eventDate.getFullYear() === blockDate.getFullYear() &&
          eventDate.getMonth() === blockDate.getMonth() &&
          eventDate.getDate() === blockDate.getDate()
        ) {
          conflicts.push({
            taskId: block.taskId,
            conflictWith: event.id,
            reason: `All-day event "${event.title}" on same day`,
          });
        }
      } else if (event.start < block.end && event.end > block.start) {
        conflicts.push({
          taskId: block.taskId,
          conflictWith: event.id,
          reason: `Overlaps with "${event.title}"`,
        });
      }
    }

    // Check working hours
    const blockDay = block.start.getDay();
    if (!context.preferences.workingDays.includes(blockDay)) {
      conflicts.push({
        taskId: block.taskId,
        conflictWith: "working_hours",
        reason: "Scheduled on non-working day",
      });
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Optimize an existing schedule
 * Tries to move tasks to better slots if available
 */
export function optimizeSchedule(context: SchedulingContext): SchedulingResult {
  // Clear all scheduled times and re-run
  const tasksToReschedule = context.tasks.map((task) => ({
    ...task,
    scheduledStartTime: null,
    scheduledEndTime: null,
  }));

  return runSchedulingEngine({
    ...context,
    tasks: tasksToReschedule,
  });
}
