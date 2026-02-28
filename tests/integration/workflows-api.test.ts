import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, mockCreateWorkflowService } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateWorkflowService: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/services/workflow.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/workflow.service")>(
    "@/services/workflow.service"
  );

  return {
    ...actual,
    createWorkflowService: mockCreateWorkflowService,
  };
});

import { DELETE, GET as getWorkflowById, PATCH } from "@/app/api/workflows/[id]/route";
import { GET, POST } from "@/app/api/workflows/route";

describe("workflows API integration", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const workflowService = {
    getAllStates: vi.fn(),
    createState: vi.fn(),
    getStateById: vi.fn(),
    updateState: vi.fn(),
    deleteState: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    mockCreateClient.mockResolvedValue(mockSupabase);
    mockCreateWorkflowService.mockReturnValue(workflowService);

    workflowService.getAllStates.mockResolvedValue({ success: true, data: [] });
    workflowService.createState.mockResolvedValue({ success: true, data: { id: "state-1" } });
    workflowService.getStateById.mockResolvedValue({ success: true, data: { id: "state-1" } });
    workflowService.updateState.mockResolvedValue({ success: true, data: { id: "state-1" } });
    workflowService.deleteState.mockResolvedValue({ success: true, data: { id: "state-1", deleted: true } });
  });

  it("GET /api/workflows returns workflow states", async () => {
    workflowService.getAllStates.mockResolvedValue({
      success: true,
      data: [{ id: "state-1", name: "Inbox" }],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [{ id: "state-1", name: "Inbox" }] });
    expect(mockCreateWorkflowService).toHaveBeenCalledWith(mockSupabase, "user-123");
  });

  it("POST /api/workflows returns 400 on invalid payload", async () => {
    const request = new NextRequest("http://localhost/api/workflows", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "",
        color: "not-a-color",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Name is required");
    expect(workflowService.createState).not.toHaveBeenCalled();
  });

  it("GET /api/workflows/[id] returns 404 when state does not exist", async () => {
    workflowService.getStateById.mockResolvedValue({
      success: false,
      error: "State not found",
    });

    const request = new NextRequest("http://localhost/api/workflows/state-404");
    const response = await getWorkflowById(request, {
      params: Promise.resolve({ id: "state-404" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "State not found" });
  });

  it("PATCH /api/workflows/[id] rejects invalid update payload", async () => {
    const request = new NextRequest("http://localhost/api/workflows/state-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        color: "oops",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "state-1" }),
    });

    expect(response.status).toBe(400);
    expect(workflowService.updateState).not.toHaveBeenCalled();
  });

  it("DELETE /api/workflows/[id] returns deleted status", async () => {
    const request = new NextRequest("http://localhost/api/workflows/state-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "state-1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { id: "state-1", deleted: true },
    });
    expect(workflowService.deleteState).toHaveBeenCalledWith("state-1");
  });
});
