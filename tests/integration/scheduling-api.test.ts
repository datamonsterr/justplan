import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockQueueSchedulingJob,
  mockGetQueueStats,
  mockGetUserActiveJobs,
  mockGetJobStatus,
  mockCancelJob,
} = vi.hoisted(() => ({
  mockQueueSchedulingJob: vi.fn(),
  mockGetQueueStats: vi.fn(),
  mockGetUserActiveJobs: vi.fn(),
  mockGetJobStatus: vi.fn(),
  mockCancelJob: vi.fn(),
}));

vi.mock("@/services/scheduling.service", () => ({
  queueSchedulingJob: mockQueueSchedulingJob,
  getQueueStats: mockGetQueueStats,
  getUserActiveJobs: mockGetUserActiveJobs,
  getJobStatus: mockGetJobStatus,
  cancelJob: mockCancelJob,
}));

import { GET, POST } from "@/app/api/scheduling/route";
import { DELETE, GET as GET_JOB } from "@/app/api/scheduling/jobs/[jobId]/route";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

describe("scheduling API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockQueueSchedulingJob.mockResolvedValue({ jobId: "job-123" });
    mockGetQueueStats.mockResolvedValue({
      waiting: 1,
      active: 2,
      completed: 3,
      failed: 4,
    });
    mockGetUserActiveJobs.mockResolvedValue([{ id: "job-123", status: "active" }]);
    mockGetJobStatus.mockResolvedValue({ id: "job-123", status: "completed" });
    mockCancelJob.mockResolvedValue(true);
  });

  it("POST /api/scheduling queues a job with defaults", async () => {
    const request = new NextRequest("http://localhost/api/scheduling", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        jobId: "job-123",
        message: "Scheduling job queued",
      },
    });
    expect(mockQueueSchedulingJob).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
      taskIds: undefined,
      schedulingWindowDays: 14,
      optimizeExisting: false,
      priority: "normal",
    });
  });

  it("POST /api/scheduling returns 400 for invalid request body", async () => {
    const request = new NextRequest("http://localhost/api/scheduling", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        schedulingWindowDays: 0,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mockQueueSchedulingJob).not.toHaveBeenCalled();
  });

  it("GET /api/scheduling returns queue stats and active jobs", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        stats: {
          waiting: 1,
          active: 2,
          completed: 3,
          failed: 4,
        },
        activeJobs: [{ id: "job-123", status: "active" }],
      },
    });
    expect(mockGetUserActiveJobs).toHaveBeenCalledWith(MOCK_USER_ID);
  });

  it("GET /api/scheduling/jobs/[jobId] returns 404 for unknown jobs", async () => {
    mockGetJobStatus.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/scheduling/jobs/missing");
    const response = await GET_JOB(request, {
      params: Promise.resolve({ jobId: "missing" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Job not found" });
  });

  it("DELETE /api/scheduling/jobs/[jobId] returns 400 when cancellation fails", async () => {
    mockCancelJob.mockResolvedValue(false);

    const request = new NextRequest("http://localhost/api/scheduling/jobs/job-123", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ jobId: "job-123" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Cannot cancel job (may be already running or completed)",
    });
  });
});
