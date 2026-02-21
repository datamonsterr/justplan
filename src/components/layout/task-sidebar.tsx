"use client";

import * as React from "react";
import { Plus, Search, Filter, Clock, Calendar, Tag, MoreVertical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { mockTasks, taskStatistics, type Task } from "@/lib/mock-task-data";

interface TaskSidebarProps {
  onTaskSelect: (taskId: string) => void;
}

function TaskCard({ task, onClick, isSubtask = false }: { task: Task; onClick: () => void; isSubtask?: boolean }) {
  const isOverdue = task.deadline && task.deadline < new Date();
  const isDueSoon = task.deadline && task.deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Card
      className={cn(
        "group cursor-pointer p-2.5 transition-all hover:bg-accent hover:shadow-sm",
        isSubtask && "ml-4 border-l-2 border-l-primary/30"
      )}
      onClick={onClick}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-tight line-clamp-2 flex-1">
            {task.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge size="sm" variant="outline" className="text-[9px]">
              {task.duration}m
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon-sm" className="h-4 w-4 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem className="text-xs">
                  <CheckCircle2 className="mr-2 h-3 w-3" />
                  Mark done
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant={
              task.priority === "high"
                ? "destructive"
                : task.priority === "medium"
                ? "default"
                : "secondary"
            }
            size="sm"
            className="text-[9px]"
          >
            {task.priority}
          </Badge>

          {task.deadline && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[10px]",
                isOverdue && "text-destructive",
                isDueSoon && !isOverdue && "text-orange-500"
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              <span>
                {task.deadline.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-0.5">
              <Tag className="h-2.5 w-2.5 text-muted-foreground" />
              <Badge size="sm" variant="outline" className="text-[9px]">
                {task.tags[0]}
              </Badge>
              {task.tags.length > 1 && (
                <span className="text-[9px] text-muted-foreground">
                  +{task.tags.length - 1}
                </span>
              )}
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <Badge size="sm" variant="outline" className="text-[9px]">
              {task.subtasks.length} subtask{task.subtasks.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export function TaskSidebar({ onTaskSelect }: TaskSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [expandedStates, setExpandedStates] = React.useState<Record<string, boolean>>({
    "In Progress": true,
    "Ready": true,
    "Blocked": true,
    "Review": true,
    "Backlog": false,
  });

  const toggleState = (state: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [state]: !prev[state],
    }));
  };

  // Filter tasks based on search query
  const filteredTasks = React.useMemo(() => {
    if (!searchQuery.trim()) return mockTasks;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Task[]> = {};
    
    Object.entries(mockTasks).forEach(([state, tasks]) => {
      const matchingTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
      if (matchingTasks.length > 0) {
        filtered[state] = matchingTasks;
      }
    });
    
    return filtered;
  }, [searchQuery]);

  return (
    <div className="flex h-full flex-col border-l bg-card">
      {/* Header */}
      <div className="border-b px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tasks</h2>
          <Button size="xs" className="h-6 gap-1">
            <Plus className="h-3 w-3" />
            New Task
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 pl-6 text-xs"
            />
          </div>
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" className="h-6 w-6">
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-xs">All tasks</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">Due this week</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">High priority</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs">Has subtasks</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">No deadline</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task Groups */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-3">
          {Object.entries(filteredTasks).map(([state, tasks]) => (
            <Collapsible
              key={state}
              open={expandedStates[state]}
              onOpenChange={() => toggleState(state)}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
                <span>{state}</span>
                <Badge size="sm" variant="secondary" className="text-[9px]">
                  {tasks.length}
                </Badge>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1.5 pt-1.5">
                {tasks.map((task) => (
                  <div key={task.id} className="space-y-1">
                    <TaskCard task={task} onClick={() => onTaskSelect(task.id)} />
                    {task.subtasks?.map((subtask) => (
                      <TaskCard
                        key={subtask.id}
                        task={subtask}
                        onClick={() => onTaskSelect(subtask.id)}
                        isSubtask
                      />
                    ))}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="border-t px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>{taskStatistics.totalHours}h total</span>
          </div>
          <span className="text-muted-foreground">{taskStatistics.total} active tasks</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">This week:</span>
          <div className="flex items-center gap-2">
            <span className="text-green-600">{taskStatistics.completedThisWeek} done</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-orange-600">{taskStatistics.thisWeek} due</span>
          </div>
        </div>
      </div>
    </div>
  );
}
