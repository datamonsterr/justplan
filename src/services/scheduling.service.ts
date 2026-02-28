/**
 * Scheduling Service
 * Interface for scheduling operations from API routes
 */

import { schedulingQueue } from "@/lib/redis/queue";
import type {
  SchedulingJobData,
  SchedulingJobResult,
} from "@/workers/scheduling.worker";

export interface ScheduleJobOptions {
  userId: string;
  taskIds?: string[];
  schedulingWindowDays?: number;
  optimizeExisting?: boolean;
  priority?: "low" | "normal" | "high";
}

export interface JobStatus {
  id: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  result?: SchedulingJobResult;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}

export type JobAccessResult = "owned" | "forbidden" | "not_found";

/**
 * Queue a scheduling job
 */
export async function queueSchedulingJob(
  options: ScheduleJobOptions
): Promise<{ jobId: string }> {
  const {
    userId,
    taskIds,
    schedulingWindowDays = 14,
    optimizeExisting = false,
    priority = "normal",
  } = options;

  const jobData: SchedulingJobData = {
    userId,
    taskIds,
    schedulingWindowDays,
    optimizeExisting,
  };

  const job = await schedulingQueue.add("schedule-tasks", jobData, {
    priority: priority === "high" ? 1 : priority === "low" ? 10 : 5,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });

  return { jobId: job.id! };
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const job = await schedulingQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const result = job.returnvalue as SchedulingJobResult | undefined;
  const error = job.failedReason;

  return {
    id: job.id!,
    status: state as JobStatus["status"],
    progress: job.progress as number,
    result,
    error,
    createdAt: new Date(job.timestamp),
    processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
  };
}

/**
 * Check whether a scheduling job belongs to a user.
 */
export async function checkJobAccess(
  jobId: string,
  userId: string
): Promise<JobAccessResult> {
  const job = await schedulingQueue.getJob(jobId);
  if (!job) {
    return "not_found";
  }

  if (job.data.userId !== userId) {
    return "forbidden";
  }

  return "owned";
}

/**
 * Get all active scheduling jobs for a user
 */
export async function getUserActiveJobs(userId: string): Promise<JobStatus[]> {
  const activeJobs = await schedulingQueue.getJobs(["active", "waiting"]);

  const userJobs = activeJobs.filter((job) => job.data.userId === userId);

  return Promise.all(
    userJobs.map(async (job) => {
      const state = await job.getState();
      return {
        id: job.id!,
        status: state as JobStatus["status"],
        progress: job.progress as number,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      };
    })
  );
}

/**
 * Cancel a scheduling job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await schedulingQueue.getJob(jobId);

  if (!job) {
    return false;
  }

  const state = await job.getState();

  if (state === "waiting" || state === "delayed") {
    await job.remove();
    return true;
  }

  // Can't cancel active or completed jobs
  return false;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  const [waiting, active, completed, failed] = await Promise.all([
    schedulingQueue.getWaitingCount(),
    schedulingQueue.getActiveCount(),
    schedulingQueue.getCompletedCount(),
    schedulingQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}
