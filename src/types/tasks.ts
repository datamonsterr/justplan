// Task types for JustPlan
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  estimatedDuration: number; // in minutes
  deadline?: string; // ISO date string
  priority: "low" | "medium" | "high";
  workflowState: string;
  isScheduled: boolean;
  scheduledStart?: string; // ISO date string
  scheduledEnd?: string; // ISO date string
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  estimatedDuration: number;
  deadline?: string;
  priority?: "low" | "medium" | "high";
  workflowState?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  isCompleted?: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface WorkflowState {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  order: number;
  isTerminal: boolean;
  shouldSchedule: boolean;
  createdAt: string;
}

export interface WorkingHours {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isWorkingDay: boolean;
}
