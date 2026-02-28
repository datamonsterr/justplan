import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, mockCreateTaskService } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateTaskService: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/services/task.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/task.service")>(
    "@/services/task.service"
  );

  return {
    ...actual,
    createTaskService: mockCreateTaskService,
  };
});

import { DELETE, GET as getTaskById, PATCH } from "@/app/api/tasks/[id]/route";
import { GET, POST } from "@/app/api/tasks/route";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

describe("tasks API integration", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const taskService = {
    getAllTasks: vi.fn(),
    createTask: vi.fn(),
    getTaskById: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    mockCreateClient.mockResolvedValue(mockSupabase);
    mockCreateTaskService.mockReturnValue(taskService);

    taskService.getAllTasks.mockResolvedValue({ success: true, data: [] });
    taskService.createTask.mockResolvedValue({ success: true, data: { id: "task-1" } });
    taskService.getTaskById.mockResolvedValue({ success: true, data: { id: "task-1" } });
    taskService.updateTask.mockResolvedValue({ success: true, data: { id: "task-1" } });
    taskService.deleteTask.mockResolvedValue({ success: true, data: { id: "task-1", deleted: true } });
  });

  it("GET /api/tasks returns tasks with parsed query options", async () => {
    taskService.getAllTasks.mockResolvedValue({
      success: true,
      data: [{ id: "task-1", title: "Task" }],
    });

    const request = new NextRequest(
      "http://localhost/api/tasks?includeSubtasks=true&workflowStateId=workflow-1&priority=high&parentOnly=true"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [{ id: "task-1", title: "Task" }] });
    expect(taskService.getAllTasks).toHaveBeenCalledWith({
      includeSubtasks: true,
      workflowStateId: "workflow-1",
      priority: "high",
      parentOnly: true,
    });
    expect(mockCreateTaskService).toHaveBeenCalledWith(mockSupabase, "user-123");
  });

  it("GET /api/tasks falls back to mock user when auth is missing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/tasks");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockCreateTaskService).toHaveBeenCalledWith(mockSupabase, MOCK_USER_ID);
  });

  it("POST /api/tasks returns 400 on schema validation failure", async () => {
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "",
        estimatedDurationMinutes: 0,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Title is required");
    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it("GET /api/tasks/[id] returns 404 when service reports missing task", async () => {
    taskService.getTaskById.mockResolvedValue({
      success: false,
      error: "Task not found",
    });

    const request = new NextRequest("http://localhost/api/tasks/task-404");
    const response = await getTaskById(request, {
      params: Promise.resolve({ id: "task-404" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Task not found" });
  });

  it("PATCH /api/tasks/[id] rejects invalid update payload", async () => {
    const request = new NextRequest("http://localhost/api/tasks/task-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        priority: "urgent",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "task-1" }),
    });

    expect(response.status).toBe(400);
    expect(taskService.updateTask).not.toHaveBeenCalled();
  });

  it("DELETE /api/tasks/[id] returns deleted payload", async () => {
    taskService.deleteTask.mockResolvedValue({
      success: true,
      data: { id: "task-1", deleted: true },
    });

    const request = new NextRequest("http://localhost/api/tasks/task-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "task-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { id: "task-1", deleted: true } });
    expect(taskService.deleteTask).toHaveBeenCalledWith("task-1");
  });
});
