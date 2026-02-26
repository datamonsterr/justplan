/**
 * Scheduling Progress Indicator
 * Shows active scheduling job progress in the navbar
 */

"use client";

import { useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, Calendar, X } from "lucide-react";
import { useScheduling } from "@/hooks/use-scheduling";
import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SchedulingProgressProps {
  className?: string;
}

export function SchedulingProgress({ className }: SchedulingProgressProps) {
  const { activeJob, fetchQueueStats, cancelJob } = useScheduling();

  // Fetch initial queue stats on mount
  useEffect(() => {
    fetchQueueStats();
    // Poll stats every 30 seconds
    const interval = setInterval(fetchQueueStats, 30000);
    return () => clearInterval(interval);
  }, [fetchQueueStats]);

  // No active job
  if (!activeJob) {
    return null;
  }

  const isRunning = activeJob.status === "active" || activeJob.status === "waiting";
  const isCompleted = activeJob.status === "completed";
  const isFailed = activeJob.status === "failed";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
            "transition-all duration-300",
            isRunning && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            isCompleted && "bg-green-500/10 text-green-600 dark:text-green-400",
            isFailed && "bg-red-500/10 text-red-600 dark:text-red-400",
            className
          )}
        >
          {isRunning && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Scheduling...</span>
              <span className="font-medium">{activeJob.progress}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-blue-500/20"
                onClick={() => cancelJob(activeJob.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}

          {isCompleted && activeJob.result && (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {activeJob.result.scheduled} tasks scheduled
              </span>
              <span className="sm:hidden">
                {activeJob.result.scheduled}
              </span>
            </>
          )}

          {isFailed && (
            <>
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Scheduling failed</span>
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {isRunning && (
          <div className="space-y-1">
            <p className="font-medium">Auto-scheduling in progress</p>
            <p className="text-muted-foreground">
              Finding optimal time slots for your tasks...
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>
          </div>
        )}

        {isCompleted && activeJob.result && (
          <div className="space-y-1">
            <p className="font-medium">Scheduling complete</p>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• {activeJob.result.scheduled} tasks scheduled</li>
              {activeJob.result.unscheduled > 0 && (
                <li>• {activeJob.result.unscheduled} tasks could not be scheduled</li>
              )}
              <li>
                • Utilization: {activeJob.result.stats.utilizationPercent}%
              </li>
            </ul>
            {activeJob.result.warnings.length > 0 && (
              <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                ⚠️ {activeJob.result.warnings[0]}
              </p>
            )}
          </div>
        )}

        {isFailed && (
          <div className="space-y-1">
            <p className="font-medium text-red-600 dark:text-red-400">
              Scheduling failed
            </p>
            <p className="text-muted-foreground text-xs">
              {activeJob.error || "An error occurred while scheduling tasks"}
            </p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Schedule Button for triggering manual scheduling
 */
interface ScheduleButtonProps {
  taskIds?: string[];
  optimizeExisting?: boolean;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ScheduleButton({
  taskIds,
  optimizeExisting = false,
  variant = "outline",
  size = "sm",
  className,
}: ScheduleButtonProps) {
  const { isQueueing, queueSchedulingJob, activeJob } = useScheduling();

  const handleClick = async () => {
    await queueSchedulingJob({
      taskIds,
      optimizeExisting,
      priority: "normal",
    });
  };

  const isDisabled = isQueueing || !!activeJob;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          disabled={isDisabled}
          className={className}
        >
          {isQueueing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">
            {optimizeExisting ? "Reschedule" : "Auto-schedule"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {optimizeExisting
          ? "Re-optimize task schedule"
          : "Automatically schedule unscheduled tasks"}
      </TooltipContent>
    </Tooltip>
  );
}
