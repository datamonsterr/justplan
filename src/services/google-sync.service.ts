/**
 * Google Sync Service
 * Handles two-way sync between JustPlan and Google Calendar/Tasks
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  fetchAllEvents,
  fetchAllTasks,
  createCalendarEvent,
  updateCalendarEvent,
  createGoogleTask,
  updateGoogleTask,
  type CalendarEvent,
  type GoogleTask,
} from "@/lib/google";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export interface SyncResult {
  success: boolean;
  eventsImported: number;
  eventsExported: number;
  tasksImported: number;
  tasksExported: number;
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  userId: string;
  syncCalendarEvents?: boolean;
  syncGoogleTasks?: boolean;
  daysBack?: number;
  daysForward?: number;
}

/**
 * Perform full sync for a user
 */
export async function performSync(options: SyncOptions): Promise<SyncResult> {
  const startTime = Date.now();
  const {
    userId,
    syncCalendarEvents = true,
    syncGoogleTasks = true,
    daysBack = 7,
    daysForward = 30,
  } = options;

  const result: SyncResult = {
    success: true,
    eventsImported: 0,
    eventsExported: 0,
    tasksImported: 0,
    tasksExported: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Calculate time range
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - daysBack);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + daysForward);

    // Sync calendar events
    if (syncCalendarEvents) {
      try {
        const calendarResult = await syncCalendarEvents_impl(userId, timeMin, timeMax);
        result.eventsImported = calendarResult.imported;
        result.eventsExported = calendarResult.exported;
      } catch (error) {
        result.errors.push(
          `Calendar sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Sync Google Tasks
    if (syncGoogleTasks) {
      try {
        const tasksResult = await syncGoogleTasks_impl(userId, timeMin, timeMax);
        result.tasksImported = tasksResult.imported;
        result.tasksExported = tasksResult.exported;
      } catch (error) {
        result.errors.push(
          `Tasks sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Sync calendar events from Google
 */
async function syncCalendarEvents_impl(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ imported: number; exported: number }> {
  let imported = 0;
  let exported = 0;

  // 1. Import events from Google
  const googleEvents = await fetchAllEvents(userId, {
    timeMin,
    timeMax,
  });

  for (const event of googleEvents) {
    const upserted = await upsertCalendarEvent(userId, event);
    if (upserted) imported++;
  }

  // 2. Export JustPlan scheduled tasks to Google Calendar
  const scheduledTasks = await getScheduledTasksForExport(userId, timeMin, timeMax);

  for (const task of scheduledTasks) {
    const exportResult = await exportTaskToCalendar(userId, task);
    if (exportResult) exported++;
  }

  return { imported, exported };
}

/**
 * Sync Google Tasks
 */
async function syncGoogleTasks_impl(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ imported: number; exported: number }> {
  let imported = 0;
  let exported = 0;

  // 1. Import tasks from Google Tasks
  const googleTasks = await fetchAllTasks(userId, {
    dueMin: timeMin,
    dueMax: timeMax,
    showCompleted: false,
  });

  for (const task of googleTasks) {
    const importedTask = await importGoogleTask(userId, task);
    if (importedTask) imported++;
  }

  // 2. Export JustPlan tasks to Google Tasks (optionally)
  // This is optional - can be enabled based on user preference

  return { imported, exported };
}

/**
 * Upsert a calendar event from Google
 */
async function upsertCalendarEvent(
  userId: string,
  event: CalendarEvent
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("google_calendar_events") as any).upsert(
    {
      user_id: userId,
      google_event_id: event.googleEventId,
      calendar_id: event.calendarId,
      summary: event.summary,
      description: event.description,
      start_time: event.start.toISOString(),
      end_time: event.end.toISOString(),
      is_all_day: event.isAllDay,
      is_recurring: event.isRecurring,
      recurrence_rule: event.recurrenceRule,
      synced_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,google_event_id",
    }
  );

  if (error) {
    console.error("Failed to upsert calendar event:", error.message);
    return false;
  }

  return true;
}

/**
 * Get scheduled tasks to export to Google Calendar
 */
async function getScheduledTasksForExport(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    scheduledStartTime: string;
    scheduledEndTime: string;
    googleCalendarEventId: string | null;
  }>
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("tasks") as any)
    .select(
      "id, title, description, scheduled_start_time, scheduled_end_time, google_calendar_event_id"
    )
    .eq("user_id", userId)
    .not("scheduled_start_time", "is", null)
    .gte("scheduled_start_time", timeMin.toISOString())
    .lte("scheduled_start_time", timeMax.toISOString());

  if (error) {
    console.error("Failed to fetch scheduled tasks:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    scheduledStartTime: task.scheduled_start_time!,
    scheduledEndTime: task.scheduled_end_time!,
    googleCalendarEventId: task.google_calendar_event_id,
  }));
}

/**
 * Export a JustPlan task to Google Calendar
 */
async function exportTaskToCalendar(
  userId: string,
  task: {
    id: string;
    title: string;
    description: string | null;
    scheduledStartTime: string;
    scheduledEndTime: string;
    googleCalendarEventId: string | null;
  }
): Promise<boolean> {
  try {
    if (task.googleCalendarEventId) {
      // Update existing event
      await updateCalendarEvent(userId, task.googleCalendarEventId, {
        summary: `[JustPlan] ${task.title}`,
        description: task.description || undefined,
        start: new Date(task.scheduledStartTime),
        end: new Date(task.scheduledEndTime),
      });
    } else {
      // Create new event
      const event = await createCalendarEvent(userId, {
        summary: `[JustPlan] ${task.title}`,
        description: task.description || undefined,
        start: new Date(task.scheduledStartTime),
        end: new Date(task.scheduledEndTime),
      });

      // Save the event ID to the task
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("tasks") as any)
        .update({
          google_calendar_event_id: event.googleEventId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);
    }

    return true;
  } catch (error) {
    console.error(`Failed to export task ${task.id}:`, error);
    return false;
  }
}

/**
 * Import a Google Task as a JustPlan task
 */
async function importGoogleTask(
  userId: string,
  googleTask: GoogleTask
): Promise<boolean> {
  // Check if task already exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from("tasks") as any)
    .select("id")
    .eq("user_id", userId)
    .eq("google_task_id", googleTask.googleTaskId)
    .single();

  if (existing) {
    // Don't re-import existing tasks
    return false;
  }

  // Get default workflow state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: defaultState } = await (supabase.from("workflow_states") as any)
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .single();

  if (!defaultState) {
    console.error("No default workflow state found for user");
    return false;
  }

  // Create new task from Google Task
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("tasks") as any).insert({
    user_id: userId,
    title: googleTask.title,
    description: googleTask.notes,
    deadline: googleTask.due?.toISOString(),
    workflow_state_id: defaultState.id,
    google_task_id: googleTask.googleTaskId,
    priority: "medium",
  });

  if (error) {
    console.error("Failed to import Google task:", error.message);
    return false;
  }

  return true;
}

/**
 * Remove old calendar events from database
 */
export async function cleanupOldEvents(userId: string, olderThan: Date): Promise<number> {
  const { data, error } = await supabase
    .from("google_calendar_events")
    .delete()
    .eq("user_id", userId)
    .lt("end_time", olderThan.toISOString())
    .select("id");

  if (error) {
    console.error("Failed to cleanup old events:", error.message);
    return 0;
  }

  return data?.length || 0;
}
