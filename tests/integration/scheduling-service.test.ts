import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSchedulingQueue } = vi.hoisted(() => ({
  mockSchedulingQueue: {
    add: vi.fn(),
    getJob: vi.fn(),
    getJobs: vi.fn(),
    getWaitingCount: vi.fn(),
    getActiveCount: vi.fn(),
    getCompletedCount: vi.fn(),
    getFailedCount: vi.fn(),
  },
}));

vi.mock("@/lib/redis/queue", () => ({
  schedulingQueue: mockSchedulingQueue,
}));

import {
  cancelJob,
  getJobStatus,
  getQueueStats,
  getUserActiveJobs,
  queueSchedulingJob,
} from "@/services/scheduling.service";

describe("scheduling service integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queueSchedulingJob maps API options into queue job payload", async () => {
    mockSchedulingQueue.add.mockResolvedValue({ id: "job-001" });

    const result = await queueSchedulingJob({
      userId: "user-123",
      taskIds: ["task-1", "task-2"],
      schedulingWindowDays: 21,
      optimizeExisting: true,
      priority: "high",
    });

    expect(result).toEqual({ jobId: "job-001" });
    expect(mockSchedulingQueue.add).toHaveBeenCalledWith(
      "schedule-tasks",
      {
        userId: "user-123",
        taskIds: ["task-1", "task-2"],
        schedulingWindowDays: 21,
        optimizeExisting: true,
      },
      {
        priority: 1,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      }
    );
  });

  it("getJobStatus returns null for unknown job", async () => {
    mockSchedulingQueue.getJob.mockResolvedValue(null);

    const status = await getJobStatus("missing-job");

    expect(status).toBeNull();
  });

  it("getJobStatus returns normalized job status payload", async () => {
    const remove = vi.fn();
    const getState = vi.fn().mockResolvedValue("completed");

    mockSchedulingQueue.getJob.mockResolvedValue({
      id: "job-123",
      data: { userId: "user-123" },
      getState,
      remove,
      returnvalue: { scheduledCount: 4 },
      failedReason: undefined,
      progress: 100,
      timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
      processedOn: Date.parse("2026-01-01T00:01:00.000Z"),
      finishedOn: Date.parse("2026-01-01T00:02:00.000Z"),
    });

    const status = await getJobStatus("job-123");

    expect(status).toEqual({
      id: "job-123",
      status: "completed",
      progress: 100,
      result: { scheduledCount: 4 },
      error: undefined,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      processedAt: new Date("2026-01-01T00:01:00.000Z"),
      finishedAt: new Date("2026-01-01T00:02:00.000Z"),
    });
  });

  it("getUserActiveJobs filters queue jobs by user", async () => {
    const firstState = vi.fn().mockResolvedValue("active");
    const secondState = vi.fn().mockResolvedValue("waiting");

    mockSchedulingQueue.getJobs.mockResolvedValue([
      {
        id: "job-1",
        data: { userId: "user-123" },
        getState: firstState,
        progress: 40,
        timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
        processedOn: Date.parse("2026-01-01T00:01:00.000Z"),
      },
      {
        id: "job-2",
        data: { userId: "user-other" },
        getState: secondState,
        progress: 10,
        timestamp: Date.parse("2026-01-01T00:03:00.000Z"),
      },
    ]);

    const jobs = await getUserActiveJobs("user-123");

    expect(jobs).toEqual([
      {
        id: "job-1",
        status: "active",
        progress: 40,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        processedAt: new Date("2026-01-01T00:01:00.000Z"),
      },
    ]);
    expect(mockSchedulingQueue.getJobs).toHaveBeenCalledWith(["active", "waiting"]);
  });

  it("cancelJob removes waiting jobs and rejects active jobs", async () => {
    const waitingRemove = vi.fn().mockResolvedValue(undefined);
    const waitingJob = {
      getState: vi.fn().mockResolvedValue("waiting"),
      remove: waitingRemove,
    };

    mockSchedulingQueue.getJob.mockResolvedValueOnce(waitingJob);

    await expect(cancelJob("job-waiting")).resolves.toBe(true);
    expect(waitingRemove).toHaveBeenCalledTimes(1);

    const activeJob = {
      getState: vi.fn().mockResolvedValue("active"),
      remove: vi.fn(),
    };

    mockSchedulingQueue.getJob.mockResolvedValueOnce(activeJob);

    await expect(cancelJob("job-active")).resolves.toBe(false);
    expect(activeJob.remove).not.toHaveBeenCalled();
  });

  it("getQueueStats returns queue counters", async () => {
    mockSchedulingQueue.getWaitingCount.mockResolvedValue(4);
    mockSchedulingQueue.getActiveCount.mockResolvedValue(2);
    mockSchedulingQueue.getCompletedCount.mockResolvedValue(12);
    mockSchedulingQueue.getFailedCount.mockResolvedValue(1);

    const stats = await getQueueStats();

    expect(stats).toEqual({
      waiting: 4,
      active: 2,
      completed: 12,
      failed: 1,
    });
  });
});
