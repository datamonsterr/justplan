/**
 * Workflow Settings Page
 * Visual editor for configuring workflow states and transitions
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Node, Edge } from "reactflow";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { WorkflowEditor, type StateNodeData, type TransitionEdgeData } from "@/components/workflows";
import { toast } from "sonner";

interface WorkflowState {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  is_terminal: boolean;
  exclude_from_scheduling: boolean;
  scheduling_priority_boost: number;
  order_index: number;
}

interface WorkflowTransition {
  id: string;
  from_state_id: string;
  to_state_id: string;
  condition_type: string;
  condition_value: Record<string, unknown> | null;
  is_enabled: boolean;
}

interface WorkflowGraph {
  nodes: Node<StateNodeData>[];
  edges: Edge<TransitionEdgeData>[];
}

export default function WorkflowSettingsPage() {
  const [nodes, setNodes] = useState<Node<StateNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<TransitionEdgeData>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch workflow graph data
  const fetchWorkflow = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workflows/graph");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch workflow");
      }

      const graph: WorkflowGraph = result.data;
      setNodes(graph.nodes || []);
      setEdges(graph.edges || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load workflow";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Save workflow changes
  const handleSave = useCallback(
    async (updatedNodes: Node<StateNodeData>[], updatedEdges: Edge<TransitionEdgeData>[]) => {
      setIsSaving(true);

      try {
        // Batch save: states first, then transitions
        // This ensures state IDs exist before creating transitions

        // 1. Get current states from server to determine creates/updates/deletes
        const currentStatesResponse = await fetch("/api/workflows");
        const currentStatesResult = await currentStatesResponse.json();
        
        if (!currentStatesResponse.ok) {
          throw new Error(currentStatesResult.error || "Failed to fetch current states");
        }

        const currentStates: WorkflowState[] = currentStatesResult.data || [];
        const currentStateIds = new Set(currentStates.map((s) => s.id));

        // Map temporary IDs to permanent ones
        const idMap = new Map<string, string>();

        // 2. Process each node
        for (let i = 0; i < updatedNodes.length; i++) {
          const node = updatedNodes[i];
          const stateData = {
            name: node.data.name,
            color: node.data.color || "#3B82F6",
            is_default: node.data.isDefault || false,
            is_terminal: node.data.isTerminal || false,
            exclude_from_scheduling: node.data.excludeFromScheduling || false,
            scheduling_priority_boost: node.data.schedulingPriorityBoost || 0,
            order_index: i,
            position_x: Math.round(node.position.x),
            position_y: Math.round(node.position.y),
          };

          const isExisting = currentStateIds.has(node.data.id);

          if (isExisting) {
            // Update existing state
            const response = await fetch(`/api/workflows/${node.data.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(stateData),
            });

            if (!response.ok) {
              const result = await response.json();
              throw new Error(result.error || `Failed to update state ${node.data.name}`);
            }

            idMap.set(node.id, node.data.id);
          } else {
            // Create new state
            const response = await fetch("/api/workflows", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(stateData),
            });

            if (!response.ok) {
              const result = await response.json();
              throw new Error(result.error || `Failed to create state ${node.data.name}`);
            }

            const result = await response.json();
            idMap.set(node.id, result.data.id);
          }
        }

        // 3. Delete states that no longer exist
        const updatedNodeIds = new Set(updatedNodes.map((n) => n.data.id));
        for (const state of currentStates) {
          if (!updatedNodeIds.has(state.id)) {
            // Don't delete default state
            if (state.is_default) continue;

            await fetch(`/api/workflows/${state.id}`, {
              method: "DELETE",
            });
          }
        }

        // 4. Delete all existing transitions and recreate them
        const transitionsResponse = await fetch("/api/workflows/transitions");
        const transitionsResult = await transitionsResponse.json();
        
        if (transitionsResponse.ok && transitionsResult.data) {
          for (const transition of transitionsResult.data as WorkflowTransition[]) {
            await fetch(`/api/workflows/transitions?id=${transition.id}`, {
              method: "DELETE",
            });
          }
        }

        // 5. Create new transitions
        for (const edge of updatedEdges) {
          const fromStateId = idMap.get(edge.source) || 
            updatedNodes.find((n) => n.id === edge.source)?.data.id;
          const toStateId = idMap.get(edge.target) ||
            updatedNodes.find((n) => n.id === edge.target)?.data.id;

          if (!fromStateId || !toStateId) {
            console.warn("Skipping edge with missing state IDs:", edge);
            continue;
          }

          const transitionData = {
            from_state_id: fromStateId,
            to_state_id: toStateId,
            condition_type: edge.data?.conditionType || "manual",
            condition_value: edge.data?.conditionValue || null,
            is_enabled: edge.data?.isEnabled ?? true,
          };

          const response = await fetch("/api/workflows/transitions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transitionData),
          });

          if (!response.ok) {
            const result = await response.json();
            console.warn("Failed to create transition:", result.error);
          }
        }

        // 6. Refresh the graph to get latest data
        await fetchWorkflow();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save workflow";
        toast.error(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchWorkflow]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Workflow Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Design states and transitions for your task workflow
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflow}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 py-3 bg-muted/50 border-b text-sm text-muted-foreground">
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          <li>• <strong>Add State:</strong> Click the &quot;Add State&quot; button</li>
          <li>• <strong>Connect:</strong> Drag from one state&apos;s output handle to another&apos;s input</li>
          <li>• <strong>Edit:</strong> Double-click a state or transition</li>
          <li>• <strong>Delete:</strong> Select and click Delete or press Backspace</li>
        </ul>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {isLoading && nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading workflow...</span>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchWorkflow}>Retry</Button>
            </div>
          </div>
        ) : (
          <WorkflowEditor
            initialNodes={nodes}
            initialEdges={edges}
            onSave={handleSave}
            isLoading={isSaving}
          />
        )}
      </div>
    </div>
  );
}
