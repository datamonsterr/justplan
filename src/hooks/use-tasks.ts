/**
 * Task Management Hooks
 * Provides React hooks for task CRUD operations
 */

import { useState, useEffect, useCallback } from "react";

export interface UseTasksOptions {
  workflowStateId?: string;
  includeSubtasks?: boolean;
}

export interface TaskType {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  estimatedDurationMinutes: number;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  workflowStateId: string | null;
  isScheduled: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  isPinned: boolean;
  parentTaskId: string | null;
  dependsOnTaskId: string | null;
  createdAt: string;
  updatedAt: string;
  workflowState?: {
    id: string;
    name: string;
    color: string;
  };
  subtasks?: TaskType[];
}

export interface UseTasksResult {
  tasks: TaskType[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (task: CreateTaskInput) => Promise<TaskType | null>;
  updateTask: (id: string, updates: Partial<TaskType>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  parseAndCreateTask: (input: string) => Promise<TaskType | null>;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  estimatedDurationMinutes?: number;
  priority?: "low" | "medium" | "high";
  deadline?: string | null;
  workflowStateId?: string;
  parentTaskId?: string;
  dependsOnTaskId?: string;
  isPinned?: boolean;
}

interface ApiErrorPayload {
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  if (response.redirected && response.url.includes("/sign-in")) {
    return "Authentication required";
  }

  const data = await parseJsonResponse<ApiErrorPayload>(response);
  if (data?.error) {
    return data.error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    return response.status === 401 || response.status === 403
      ? "Authentication required"
      : "Unexpected HTML response from server";
  }

  if (response.status === 401) {
    return "Authentication required";
  }

  if (response.status === 403) {
    return "You do not have permission to perform this action";
  }

  return fallback;
}

/**
 * Hook for fetching and managing tasks
 */
export function useTasks(options: UseTasksOptions = {}): UseTasksResult {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.workflowStateId) {
        params.set("workflowStateId", options.workflowStateId);
      }
      if (options.includeSubtasks !== undefined) {
        params.set("includeSubtasks", String(options.includeSubtasks));
      }

      const url = `/api/tasks${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "Failed to fetch tasks")
        );
      }

      const data = await parseJsonResponse<{ data?: TaskType[] }>(response);
      if (!data) {
        throw new Error("Unexpected response from server while loading tasks");
      }

      setTasks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [options.workflowStateId, options.includeSubtasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<TaskType | null> => {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            estimatedDurationMinutes: input.estimatedDurationMinutes ?? 60,
            priority: input.priority,
            deadline: input.deadline,
            workflowStateId: input.workflowStateId,
            parentTaskId: input.parentTaskId,
            dependsOnTaskId: input.dependsOnTaskId,
            isPinned: input.isPinned ?? false,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, "Failed to create task")
          );
        }

        const data = await parseJsonResponse<{ data: TaskType }>(response);
        if (!data?.data) {
          throw new Error(
            "Unexpected response from server while creating task"
          );
        }
        const newTask = data.data;

        // Update local state
        setTasks((prev) => [...prev, newTask]);

        return newTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    []
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<TaskType>): Promise<boolean> => {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updates.title,
            description: updates.description,
            estimatedDurationMinutes: updates.estimatedDurationMinutes,
            priority: updates.priority,
            deadline: updates.deadline,
            workflowStateId: updates.workflowStateId,
            parentTaskId: updates.parentTaskId,
            isScheduled: updates.isScheduled,
            scheduledStart: updates.scheduledStart,
            scheduledEnd: updates.scheduledEnd,
            isPinned: updates.isPinned,
            dependsOnTaskId: updates.dependsOnTaskId,
            metadata: undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, "Failed to update task")
          );
        }

        const data = await parseJsonResponse<{ data: TaskType }>(response);
        if (!data?.data) {
          throw new Error(
            "Unexpected response from server while updating task"
          );
        }
        const updatedTask = data.data;

        // Update local state
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updatedTask } : t))
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    []
  );

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "Failed to delete task")
        );
      }

      // Update local state
      setTasks((prev) => prev.filter((t) => t.id !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const parseAndCreateTask = useCallback(
    async (input: string): Promise<TaskType | null> => {
      try {
        // First parse the input using the parser API
        const parseResponse = await fetch("/api/tasks/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });

        if (!parseResponse.ok) {
          // If parse endpoint doesn't exist, just create with title
          return createTask({ title: input });
        }

        const parseData = await parseJsonResponse<{
          success?: boolean;
          data?: {
            title: string;
            estimatedDurationMinutes?: number;
            priority?: "low" | "medium" | "high";
            deadline?: string;
            workflowState?: string;
          };
        }>(parseResponse);
        if (!parseData?.success || !parseData.data) {
          return createTask({ title: input });
        }

        // Create task with parsed data
        let workflowStateId: string | undefined;
        if (parseData.data.workflowState) {
          const statesResponse = await fetch("/api/workflows");
          if (statesResponse.ok) {
            const statesJson = await parseJsonResponse<{
              data?: Array<{ id: string; name: string }>;
            }>(statesResponse);
            const states = (statesJson?.data || []) as Array<{
              id: string;
              name: string;
            }>;
            workflowStateId = states.find(
              (state) =>
                state.name.toLowerCase() ===
                String(parseData.data.workflowState).toLowerCase()
            )?.id;
          }
        }

        return createTask({
          title: parseData.data.title,
          estimatedDurationMinutes:
            parseData.data.estimatedDurationMinutes ?? 60,
          priority: parseData.data.priority,
          deadline: parseData.data.deadline,
          workflowStateId,
        });
      } catch (err) {
        // Fallback to creating task with just title
        return createTask({ title: input });
      }
    },
    [createTask]
  );

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    parseAndCreateTask,
  };
}

/**
 * Hook for a single task
 */
export function useTask(taskId: string | null) {
  const [task, setTask] = useState<TaskType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }
    if (!isUuid(taskId)) {
      setTask(null);
      setError("Task not found");
      setIsLoading(false);
      return;
    }

    const fetchTask = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tasks/${taskId}`);

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, "Failed to fetch task")
          );
        }

        const data = await parseJsonResponse<{ data?: TaskType }>(response);
        if (!data?.data) {
          throw new Error("Unexpected response from server while loading task");
        }
        setTask(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  return { task, isLoading, error };
}
