"use client";

import * as React from "react";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Task, WorkflowState } from "@/types/tasks";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  workflows: WorkflowState[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

export function TaskList({
  tasks,
  workflows,
  onTaskClick,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || task.workflowState === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const tasksByStatus = React.useMemo(() => {
    const grouped = new Map<string, Task[]>();
    workflows.forEach((workflow) => {
      grouped.set(workflow.name, []);
    });
    filteredTasks.forEach((task) => {
      const existing = grouped.get(task.workflowState) || [];
      grouped.set(task.workflowState, [...existing, task]);
    });
    return grouped;
  }, [filteredTasks, workflows]);

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Manage your tasks and track progress
          </p>
        </div>
        <Button onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {workflows.map((workflow) => (
              <SelectItem key={workflow.id} value={workflow.name}>
                {workflow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {filteredTasks.length} of {tasks.length} tasks
        </span>
        {(searchQuery || statusFilter !== "all" || priorityFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Tasks by Status */}
      <div className="flex-1 space-y-6 overflow-y-auto pb-4">
        {filteredTasks.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm font-medium">No tasks found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first task"}
              </p>
              {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
                <Button onClick={onAddTask} className="mt-4" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              )}
            </div>
          </div>
        ) : (
          workflows.map((workflow) => {
            const workflowTasks = tasksByStatus.get(workflow.name) || [];
            if (workflowTasks.length === 0) return null;

            return (
              <div key={workflow.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: workflow.color }}
                  />
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <Badge variant="secondary">{workflowTasks.length}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {workflowTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className="cursor-pointer"
                    >
                      <TaskCard
                        title={task.title}
                        description={task.description}
                        duration={task.estimatedDuration}
                        priority={task.priority}
                        onEdit={() => onEditTask?.(task)}
                        onDelete={() => onDeleteTask?.(task)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
