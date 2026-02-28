/**
 * Workflow Graph Editor using React Flow
 * Visual editor for configuring workflow states and transitions
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, Save, Undo, Trash2 } from "lucide-react";

import StateNode, { type StateNodeData } from "./state-node";
import TransitionEdge, { type TransitionEdgeData } from "./transition-edge";

// Node and edge types registration
const nodeTypes = { stateNode: StateNode };
const edgeTypes = { transitionEdge: TransitionEdge };

// Condition types for transitions
const CONDITION_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "deadline_within", label: "Deadline Within" },
  { value: "overdue", label: "Overdue" },
  { value: "time_in_state", label: "Time in State" },
  { value: "task_completed", label: "Task Completed" },
  { value: "scheduled_time_passed", label: "Scheduled Time Passed" },
];

interface WorkflowEditorProps {
  initialNodes?: Node<StateNodeData>[];
  initialEdges?: Edge<TransitionEdgeData>[];
  onSave?: (nodes: Node<StateNodeData>[], edges: Edge<TransitionEdgeData>[]) => Promise<void>;
  isLoading?: boolean;
}

export default function WorkflowEditor({
  initialNodes = [],
  initialEdges = [],
  onSave,
  isLoading = false,
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // State dialog
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<Node<StateNodeData> | null>(null);
  
  // Transition dialog
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [editingTransition, setEditingTransition] = useState<Edge<TransitionEdgeData> | null>(null);
  
  // State form
  const [stateName, setStateName] = useState("");
  const [stateColor, setStateColor] = useState("#3B82F6");
  const [isDefault, setIsDefault] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const [excludeFromScheduling, setExcludeFromScheduling] = useState(false);
  const [priorityBoost, setPriorityBoost] = useState(0);
  
  // Transition form
  const [conditionType, setConditionType] = useState("manual");
  const [conditionValue, setConditionValue] = useState(24);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  
  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Update initial data when props change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHasChanges(false);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle new connection
  const onConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection);
    setConditionType("manual");
    setConditionValue(24);
    setTransitionEnabled(true);
    setTransitionDialogOpen(true);
  }, []);

  // Create transition from connection
  const handleCreateTransition = useCallback(() => {
    if (!pendingConnection) return;

    const conditionValueData =
      conditionType === "deadline_within" || conditionType === "time_in_state"
        ? { hours: conditionValue }
        : undefined;

    const newEdge: Edge<TransitionEdgeData> = {
      id: `${pendingConnection.source}-${pendingConnection.target}-${Date.now()}`,
      source: pendingConnection.source!,
      target: pendingConnection.target!,
      type: "transitionEdge",
      data: {
        conditionType,
        conditionValue: conditionValueData,
        isEnabled: transitionEnabled,
      },
    };

    setEdges((eds) => addEdge(newEdge, eds));
    setHasChanges(true);
    setTransitionDialogOpen(false);
    setPendingConnection(null);
    toast.success("Transition created");
  }, [pendingConnection, conditionType, conditionValue, transitionEnabled, setEdges]);

  // Open state dialog for new or edit
  const handleAddState = useCallback(() => {
    setEditingState(null);
    setStateName("");
    setStateColor("#3B82F6");
    setIsDefault(false);
    setIsTerminal(false);
    setExcludeFromScheduling(false);
    setPriorityBoost(0);
    setStateDialogOpen(true);
  }, []);

  // Handle node double-click to edit
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node<StateNodeData>) => {
    setEditingState(node);
    setStateName(node.data.name);
    setStateColor(node.data.color || "#3B82F6");
    setIsDefault(node.data.isDefault || false);
    setIsTerminal(node.data.isTerminal || false);
    setExcludeFromScheduling(node.data.excludeFromScheduling || false);
    setPriorityBoost(node.data.schedulingPriorityBoost || 0);
    setStateDialogOpen(true);
  }, []);

  // Handle edge double-click to edit
  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge<TransitionEdgeData>) => {
    setEditingTransition(edge);
    setConditionType(edge.data?.conditionType || "manual");
    setConditionValue(
      (edge.data?.conditionValue?.hours as number) || 24
    );
    setTransitionEnabled(edge.data?.isEnabled ?? true);
    setTransitionDialogOpen(true);
  }, []);

  // Save state (create or update)
  const handleSaveState = useCallback(() => {
    if (!stateName.trim()) {
      toast.error("State name is required");
      return;
    }

    if (editingState) {
      // Update existing
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingState.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  name: stateName,
                  color: stateColor,
                  isDefault,
                  isTerminal,
                  excludeFromScheduling,
                  schedulingPriorityBoost: priorityBoost,
                },
              }
            : node
        )
      );
      toast.success("State updated");
    } else {
      // Create new
      const newNode: Node<StateNodeData> = {
        id: `state-${Date.now()}`,
        type: "stateNode",
        position: {
          x: 250 + Math.random() * 100,
          y: 100 + nodes.length * 100,
        },
        data: {
          id: `temp-${Date.now()}`,
          name: stateName,
          color: stateColor,
          isDefault,
          isTerminal,
          excludeFromScheduling,
          schedulingPriorityBoost: priorityBoost,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      toast.success("State created");
    }

    setHasChanges(true);
    setStateDialogOpen(false);
  }, [
    editingState,
    stateName,
    stateColor,
    isDefault,
    isTerminal,
    excludeFromScheduling,
    priorityBoost,
    nodes.length,
    setNodes,
  ]);

  // Update existing transition
  const handleUpdateTransition = useCallback(() => {
    if (!editingTransition) return;

    const conditionValueData =
      conditionType === "deadline_within" || conditionType === "time_in_state"
        ? { hours: conditionValue }
        : undefined;

    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === editingTransition.id
          ? {
              ...edge,
              data: {
                ...edge.data,
                conditionType,
                conditionValue: conditionValueData,
                isEnabled: transitionEnabled,
              },
            }
          : edge
      )
    );

    setHasChanges(true);
    setTransitionDialogOpen(false);
    setEditingTransition(null);
    toast.success("Transition updated");
  }, [editingTransition, conditionType, conditionValue, transitionEnabled, setEdges]);

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      toast.error("Nothing selected to delete");
      return;
    }

    // Check if deleting default state
    if (selectedNodes.some((n) => n.data.isDefault)) {
      toast.error("Cannot delete the default state");
      return;
    }

    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setHasChanges(true);
    toast.success(
      `Deleted ${selectedNodes.length} states and ${selectedEdges.length} transitions`
    );
  }, [nodes, edges, setNodes, setEdges]);

  // Revert changes
  const handleRevert = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHasChanges(false);
    toast.info("Changes reverted");
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Save workflow
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    try {
      await onSave(nodes, edges);
      setHasChanges(false);
      toast.success("Workflow saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save workflow");
    }
  }, [nodes, edges, onSave]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          setHasChanges(true);
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          setHasChanges(true);
        }}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultEdgeOptions={{
          type: "transitionEdge",
        }}
      >
        <Panel position="top-left" className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleAddState}>
            <Plus className="h-4 w-4 mr-1" />
            Add State
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteSelected}
            disabled={!nodes.some((n) => n.selected) && !edges.some((e) => e.selected)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRevert}
            disabled={!hasChanges}
          >
            <Undo className="h-4 w-4 mr-1" />
            Revert
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </Panel>
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>

      {/* State Dialog */}
      <Dialog open={stateDialogOpen} onOpenChange={setStateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingState ? "Edit State" : "Add State"}</DialogTitle>
            <DialogDescription>
              Configure workflow state properties
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g., In Progress"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={stateColor}
                  onChange={(e) => setStateColor(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={stateColor}
                  onChange={(e) => setStateColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Default State</Label>
                <p className="text-xs text-muted-foreground">
                  New tasks start in this state
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Terminal State</Label>
                <p className="text-xs text-muted-foreground">
                  Tasks in this state are considered complete
                </p>
              </div>
              <Switch checked={isTerminal} onCheckedChange={setIsTerminal} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Exclude from Scheduling</Label>
                <p className="text-xs text-muted-foreground">
                  Don&apos;t auto-schedule tasks in this state
                </p>
              </div>
              <Switch
                checked={excludeFromScheduling}
                onCheckedChange={setExcludeFromScheduling}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Priority Boost</Label>
                <span className="text-sm text-muted-foreground">
                  {priorityBoost > 0 ? `+${priorityBoost}` : priorityBoost}
                </span>
              </div>
              <Slider
                value={[priorityBoost]}
                min={-10}
                max={10}
                step={1}
                onValueChange={([value]) => setPriorityBoost(value)}
              />
              <p className="text-xs text-muted-foreground">
                Adjust scheduling priority for tasks in this state
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveState}>
              {editingState ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={(open) => {
        setTransitionDialogOpen(open);
        if (!open) {
          setPendingConnection(null);
          setEditingTransition(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransition ? "Edit Transition" : "Create Transition"}
            </DialogTitle>
            <DialogDescription>
              Configure when this transition should occur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Condition Type</Label>
              <Select value={conditionType} onValueChange={setConditionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(conditionType === "deadline_within" ||
              conditionType === "time_in_state") && (
              <div className="space-y-2">
                <Label>Hours</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[conditionValue]}
                    min={1}
                    max={168}
                    step={1}
                    onValueChange={([value]) => setConditionValue(value)}
                    className="flex-1"
                  />
                  <span className="w-12 text-right text-sm">
                    {conditionValue}h
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {conditionType === "deadline_within"
                    ? "Trigger when deadline is within this time"
                    : "Trigger after task has been in state for this time"}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label>Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Disable to pause this transition
                </p>
              </div>
              <Switch
                checked={transitionEnabled}
                onCheckedChange={setTransitionEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTransitionDialogOpen(false);
              setPendingConnection(null);
              setEditingTransition(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={editingTransition ? handleUpdateTransition : handleCreateTransition}
            >
              {editingTransition ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
