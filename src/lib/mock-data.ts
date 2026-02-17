// Mock data for development
import type { Task, WorkflowState, WorkingHours } from "@/types/tasks";

export const mockWorkflowStates: WorkflowState[] = [
  {
    id: "1",
    userId: "user1",
    name: "Backlog",
    description: "Tasks not yet ready to work on",
    color: "#94a3b8",
    order: 1,
    isTerminal: false,
    shouldSchedule: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    userId: "user1",
    name: "Ready",
    description: "Tasks ready to be scheduled and worked on",
    color: "#3b82f6",
    order: 2,
    isTerminal: false,
    shouldSchedule: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    userId: "user1",
    name: "In Progress",
    description: "Currently being worked on",
    color: "#f59e0b",
    order: 3,
    isTerminal: false,
    shouldSchedule: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    userId: "user1",
    name: "Blocked",
    description: "Cannot proceed due to external dependency",
    color: "#dc2626",
    order: 4,
    isTerminal: false,
    shouldSchedule: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    userId: "user1",
    name: "Done",
    description: "Completed",
    color: "#10b981",
    order: 5,
    isTerminal: true,
    shouldSchedule: false,
    createdAt: new Date().toISOString(),
  },
];

export const mockTasks: Task[] = [
  {
    id: "1",
    userId: "user1",
    title: "Design database schema",
    description: "Create comprehensive schema for tasks, workflows, and scheduling",
    estimatedDuration: 120,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    workflowState: "In Progress",
    isScheduled: true,
    scheduledStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    userId: "user1",
    title: "Implement Google Calendar sync",
    description: "Two-way sync with Google Calendar API",
    estimatedDuration: 180,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    workflowState: "Ready",
    isScheduled: true,
    scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    userId: "user1",
    title: "Build task UI components",
    description: "Create reusable task cards and lists",
    estimatedDuration: 90,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
    workflowState: "Ready",
    isScheduled: false,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    userId: "user1",
    title: "Write API documentation",
    description: "Document all REST endpoints",
    estimatedDuration: 60,
    priority: "low",
    workflowState: "Backlog",
    isScheduled: false,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    userId: "user1",
    title: "Setup CI/CD pipeline",
    description: "GitHub Actions for testing and deployment",
    estimatedDuration: 120,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
    workflowState: "Backlog",
    isScheduled: false,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    userId: "user1",
    title: "Review code changes",
    description: "Review PR #42",
    estimatedDuration: 30,
    priority: "high",
    workflowState: "Done",
    isScheduled: false,
    isCompleted: true,
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockWorkingHours: WorkingHours[] = [
  { id: "1", userId: "user1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isWorkingDay: true },
  { id: "2", userId: "user1", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isWorkingDay: true },
  { id: "3", userId: "user1", dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isWorkingDay: true },
  { id: "4", userId: "user1", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isWorkingDay: true },
  { id: "5", userId: "user1", dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isWorkingDay: true },
  { id: "6", userId: "user1", dayOfWeek: 6, startTime: "00:00", endTime: "00:00", isWorkingDay: false },
  { id: "7", userId: "user1", dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isWorkingDay: false },
];

// Mock API functions
export const mockApi = {
  tasks: {
    getAll: async (): Promise<Task[]> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockTasks;
    },
    getById: async (id: string): Promise<Task | null> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockTasks.find((t) => t.id === id) || null;
    },
    create: async (data: Partial<Task>): Promise<Task> => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const newTask: Task = {
        id: String(Date.now()),
        userId: "user1",
        title: data.title || "New Task",
        description: data.description,
        estimatedDuration: data.estimatedDuration || 60,
        deadline: data.deadline,
        priority: data.priority || "medium",
        workflowState: data.workflowState || "Backlog",
        isScheduled: false,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      return newTask;
    },
    update: async (id: string, data: Partial<Task>): Promise<Task> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const index = mockTasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error("Task not found");
      mockTasks[index] = { ...mockTasks[index], ...data, updatedAt: new Date().toISOString() };
      return mockTasks[index];
    },
    delete: async (id: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const index = mockTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        mockTasks.splice(index, 1);
      }
    },
  },
  workflows: {
    getAll: async (): Promise<WorkflowState[]> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockWorkflowStates;
    },
  },
  workingHours: {
    getAll: async (): Promise<WorkingHours[]> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockWorkingHours;
    },
  },
};
