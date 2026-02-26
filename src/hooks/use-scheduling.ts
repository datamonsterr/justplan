/**
 * Scheduling Hooks
 * Client-side hooks for scheduling operations
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface SchedulingJobStatus {
  id: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  result?: {
    success: boolean;
    scheduled: number;
    unscheduled: number;
    warnings: string[];
    stats: {
      totalTasksProcessed: number;
      tasksScheduled: number;
      tasksSkipped: number;
      totalScheduledMinutes: number;
      utilizationPercent: number;
    };
  };
  error?: string;
}

interface SchedulingOptions {
  taskIds?: string[];
  schedulingWindowDays?: number;
  optimizeExisting?: boolean;
  priority?: "low" | "normal" | "high";
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export function useScheduling() {
  const [isQueueing, setIsQueueing] = useState(false);
  const [activeJob, setActiveJob] = useState<SchedulingJobStatus | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Queue a new scheduling job
   */
  const queueSchedulingJob = useCallback(async (options: SchedulingOptions = {}) => {
    setIsQueueing(true);
    setError(null);

    try {
      const response = await fetch("/api/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to queue scheduling job");
      }

      // Start polling for job status
      pollJobStatus(result.data.jobId);

      return result.data.jobId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setIsQueueing(false);
    }
  }, []);

  /**
   * Poll job status until complete
   */
  const pollJobStatus = useCallback((jobId: string) => {
    // Clear any existing poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/scheduling/jobs/${jobId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to get job status");
        }

        const status = result.data as SchedulingJobStatus;
        setActiveJob(status);

        // Stop polling if job is done
        if (status.status === "completed" || status.status === "failed") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Clear active job after a delay
          setTimeout(() => setActiveJob(null), 5000);
        }
      } catch {
        // Stop polling on error
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval
    pollIntervalRef.current = setInterval(poll, 1000);
  }, []);

  /**
   * Fetch queue statistics
   */
  const fetchQueueStats = useCallback(async () => {
    try {
      const response = await fetch("/api/scheduling");
      const result = await response.json();

      if (response.ok) {
        setQueueStats(result.data.stats);
        
        // If there are active jobs for this user, poll them
        if (result.data.activeJobs?.length > 0) {
          const latestJob = result.data.activeJobs[0];
          pollJobStatus(latestJob.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch queue stats:", err);
    }
  }, [pollJobStatus]);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/scheduling/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setActiveJob(null);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to cancel job:", err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    isQueueing,
    activeJob,
    queueStats,
    error,
    queueSchedulingJob,
    fetchQueueStats,
    cancelJob,
  };
}
