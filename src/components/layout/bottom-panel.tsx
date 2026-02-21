"use client";

import * as React from "react";
import {
  X,
  Edit,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Subtask {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface BottomPanelProps {
  taskId: string | null;
  onClose: () => void;
}

// Mock data  
const mockTaskDetails = {
  t1: {
    title: "Team standup",
    description: "Daily standup meeting with the engineering team",
    state: "In Progress",
    priority: "medium",
    duration: 30,
    deadline: new Date("2026-02-21"),
    subtasks: [],
  },
  t2: {
    title: "Write documentation",
    description: "Complete the API documentation for the new endpoints",
    state: "In Progress",
    priority: "high",
    duration: 120,
    deadline: new Date("2026-02-22"),
    subtasks: [
      { id: "s1", title: "Document authentication endpoints", duration: 30, completed: true },
      { id: "s2", title: "Document user management", duration: 45, completed: false },
      { id: "s3", title: "Add code examples", duration: 45, completed: false },
    ],
  },
  t3: {
    title: "Review pull requests",
    description: "Review open PRs from the team",
    state: "Ready",
    priority: "medium",
    duration: 45,
    deadline: new Date("2026-02-21"),
    subtasks: [
      { id: "s4", title: "PR #123 - Bug fix", duration: 15, completed: false },
      { id: "s5", title: "PR #124 - New feature", duration: 30, completed: false },
    ],
  },
  t4: {
    title: "Design mockups (suggested)",
    description: "Create design mockups for the new feature",
    state: "Ready",
    priority: "high",
    duration: 90,
    deadline: new Date("2026-02-23"),
    subtasks: [],
  },
};

export function BottomPanel({ taskId, onClose }: BottomPanelProps) {
  const task = taskId ? mockTaskDetails[taskId as keyof typeof mockTaskDetails] : null;
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(task?.subtasks || []);

  React.useEffect(() => {
    if (task) {
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  if (!task) {
    return null;
  }

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const progressPercentage = subtasks.length > 0 
    ? Math.round((completedSubtasks / subtasks.length) * 100)
    : 0;

  const toggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    );
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Drag handle */}
      <div className="flex h-1 cursor-ns-resize items-center justify-center bg-border hover:bg-accent">
        <div className="h-0.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between border-b px-3 py-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{task.title}</h3>
            <Badge size="sm" variant={task.priority === "high" ? "destructive" : "default"}>
              {task.priority}
            </Badge>
            <Badge size="sm" variant="outline">
              {task.state}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              <span>{task.duration}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              <span>
                Due {task.deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            {subtasks.length > 0 && (
              <span>
                Progress: {completedSubtasks}/{subtasks.length} ({progressPercentage}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Edit">
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Pin">
            <Pin className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="AI Breakdown">
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {/* Description */}
          <div>
            <h4 className="mb-1 text-xs font-semibold">Description</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Subtasks */}
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
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                      className="h-3 w-3"
                    />
                    <span
                      className={cn(
                        "flex-1 text-xs",
                        subtask.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {subtask.title}
                    </span>
                    <Badge size="sm" variant="outline">
                      {subtask.duration}m
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex items-center justify-between border-t px-3 py-2">
        <div className="flex gap-1">
          <Button size="xs" variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Reschedule
          </Button>
          <Button size="xs" variant="outline">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Complete
          </Button>
        </div>
        <Button size="xs" variant="ghost" className="text-destructive">
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
