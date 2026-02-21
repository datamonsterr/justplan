"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimeBlock {
  id: string;
  taskId: string;
  title: string;
  startTime: Date;
  duration: number; // minutes
  state: "backlog" | "ready" | "progress" | "blocked" | "review" | "done";
  type: "scheduled" | "suggested" | "pinned";
  subtaskCount?: number;
}

interface CalendarViewProps {
  onTaskSelect: (taskId: string) => void;
}

const stateColors = {
  backlog: "bg-gray-500/10 border-gray-500",
  ready: "bg-blue-500/10 border-blue-500",
  progress: "bg-orange-500/10 border-orange-500",
  blocked: "bg-red-500/10 border-red-500",
  review: "bg-purple-500/10 border-purple-500",
  done: "bg-green-500/10 border-green-500",
};

// Mock data
const mockTimeBlocks: TimeBlock[] = [
  {
    id: "1",
    taskId: "t1",
    title: "Team standup",
    startTime: new Date("2026-02-21T09:00:00"),
    duration: 30,
    state: "progress",
    type: "scheduled",
  },
  {
    id: "2",
    taskId: "t2",
    title: "Write documentation",
    startTime: new Date("2026-02-21T10:00:00"),
    duration: 120,
    state: "progress",
    type: "scheduled",
  },
  {
    id: "3",
    taskId: "t3",
    title: "Review pull requests",
    startTime: new Date("2026-02-21T13:00:00"),
    duration: 45,
    state: "ready",
    type: "scheduled",
    subtaskCount: 2,
  },
  {
    id: "4",
    taskId: "t4",
    title: "Design mockups (suggested)",
    startTime: new Date("2026-02-21T14:00:00"),
    duration: 90,
    state: "ready",
    type: "suggested",
  },
];

function TimeBlockComponent({ block, onClick }: { block: TimeBlock; onClick: () => void }) {
  const height = (block.duration / 15) * 20; // 20px per 15 minutes

  return (
    <div
      className={cn(
        "group absolute left-0 right-0 cursor-pointer overflow-hidden rounded-sm border-l-3 px-1 py-0.5 transition-all hover:shadow-md hover:z-10",
        stateColors[block.state],
        block.type === "suggested" && "border-dashed border-2 opacity-75",
        block.type === "pinned" && "ring-1 ring-accent"
      )}
      style={{
        height: `${height}px`,
        minHeight: "20px",
      }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium leading-tight line-clamp-1">
          {block.title}
        </p>
        <div className="flex items-center gap-1">
          <Badge size="sm" variant="secondary" className="text-[9px]">
            {block.duration}m
          </Badge>
          {block.subtaskCount && (
            <Badge size="sm" variant="outline" className="text-[9px]">
              {block.subtaskCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ onTaskSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<"day" | "week" | "month">("week");
  const [today] = React.useState(() => new Date().toDateString());

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  // Calculate time block positions
  const getBlockPosition = (block: TimeBlock) => {
    const hour = block.startTime.getHours();
    const minutes = block.startTime.getMinutes();
    const top = (hour * 60 + minutes) / 15 * 20; // 20px per 15 minutes
    return top;
  };

  // Filter blocks for specific date (for week view)
  const getBlocksForDate = (date: Date) => {
    return mockTimeBlocks.filter(block => {
      const blockDate = new Date(block.startTime);
      return blockDate.toDateString() === date.toDateString();
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (view === "week") {
      const start = weekDates[0];
      const end = weekDates[6];
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Calendar Header */}
      <div className="shrink-0 flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            {getDateRangeText()}
          </h2>
        </div>

        <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
          <SelectTrigger className="h-6 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day" className="text-xs">Day</SelectItem>
            <SelectItem value="week" className="text-xs">Week</SelectItem>
            <SelectItem value="month" className="text-xs">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="flex-1 min-h-0">
        {view === "day" ? (
          // Day View
          <div className="relative">
            {/* Time labels */}
            <div className="sticky left-0 z-10 float-left w-16 border-r bg-muted/50">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex h-20 items-start justify-end border-b border-border/50 pr-2 pt-0.5"
                >
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="ml-16">
              {/* Grid lines */}
              <div className="relative h-full">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-20 border-b border-border/30"
                  />
                ))}

                {/* Time blocks */}
                <div className="absolute inset-0">
                  {mockTimeBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="absolute left-0 right-0 px-1"
                      style={{
                        top: `${getBlockPosition(block)}px`,
                      }}
                    >
                      <TimeBlockComponent
                        block={block}
                        onClick={() => onTaskSelect(block.taskId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : view === "week" ? (
          // Week View
          <div className="flex min-w-0 w-full">
            {/* Time labels */}
            <div className="sticky left-0 z-10 w-16 shrink-0 border-r bg-muted/50">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex h-20 items-start justify-end border-b border-border/50 pr-2 pt-0.5"
                >
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex flex-1 min-w-0">
              {weekDates.map((date, index) => {
                const isToday = date.toDateString() === today;
                const blocksForDay = getBlocksForDate(date);
                
                return (
                  <div key={index} className="flex-1 min-w-0 border-r last:border-r-0">
                    {/* Day header - make it sticky within scrollarea */}
                    <div className={cn(
                      "sticky top-0 z-20 border-b bg-muted/50 px-2 py-1 text-center",
                      isToday && "bg-primary/10"
                    )}>
                      <div className="text-[10px] font-medium text-muted-foreground">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className={cn(
                        "text-xs font-semibold",
                        isToday && "text-primary"
                      )}>
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Day grid */}
                    <div className="relative">
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="h-20 border-b border-border/30"
                        />
                      ))}

                      {/* Time blocks for this day */}
                      <div className="absolute inset-0">
                        {blocksForDay.map((block) => (
                          <div
                            key={block.id}
                            className="absolute left-0 right-0 px-0.5"
                            style={{
                              top: `${getBlockPosition(block)}px`,
                            }}
                          >
                            <TimeBlockComponent
                              block={block}
                              onClick={() => onTaskSelect(block.taskId)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Month View (simplified placeholder)
          <div className="p-4 text-center text-sm text-muted-foreground">
            Month view coming soon...
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
