"use client";

import * as React from "react";
import {
  X,
  Trash2,
  Calendar,
  Pin,
  CheckCircle2,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTask, useTasks, type TaskType } from "@/hooks/use-tasks";

interface BottomPanelProps {
  taskId: string | null;
  onClose: () => void;
}

interface WorkflowStateMeta {
  id: string;
  name: string;
  isTerminal: boolean;
}

export function BottomPanel({ taskId, onClose }: BottomPanelProps) {
  const { task, isLoading, error } = useTask(taskId);
  const { updateTask, deleteTask, refetch } = useTasks({ includeSubtasks: true });
  const [terminalStates, setTerminalStates] = React.useState<WorkflowStateMeta[]>([]);

  React.useEffect(() => {
    const fetchWorkflowStates = async () => {
      try {
        const response = await fetch("/api/workflows");
        if (!response.ok) return;
        const result = await response.json();
        const states = (result.data || []) as WorkflowStateMeta[];
        setTerminalStates(states.filter((state) => state.isTerminal));
      } catch {
        // non-blocking
      }
    };
    void fetchWorkflowStates();
  }, []);

  const markTaskDone = React.useCallback(
    async (target: TaskType) => {
      if (terminalStates.length === 0) return;
      await updateTask(target.id, { workflowStateId: terminalStates[0].id });
      await refetch();
    },
    [terminalStates, updateTask, refetch]
  );

  const isSubtaskDone = React.useCallback(
    (subtask: TaskType) =>
      !!subtask.workflowStateId &&
      terminalStates.some((state) => state.id === subtask.workflowStateId),
    [terminalStates]
  );

  if (!taskId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-card text-xs text-muted-foreground">
        Loading task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center bg-card text-xs text-destructive">
        {error || "Task not found"}
      </div>
    );
  }

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => isSubtaskDone(s)).length;
  const progressPercentage =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-1 cursor-ns-resize items-center justify-center bg-border hover:bg-accent">
        <div className="h-0.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="flex items-start justify-between border-b px-3 py-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{task.title}</h3>
            <Badge size="sm" variant={task.priority === "high" ? "destructive" : "default"}>
              {task.priority}
            </Badge>
            {task.workflowState?.name && (
              <Badge size="sm" variant="outline">
                {task.workflowState.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              <span>{task.estimatedDurationMinutes}m</span>
            </div>
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                <span>
                  Due{" "}
                  {new Date(task.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {subtasks.length > 0 && (
              <span>
                Progress: {completedSubtasks}/{subtasks.length} ({progressPercentage}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Pin"
            onClick={async () => {
              await updateTask(task.id, { isPinned: !task.isPinned });
              await refetch();
            }}
          >
            <Pin className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="AI Breakdown"
            onClick={async () => {
              await fetch("/api/ai/breakdown", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId: task.id, createSubtasks: true }),
              });
              await refetch();
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          <div>
            <h4 className="mb-1 text-xs font-semibold">Description</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {task.description || "No description"}
            </p>
          </div>

          {subtasks.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold">
                Subtasks ({completedSubtasks}/{subtasks.length})
              </h4>
              <div className="space-y-1">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 rounded-sm border bg-card p-1.5 hover:bg-accent"
                  >
                    <Checkbox
                      checked={isSubtaskDone(subtask)}
                      onCheckedChange={async () => {
                        await markTaskDone(subtask);
                      }}
                      className="h-3 w-3"
                    />
                    <span
                      className={cn(
                        "flex-1 text-xs",
                        isSubtaskDone(subtask) && "text-muted-foreground line-through"
                      )}
                    >
                      {subtask.title}
                    </span>
                    <Badge size="sm" variant="outline">
                      {subtask.estimatedDurationMinutes}m
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between border-t px-3 py-2">
        <div className="flex gap-1">
          <Button size="xs" variant="outline">
            <Calendar className="mr-1 h-3 w-3" />
            Reschedule
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={async () => {
              await markTaskDone(task);
            }}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Complete
          </Button>
        </div>
        <Button
          size="xs"
          variant="ghost"
          className="text-destructive"
          onClick={async () => {
            await deleteTask(task.id);
            onClose();
          }}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}

