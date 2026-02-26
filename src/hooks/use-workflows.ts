/**
 * Workflow Management Hooks
 * Provides React hooks for workflow state management
 */

import { useState, useEffect, useCallback } from "react";

export interface WorkflowState {
  id: string;
  userId: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  excludeFromScheduling: boolean;
  schedulingPriorityBoost: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTransition {
  id: string;
  userId: string;
  fromStateId: string;
  toStateId: string;
  createdAt: string;
}

export interface WorkflowGraph {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      color: string;
      isDefault: boolean;
      excludeFromScheduling: boolean;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    animated: boolean;
    style: { stroke: string };
  }>;
}

export interface UseWorkflowsResult {
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createState: (state: CreateStateInput) => Promise<WorkflowState | null>;
  updateState: (id: string, updates: Partial<WorkflowState>) => Promise<boolean>;
  deleteState: (id: string) => Promise<boolean>;
  createTransition: (fromStateId: string, toStateId: string) => Promise<boolean>;
  deleteTransition: (id: string) => Promise<boolean>;
  reorderStates: (stateIds: string[]) => Promise<boolean>;
}

export interface CreateStateInput {
  name: string;
  color?: string;
  isDefault?: boolean;
  excludeFromScheduling?: boolean;
  schedulingPriorityBoost?: number;
}

/**
 * Hook for fetching and managing workflow states
 */
export function useWorkflows(): UseWorkflowsResult {
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch states and transitions in parallel
      const [statesRes, transitionsRes] = await Promise.all([
        fetch("/api/workflows"),
        fetch("/api/workflows/transitions"),
      ]);

      if (!statesRes.ok) {
        const data = await statesRes.json();
        throw new Error(data.error || "Failed to fetch workflow states");
      }

      if (!transitionsRes.ok) {
        const data = await transitionsRes.json();
        throw new Error(data.error || "Failed to fetch workflow transitions");
      }

      const [statesData, transitionsData] = await Promise.all([
        statesRes.json(),
        transitionsRes.json(),
      ]);

      setStates(statesData.data || []);
      setTransitions(transitionsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createState = useCallback(async (input: CreateStateInput): Promise<WorkflowState | null> => {
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          color: input.color,
          is_default: input.isDefault,
          exclude_from_scheduling: input.excludeFromScheduling,
          scheduling_priority_boost: input.schedulingPriorityBoost,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create state");
      }

      const data = await response.json();
      const newState = data.data;

      setStates((prev) => [...prev, newState]);

      return newState;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  const updateState = useCallback(async (id: string, updates: Partial<WorkflowState>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update state");
      }

      const data = await response.json();
      const updatedState = data.data;

      setStates((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updatedState } : s))
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const deleteState = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete state");
      }

      setStates((prev) => prev.filter((s) => s.id !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const createTransition = useCallback(async (fromStateId: string, toStateId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/workflows/transitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_state_id: fromStateId,
          to_state_id: toStateId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create transition");
      }

      const data = await response.json();
      const newTransition = data.data;

      setTransitions((prev) => [...prev, newTransition]);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const deleteTransition = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workflows/transitions?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete transition");
      }

      setTransitions((prev) => prev.filter((t) => t.id !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const reorderStates = useCallback(async (stateIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch("/api/workflows/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reorder states");
      }

      // Update local state with new order
      const reorderedStates = stateIds
        .map((id, index) => {
          const state = states.find((s) => s.id === id);
          return state ? { ...state, position: index } : null;
        })
        .filter((s): s is WorkflowState => s !== null);

      setStates(reorderedStates);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, [states]);

  return {
    states,
    transitions,
    isLoading,
    error,
    refetch: fetchWorkflows,
    createState,
    updateState,
    deleteState,
    createTransition,
    deleteTransition,
    reorderStates,
  };
}

/**
 * Hook for fetching workflow graph for React Flow
 */
export function useWorkflowGraph() {
  const [graph, setGraph] = useState<WorkflowGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workflows/graph");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch workflow graph");
      }

      const data = await response.json();
      setGraph(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return { graph, isLoading, error, refetch: fetchGraph };
}
