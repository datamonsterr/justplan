/**
 * Scheduling Engine Types
 * Core types for the automatic scheduling system
 */

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface ScheduledBlock {
  taskId: string;
  start: Date;
  end: Date;
  duration: number; // minutes
}

export interface UserPreferences {
  workingHoursStart: string; // HH:mm format
  workingHoursEnd: string;
  workingDays: number[]; // 0-6, Sunday = 0
  defaultTaskDuration: number; // minutes
  breakBetweenTasks: number; // minutes
  preferredFocusHours: string[]; // HH:mm format for preferred deep work times
  timezone: string;
}

export interface SchedulingTask {
  id: string;
  title: string;
  estimatedDuration: number | null; // minutes
  deadline: Date | null;
  priority: "low" | "medium" | "high" | "urgent";
  workflowStateId: string;
  scheduledStartTime: Date | null;
  scheduledEndTime: Date | null;
  parentTaskId: string | null;
  // Workflow state properties (denormalized for efficiency)
  stateExcludeFromScheduling?: boolean;
  statePriorityBoost?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  source: "google_calendar" | "justplan" | "google_tasks";
}

export interface SchedulingContext {
  tasks: SchedulingTask[];
  existingEvents: CalendarEvent[];
  preferences: UserPreferences;
  schedulingWindowDays: number; // How many days ahead to schedule
  now: Date;
}

export interface SchedulingResult {
  success: boolean;
  scheduledTasks: ScheduledBlock[];
  unscheduledTasks: Array<{
    taskId: string;
    reason: string;
  }>;
  warnings: string[];
  stats: {
    totalTasksProcessed: number;
    tasksScheduled: number;
    tasksSkipped: number;
    totalScheduledMinutes: number;
    utilizationPercent: number;
  };
}

export interface PriorityScore {
  taskId: string;
  score: number;
  factors: {
    basePriority: number;
    deadlineUrgency: number;
    stateBoost: number;
    dependencyFactor: number;
  };
}

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  workingDays: [1, 2, 3, 4, 5], // Mon-Fri
  defaultTaskDuration: 60,
  breakBetweenTasks: 15,
  preferredFocusHours: ["09:00", "10:00", "14:00", "15:00"],
  timezone: "UTC",
};

// Priority weights (can be tuned)
export const PRIORITY_WEIGHTS = {
  base: {
    low: 10,
    medium: 30,
    high: 60,
    urgent: 100,
  },
  deadlineUrgency: {
    // hours until deadline -> multiplier
    overdue: 150,
    within24h: 100,
    within48h: 50,
    within7d: 20,
    noDeadline: 0,
  },
  // Max boost/penalty from workflow state
  maxStateBoost: 50,
};
