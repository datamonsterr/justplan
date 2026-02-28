"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Trash2,
} from "lucide-react";
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
import {
  applyAutocompleteSuggestion,
  getAutocompleteSuggestions,
  getInlineAutocompleteSuggestion,
  getNextSuggestionIndex,
  hasOpenTaskBracket,
} from "@/lib/task-parser";
import { useTasks, type TaskType } from "@/hooks/use-tasks";

interface TaskSidebarProps {
  onTaskSelect: (taskId: string) => void;
}

interface WorkflowStateMeta {
  id: string;
  name: string;
  isTerminal: boolean;
}

function TaskCard({
  task,
  onClick,
  onDelete,
  onComplete,
  isSubtask = false,
}: {
  task: TaskType;
  onClick: () => void;
  onDelete: () => Promise<void>;
  onComplete: () => Promise<void>;
  isSubtask?: boolean;
}) {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline ? deadline.getTime() < Date.now() : false;
  const isDueSoon = deadline
    ? deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

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
          <p className="line-clamp-2 flex-1 text-xs font-medium leading-tight">
            {task.title}
          </p>
          <div className="flex flex-shrink-0 items-center gap-1">
            <Badge size="sm" variant="outline" className="text-[9px]">
              {task.estimatedDurationMinutes}m
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  className="text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    void onComplete();
                  }}
                >
                  <CheckCircle2 className="mr-2 h-3 w-3" />
                  Mark done
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    void onDelete();
                  }}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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

          {deadline && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[10px]",
                isOverdue && "text-destructive",
                isDueSoon && !isOverdue && "text-orange-500"
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              <span>
                {deadline.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <Badge size="sm" variant="outline" className="text-[9px]">
              {task.subtasks.length} subtasks
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function flattenTasks(tasks: TaskType[]): TaskType[] {
  const result: TaskType[] = [];
  for (const task of tasks) {
    result.push(task);
    if (task.subtasks?.length) {
      result.push(...flattenTasks(task.subtasks));
    }
  }
  return result;
}

export function TaskSidebar({ onTaskSelect }: TaskSidebarProps) {
  const {
    tasks,
    isLoading,
    error,
    parseAndCreateTask,
    deleteTask,
    updateTask,
    refetch,
  } = useTasks({ includeSubtasks: true });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [newTaskInput, setNewTaskInput] = React.useState("");
  const [suggestionIndex, setSuggestionIndex] = React.useState(0);
  const newTaskInputRef = React.useRef<HTMLInputElement>(null);
  const [expandedStates, setExpandedStates] = React.useState<
    Record<string, boolean>
  >({});
  const [terminalStates, setTerminalStates] = React.useState<
    WorkflowStateMeta[]
  >([]);

  const syntaxSuggestions = React.useMemo(
    () => getAutocompleteSuggestions(newTaskInput),
    [newTaskInput]
  );
  const isSyntaxSuggestionOpen =
    isAddingTask &&
    hasOpenTaskBracket(newTaskInput) &&
    syntaxSuggestions.length > 0;
  const activeSuggestionIndex = isSyntaxSuggestionOpen
    ? Math.min(suggestionIndex, syntaxSuggestions.length - 1)
    : 0;
  const selectedSuggestion = isSyntaxSuggestionOpen
    ? syntaxSuggestions[activeSuggestionIndex]
    : undefined;
  const inlineSuggestion = isSyntaxSuggestionOpen
    ? getInlineAutocompleteSuggestion(newTaskInput, selectedSuggestion)
    : "";

  const toggleState = (state: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [state]: !prev[state],
    }));
  };

  React.useEffect(() => {
    if (isAddingTask && newTaskInputRef.current) {
      newTaskInputRef.current.focus();
    }
  }, [isAddingTask]);

  React.useEffect(() => {
    if (!isSyntaxSuggestionOpen) {
      setSuggestionIndex(0);
      return;
    }
    setSuggestionIndex((prev) => Math.min(prev, syntaxSuggestions.length - 1));
  }, [isSyntaxSuggestionOpen, syntaxSuggestions.length]);

  React.useEffect(() => {
    const fetchWorkflowStates = async () => {
      try {
        const response = await fetch("/api/workflows");
        if (!response.ok) return;
        const result = await response.json();
        const states = (result.data || []) as WorkflowStateMeta[];
        setTerminalStates(states.filter((state) => state.isTerminal));
      } catch {
        // non-blocking for task rendering
      }
    };
    void fetchWorkflowStates();
  }, []);

  const handleCreateTask = async () => {
    if (!newTaskInput.trim()) {
      setIsAddingTask(false);
      setSuggestionIndex(0);
      return;
    }

    await parseAndCreateTask(newTaskInput.trim());
    setNewTaskInput("");
    setIsAddingTask(false);
    setSuggestionIndex(0);
    await refetch();
  };

  const filteredTasks = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const source = tasks;

    if (!query) {
      return source;
    }

    const filterRecursive = (input: TaskType[]): TaskType[] => {
      return input
        .map((task) => {
          const childMatches = task.subtasks
            ? filterRecursive(task.subtasks)
            : [];
          const selfMatch =
            task.title.toLowerCase().includes(query) ||
            (task.description || "").toLowerCase().includes(query);

          if (!selfMatch && childMatches.length === 0) {
            return null;
          }

          return {
            ...task,
            subtasks: childMatches,
          };
        })
        .filter((task): task is TaskType => task !== null);
    };

    return filterRecursive(source);
  }, [tasks, searchQuery]);

  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, TaskType[]> = {};
    for (const task of filteredTasks) {
      const stateName = task.workflowState?.name || "Unassigned";
      if (!groups[stateName]) {
        groups[stateName] = [];
      }
      groups[stateName].push(task);
    }
    return groups;
  }, [filteredTasks]);

  React.useEffect(() => {
    const defaults: Record<string, boolean> = {};
    for (const state of Object.keys(groupedTasks)) {
      defaults[state] = expandedStates[state] ?? true;
    }
    setExpandedStates(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(groupedTasks).join("|")]);

  const flatTasks = React.useMemo(() => flattenTasks(tasks), [tasks]);
  const totalMinutes = flatTasks.reduce(
    (acc, task) => acc + task.estimatedDurationMinutes,
    0
  );
  const dueThisWeek = flatTasks.filter((task) => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline).getTime();
    const now = Date.now();
    return deadline >= now && deadline <= now + 7 * 24 * 60 * 60 * 1000;
  }).length;
  const completedThisWeek = flatTasks.filter((task) => {
    const isTerminal = task.workflowStateId
      ? terminalStates.some((state) => state.id === task.workflowStateId)
      : false;
    if (!isTerminal) return false;
    const updatedAt = new Date(task.updatedAt).getTime();
    return updatedAt >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;

  const markDone = React.useCallback(
    async (task: TaskType) => {
      if (terminalStates.length === 0) return;
      const doneStateId = terminalStates[0].id;
      await updateTask(task.id, { workflowStateId: doneStateId });
      await refetch();
    },
    [terminalStates, updateTask, refetch]
  );

  return (
    <div className="flex h-full flex-col border-l bg-card">
      <div className="border-b px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tasks</h2>
          <Button
            size="xs"
            className="h-6 gap-1"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="h-3 w-3" />
            New Task
          </Button>
        </div>

        {isAddingTask && (
          <div className="mb-2">
            <div className="relative">
              {isSyntaxSuggestionOpen && inlineSuggestion && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center px-2 text-xs">
                  <span className="whitespace-pre text-transparent">
                    {newTaskInput}
                  </span>
                  <span className="whitespace-pre text-muted-foreground/70">
                    {inlineSuggestion}
                  </span>
                </div>
              )}
              <Input
                ref={newTaskInputRef}
                placeholder="Task name [2hr:high:before Feb 25]"
                value={newTaskInput}
                onChange={(e) => {
                  setNewTaskInput(e.target.value);
                  setSuggestionIndex(0);
                }}
                onKeyDown={(e) => {
                  if (
                    isSyntaxSuggestionOpen &&
                    (e.key === "ArrowDown" ||
                      e.key === "ArrowUp" ||
                      e.key === "Tab")
                  ) {
                    e.preventDefault();

                    if (e.key === "ArrowDown") {
                      setSuggestionIndex((prev) =>
                        getNextSuggestionIndex(
                          prev,
                          syntaxSuggestions.length,
                          "next"
                        )
                      );
                      return;
                    }

                    if (
                      e.key === "ArrowUp" ||
                      (e.key === "Tab" && e.shiftKey)
                    ) {
                      setSuggestionIndex((prev) =>
                        getNextSuggestionIndex(
                          prev,
                          syntaxSuggestions.length,
                          "previous"
                        )
                      );
                      return;
                    }

                    if (e.key === "Tab" && selectedSuggestion) {
                      setNewTaskInput((prev) =>
                        applyAutocompleteSuggestion(prev, selectedSuggestion)
                      );
                      setSuggestionIndex(0);
                      return;
                    }
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateTask();
                  } else if (e.key === "Escape") {
                    setNewTaskInput("");
                    setIsAddingTask(false);
                    setSuggestionIndex(0);
                  }
                }}
                className="h-7 text-xs"
              />
            </div>
            {isSyntaxSuggestionOpen && (
              <div className="mt-1 space-y-0.5 rounded-md border bg-popover p-1">
                {syntaxSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={cn(
                      "block w-full rounded px-1.5 py-1 text-left text-[10px]",
                      index === activeSuggestionIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setNewTaskInput((prev) =>
                        applyAutocompleteSuggestion(prev, suggestion)
                      );
                      setSuggestionIndex(0);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">
              Tab: complete, Shift+Tab/Arrow keys: navigate, Enter: create, Esc:
              cancel
            </p>
          </div>
        )}

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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {error && (
          <div className="mb-2 rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
            {error}
          </div>
        )}
        {isLoading ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            Loading tasks...
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedTasks).map(([state, stateTasks]) => (
              <Collapsible
                key={state}
                open={expandedStates[state]}
                onOpenChange={() => toggleState(state)}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                  <span>{state}</span>
                  <Badge size="sm" variant="secondary" className="text-[9px]">
                    {stateTasks.length}
                  </Badge>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-1.5 pt-1.5">
                  {stateTasks.map((task) => (
                    <div key={task.id} className="space-y-1">
                      <TaskCard
                        task={task}
                        onClick={() => onTaskSelect(task.id)}
                        onDelete={async () => {
                          await deleteTask(task.id);
                          await refetch();
                        }}
                        onComplete={async () => markDone(task)}
                      />
                      {task.subtasks?.map((subtask) => (
                        <TaskCard
                          key={subtask.id}
                          task={subtask}
                          onClick={() => onTaskSelect(subtask.id)}
                          onDelete={async () => {
                            await deleteTask(subtask.id);
                            await refetch();
                          }}
                          onComplete={async () => markDone(subtask)}
                          isSubtask
                        />
                      ))}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="space-y-1.5 border-t px-3 py-2">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>{(totalMinutes / 60).toFixed(1)}h total</span>
          </div>
          <span className="text-muted-foreground">
            {flatTasks.length} tasks
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">This week:</span>
          <div className="flex items-center gap-2">
            <span className="text-green-600">{completedThisWeek} done</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-orange-600">{dueThisWeek} due</span>
          </div>
        </div>
      </div>
    </div>
  );
}
