/**
 * Google Tasks API Client
 * Operations for Google Tasks sync
 */

import { google, tasks_v1 } from "googleapis";
import { getAuthenticatedClient } from "./auth";

export interface GoogleTask {
  id: string;
  googleTaskId: string;
  taskListId: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: Date;
  completed?: Date;
  position: string;
  parent?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

export interface CreateTaskInput {
  taskListId?: string;
  title: string;
  notes?: string;
  due?: Date;
  parent?: string;
}

/**
 * Get Google Tasks API client for a user
 */
async function getTasksClient(userId: string): Promise<tasks_v1.Tasks | null> {
  const auth = await getAuthenticatedClient(userId);
  if (!auth) return null;
  return google.tasks({ version: "v1", auth });
}

/**
 * List user's task lists
 */
export async function listTaskLists(userId: string): Promise<GoogleTaskList[]> {
  const tasks = await getTasksClient(userId);
  if (!tasks) {
    throw new Error("Google Tasks not connected");
  }

  const response = await tasks.tasklists.list({
    maxResults: 100,
  });

  return (response.data.items || []).map((list) => ({
    id: list.id || "",
    title: list.title || "",
  }));
}

/**
 * Fetch tasks from a task list
 */
export async function fetchTasks(
  userId: string,
  options: {
    taskListId?: string;
    showCompleted?: boolean;
    showHidden?: boolean;
    dueMin?: Date;
    dueMax?: Date;
    maxResults?: number;
    pageToken?: string;
  } = {}
): Promise<{
  tasks: GoogleTask[];
  nextPageToken?: string;
}> {
  const tasksClient = await getTasksClient(userId);
  if (!tasksClient) {
    throw new Error("Google Tasks not connected");
  }

  const {
    taskListId = "@default",
    showCompleted = false,
    showHidden = false,
    dueMin,
    dueMax,
    maxResults = 100,
    pageToken,
  } = options;

  const response = await tasksClient.tasks.list({
    tasklist: taskListId,
    showCompleted,
    showHidden,
    dueMin: dueMin?.toISOString(),
    dueMax: dueMax?.toISOString(),
    maxResults,
    pageToken,
  });

  const tasks: GoogleTask[] = (response.data.items || []).map((task) =>
    parseGoogleTask(task, taskListId)
  );

  return {
    tasks,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

/**
 * Fetch all tasks from a task list (handles pagination)
 */
export async function fetchAllTasks(
  userId: string,
  options: {
    taskListId?: string;
    showCompleted?: boolean;
    dueMin?: Date;
    dueMax?: Date;
  } = {}
): Promise<GoogleTask[]> {
  const allTasks: GoogleTask[] = [];
  let pageToken: string | undefined;

  do {
    const result = await fetchTasks(userId, {
      ...options,
      pageToken,
    });
    allTasks.push(...result.tasks);
    pageToken = result.nextPageToken;
  } while (pageToken);

  return allTasks;
}

/**
 * Create a new task
 */
export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<GoogleTask> {
  const tasksClient = await getTasksClient(userId);
  if (!tasksClient) {
    throw new Error("Google Tasks not connected");
  }

  const { taskListId = "@default", title, notes, due, parent } = input;

  const taskBody: tasks_v1.Schema$Task = {
    title,
    notes,
  };

  if (due) {
    taskBody.due = due.toISOString();
  }

  const response = await tasksClient.tasks.insert({
    tasklist: taskListId,
    parent,
    requestBody: taskBody,
  });

  if (!response.data.id) {
    throw new Error("Failed to create task");
  }

  return parseGoogleTask(response.data, taskListId);
}

/**
 * Update an existing task
 */
export async function updateTask(
  userId: string,
  taskId: string,
  input: Partial<CreateTaskInput> & { taskListId?: string; status?: "needsAction" | "completed" }
): Promise<GoogleTask> {
  const tasksClient = await getTasksClient(userId);
  if (!tasksClient) {
    throw new Error("Google Tasks not connected");
  }

  const { taskListId = "@default", title, notes, due, status } = input;

  const taskBody: tasks_v1.Schema$Task = {};

  if (title !== undefined) taskBody.title = title;
  if (notes !== undefined) taskBody.notes = notes;
  if (due !== undefined) taskBody.due = due?.toISOString() || null;
  if (status !== undefined) taskBody.status = status;

  const response = await tasksClient.tasks.patch({
    tasklist: taskListId,
    task: taskId,
    requestBody: taskBody,
  });

  return parseGoogleTask(response.data, taskListId);
}

/**
 * Complete a task
 */
export async function completeTask(
  userId: string,
  taskId: string,
  taskListId: string = "@default"
): Promise<GoogleTask> {
  return updateTask(userId, taskId, {
    taskListId,
    status: "completed",
  });
}

/**
 * Delete a task
 */
export async function deleteTask(
  userId: string,
  taskId: string,
  taskListId: string = "@default"
): Promise<void> {
  const tasksClient = await getTasksClient(userId);
  if (!tasksClient) {
    throw new Error("Google Tasks not connected");
  }

  await tasksClient.tasks.delete({
    tasklist: taskListId,
    task: taskId,
  });
}

/**
 * Move a task (reorder or change parent)
 */
export async function moveTask(
  userId: string,
  taskId: string,
  options: {
    taskListId?: string;
    parent?: string;
    previous?: string;
  }
): Promise<GoogleTask> {
  const tasksClient = await getTasksClient(userId);
  if (!tasksClient) {
    throw new Error("Google Tasks not connected");
  }

  const { taskListId = "@default", parent, previous } = options;

  const response = await tasksClient.tasks.move({
    tasklist: taskListId,
    task: taskId,
    parent: parent || undefined,
    previous: previous || undefined,
  });

  return parseGoogleTask(response.data, taskListId);
}

/**
 * Parse Google Task to our format
 */
function parseGoogleTask(
  task: tasks_v1.Schema$Task,
  taskListId: string
): GoogleTask {
  return {
    id: `${taskListId}:${task.id}`,
    googleTaskId: task.id || "",
    taskListId,
    title: task.title || "Untitled",
    notes: task.notes || undefined,
    status: (task.status as GoogleTask["status"]) || "needsAction",
    due: task.due ? new Date(task.due) : undefined,
    completed: task.completed ? new Date(task.completed) : undefined,
    position: task.position || "0",
    parent: task.parent || undefined,
  };
}
