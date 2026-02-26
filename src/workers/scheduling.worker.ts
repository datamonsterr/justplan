/**
 * Scheduling Worker
 * Background job processor for automatic task scheduling
 * 
 * To run this worker:
 * 1. Ensure REDIS_URL is set in .env
 * 2. Run: tsx watch src/workers/scheduling.worker.ts
 */

import { createWorker } from "@/lib/redis/worker";
import { Job } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import {
  runSchedulingEngine,
  SchedulingContext,
  SchedulingTask,
  CalendarEvent,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/scheduling";
import type { Database } from "@/types/database.types";

// Initialize Supabase client for worker
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Job data interface
export interface SchedulingJobData {
  userId: string;
  taskIds?: string[]; // Optional: specific tasks to schedule
  schedulingWindowDays?: number;
  optimizeExisting?: boolean; // Re-optimize all scheduled tasks
}

// Job result interface
export interface SchedulingJobResult {
  success: boolean;
  scheduled: number;
  unscheduled: number;
  warnings: string[];
  stats: {
    totalTasksProcessed: number;
    tasksScheduled: number;
    tasksSkipped: number;
    totalScheduledMinutes: number;
    utilizationPercent: number;
  };
}

/**
 * Fetch tasks for scheduling
 */
async function fetchTasks(
  userId: string,
  taskIds?: string[]
): Promise<SchedulingTask[]> {
  // First, get tasks
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .is("completed_at", null);

  if (taskIds && taskIds.length > 0) {
    query = query.in("id", taskIds);
  }

  const { data: tasksData, error: tasksError } = await query;

  if (tasksError) {
    throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
  }

  // Get workflow states for priority boost info
  const { data: statesData } = await supabase
    .from("workflow_states")
    .select("id, exclude_from_scheduling, scheduling_priority_boost")
    .eq("user_id", userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statesMap = new Map<string, any>(
    ((statesData as unknown as any[]) || []).map((s) => [s.id, s])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tasksData as any[] || []).map((task) => {
    const state = statesMap.get(task.workflow_state_id);
    return {
      id: task.id,
      title: task.title,
      estimatedDuration: task.estimated_duration,
      deadline: task.deadline ? new Date(task.deadline) : null,
      priority: task.priority as SchedulingTask["priority"],
      workflowStateId: task.workflow_state_id,
      scheduledStartTime: task.scheduled_start_time
        ? new Date(task.scheduled_start_time)
        : null,
      scheduledEndTime: task.scheduled_end_time
        ? new Date(task.scheduled_end_time)
        : null,
      parentTaskId: task.parent_task_id,
      stateExcludeFromScheduling: state?.exclude_from_scheduling ?? false,
      statePriorityBoost: state?.scheduling_priority_boost ?? 0,
    };
  });
}

/**
 * Fetch calendar events for a user
 */
async function fetchCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data, error } = await supabase
    .from("google_calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("end_time", new Date().toISOString())
    .lte("start_time", thirtyDaysFromNow.toISOString());

  if (error) {
    // Calendar events table might not exist yet - return empty
    console.warn(`Failed to fetch calendar events: ${error.message}`);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] || []).map((event) => ({
    id: event.id,
    title: event.summary || event.title || "Busy",
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    isAllDay: event.is_all_day || false,
    source: "google_calendar" as const,
  }));
}

/**
 * Fetch user preferences
 */
async function fetchUserPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Return defaults if no settings found
    return DEFAULT_PREFERENCES;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = data as any;
  return {
    workingHoursStart: settings.working_hours_start || DEFAULT_PREFERENCES.workingHoursStart,
    workingHoursEnd: settings.working_hours_end || DEFAULT_PREFERENCES.workingHoursEnd,
    workingDays: settings.working_days || DEFAULT_PREFERENCES.workingDays,
    defaultTaskDuration:
      settings.default_task_duration || DEFAULT_PREFERENCES.defaultTaskDuration,
    breakBetweenTasks: DEFAULT_PREFERENCES.breakBetweenTasks,
    preferredFocusHours: DEFAULT_PREFERENCES.preferredFocusHours,
    timezone: settings.timezone || DEFAULT_PREFERENCES.timezone,
  };
}

/**
 * Update task schedules in database
 */
async function updateTaskSchedules(
  scheduledTasks: Array<{ taskId: string; start: Date; end: Date }>
): Promise<void> {
  for (const task of scheduledTasks) {
    const updatePayload = {
      scheduled_start_time: task.start.toISOString(),
      scheduled_end_time: task.end.toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("tasks") as any)
      .update(updatePayload)
      .eq("id", task.taskId);

    if (error) {
      console.error(`Failed to update task ${task.taskId}:`, error.message);
    }
  }
}

/**
 * Scheduling job processor
 */
async function processSchedulingJob(
  job: Job<SchedulingJobData>
): Promise<SchedulingJobResult> {
  const {
    userId,
    taskIds,
    schedulingWindowDays = 14,
    optimizeExisting = false,
  } = job.data;

  console.log(`📅 Processing scheduling job ${job.id}`);
  console.log(`   User: ${userId}`);
  console.log(`   Window: ${schedulingWindowDays} days`);
  if (taskIds) console.log(`   Specific tasks: ${taskIds.length}`);

  await job.updateProgress(10);

  try {
    // 1. Fetch data in parallel
    const [tasks, events, preferences] = await Promise.all([
      fetchTasks(userId, taskIds),
      fetchCalendarEvents(userId),
      fetchUserPreferences(userId),
    ]);

    console.log(`   Found ${tasks.length} tasks, ${events.length} events`);
    await job.updateProgress(30);

    // 2. Prepare scheduling context
    const context: SchedulingContext = {
      tasks: optimizeExisting
        ? tasks.map((t) => ({ ...t, scheduledStartTime: null, scheduledEndTime: null }))
        : tasks,
      existingEvents: events,
      preferences,
      schedulingWindowDays,
      now: new Date(),
    };

    // 3. Run scheduling algorithm
    const result = runSchedulingEngine(context);
    await job.updateProgress(70);

    // 4. Update database with new schedules
    if (result.scheduledTasks.length > 0) {
      await updateTaskSchedules(
        result.scheduledTasks.map((t) => ({
          taskId: t.taskId,
          start: t.start,
          end: t.end,
        }))
      );
    }
    await job.updateProgress(90);

    // 5. Log warnings
    if (result.warnings.length > 0) {
      console.log(`   Warnings: ${result.warnings.join(", ")}`);
    }

    await job.updateProgress(100);

    return {
      success: true,
      scheduled: result.scheduledTasks.length,
      unscheduled: result.unscheduledTasks.length,
      warnings: result.warnings,
      stats: result.stats,
    };
  } catch (error) {
    console.error(`❌ Scheduling job ${job.id} failed:`, error);

    return {
      success: false,
      scheduled: 0,
      unscheduled: 0,
      warnings: [error instanceof Error ? error.message : "Unknown error"],
      stats: {
        totalTasksProcessed: 0,
        tasksScheduled: 0,
        tasksSkipped: 0,
        totalScheduledMinutes: 0,
        utilizationPercent: 0,
      },
    };
  }
}

// Create the worker
const schedulingWorker = createWorker<SchedulingJobData, SchedulingJobResult>(
  "scheduling",
  processSchedulingJob,
  {
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 60000,
    },
  }
);

// Event handlers
schedulingWorker.on("completed", (job, result) => {
  console.log(`✅ Scheduling job ${job.id} completed`);
  console.log(`   Scheduled: ${result.scheduled} tasks`);
  if (result.unscheduled > 0) {
    console.log(`   Could not schedule: ${result.unscheduled} tasks`);
  }
  console.log(`   Utilization: ${result.stats.utilizationPercent}%`);
});

schedulingWorker.on("failed", (job, error) => {
  console.error(`❌ Scheduling job ${job?.id} failed:`, error.message);
});

schedulingWorker.on("progress", (job, progress) => {
  console.log(`⏳ Scheduling job ${job.id} progress: ${progress}%`);
});

schedulingWorker.on("error", (error) => {
  console.error("❌ Scheduling worker error:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down scheduling worker...");
  await schedulingWorker.close();
  console.log("✅ Scheduling worker shut down successfully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down scheduling worker...");
  await schedulingWorker.close();
  console.log("✅ Scheduling worker shut down successfully");
  process.exit(0);
});

console.log("🚀 Scheduling worker started");
console.log("   Queue: scheduling");
console.log("   Concurrency: 5");
console.log("   Redis: " + process.env.REDIS_URL?.split("@")[1] || "Local");

export { schedulingWorker };
