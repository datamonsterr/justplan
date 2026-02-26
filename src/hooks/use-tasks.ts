/**
 * Task Management Hooks
 * Provides React hooks for task CRUD operations
 */

import { useState, useEffect, useCallback } from "react";
import type { Task as TaskType } from "@/types/tasks";

export interface UseTasksOptions {
  userId?: string;
  workflowStateId?: string;
  includeSubtasks?: boolean;
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
  estimatedDuration?: number;
  priority?: "low" | "medium" | "high";
  deadline?: string;
  workflowStateId?: string;
  parentTaskId?: string;
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
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch tasks");
      }

      const data = await response.json();
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

  const createTask = useCallback(async (input: CreateTaskInput): Promise<TaskType | null> => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          estimated_duration: input.estimatedDuration,
          priority: input.priority,
          deadline: input.deadline,
          workflow_state_id: input.workflowStateId,
          parent_task_id: input.parentTaskId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create task");
      }

      const data = await response.json();
      const newTask = data.data;

      // Update local state
      setTasks((prev) => [...prev, newTask]);

      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<TaskType>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update task");
      }

      const data = await response.json();
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
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete task");
      }

      // Update local state
      setTasks((prev) => prev.filter((t) => t.id !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const parseAndCreateTask = useCallback(async (input: string): Promise<TaskType | null> => {
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

      const parseData = await parseResponse.json();
      
      if (!parseData.success) {
        // Fallback to creating task with just title
        return createTask({ title: input });
      }

      // Create task with parsed data
      return createTask({
        title: parseData.data.title,
        estimatedDuration: parseData.data.estimatedDurationMinutes,
        priority: parseData.data.priority,
        deadline: parseData.data.deadline,
      });
    } catch (err) {
      // Fallback to creating task with just title
      return createTask({ title: input });
    }
  }, [createTask]);

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

    const fetchTask = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tasks/${taskId}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch task");
        }

        const data = await response.json();
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
