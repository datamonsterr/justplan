import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetAuthorizationUrl,
  mockExchangeCodeForTokens,
  mockSaveUserTokens,
  mockIsGoogleConnected,
  mockGoogleSyncQueue,
} = vi.hoisted(() => ({
  mockGetAuthorizationUrl: vi.fn(),
  mockExchangeCodeForTokens: vi.fn(),
  mockSaveUserTokens: vi.fn(),
  mockIsGoogleConnected: vi.fn(),
  mockGoogleSyncQueue: {
    add: vi.fn(),
    getWaitingCount: vi.fn(),
    getActiveCount: vi.fn(),
  },
}));

vi.mock("@/lib/google", () => ({
  getAuthorizationUrl: mockGetAuthorizationUrl,
  exchangeCodeForTokens: mockExchangeCodeForTokens,
  saveUserTokens: mockSaveUserTokens,
  isGoogleConnected: mockIsGoogleConnected,
}));

vi.mock("@/lib/redis/queue", () => ({
  googleSyncQueue: mockGoogleSyncQueue,
}));

import { GET as googleOAuthGet } from "@/app/api/google/route";
import { GET as googleCallbackGet } from "@/app/api/google/callback/route";
import { GET as syncGet, POST as syncPost } from "@/app/api/google/sync/route";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

describe("google API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAuthorizationUrl.mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth?state=test");
    mockExchangeCodeForTokens.mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expiry_date: Date.parse("2026-01-02T00:00:00.000Z"),
    });
    mockSaveUserTokens.mockResolvedValue(undefined);

    mockIsGoogleConnected.mockResolvedValue(true);
    mockGoogleSyncQueue.add.mockResolvedValue({ id: "sync-job-1" });
    mockGoogleSyncQueue.getWaitingCount.mockResolvedValue(2);
    mockGoogleSyncQueue.getActiveCount.mockResolvedValue(1);
  });

  it("GET /api/google returns redirect to OAuth URL with encoded state", async () => {
    const response = await googleOAuthGet();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth?state=test"
    );

    const state = mockGetAuthorizationUrl.mock.calls[0][0] as string;
    const decodedState = JSON.parse(Buffer.from(state, "base64url").toString());

    expect(decodedState).toEqual({
      userId: MOCK_USER_ID,
      returnUrl: "/settings",
    });
  });

  it("GET /api/google/callback redirects with missing code error", async () => {
    const state = Buffer.from(
      JSON.stringify({
        userId: MOCK_USER_ID,
        returnUrl: "/settings",
      })
    ).toString("base64url");

    const request = new NextRequest(
      `http://localhost/api/google/callback?state=${state}`
    );

    const response = await googleCallbackGet(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/settings?error=google_oauth_no_code"
    );
    expect(mockExchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it("GET /api/google/callback exchanges tokens and persists them", async () => {
    const state = Buffer.from(
      JSON.stringify({
        userId: "user-123",
        returnUrl: "/settings/integrations",
      })
    ).toString("base64url");

    const request = new NextRequest(
      `http://localhost/api/google/callback?code=auth-code&state=${state}`
    );

    const response = await googleCallbackGet(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/settings/integrations?google_connected=true"
    );
    expect(mockExchangeCodeForTokens).toHaveBeenCalledWith("auth-code");
    expect(mockSaveUserTokens).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ access_token: "access-token" })
    );
  });

  it("POST /api/google/sync returns 400 when Google is not connected", async () => {
    mockIsGoogleConnected.mockResolvedValue(false);

    const request = new NextRequest("http://localhost/api/google/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await syncPost(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Google account not connected" });
    expect(mockGoogleSyncQueue.add).not.toHaveBeenCalled();
  });

  it("POST /api/google/sync validates sync request payload", async () => {
    const request = new NextRequest("http://localhost/api/google/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ daysBack: 0 }),
    });

    const response = await syncPost(request);

    expect(response.status).toBe(400);
    expect(mockGoogleSyncQueue.add).not.toHaveBeenCalled();
  });

  it("POST /api/google/sync queues sync job with parsed payload", async () => {
    const request = new NextRequest("http://localhost/api/google/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        syncType: "calendar",
        daysBack: 14,
        daysForward: 45,
      }),
    });

    const response = await syncPost(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        jobId: "sync-job-1",
        message: "Sync job queued",
      },
    });
    expect(mockGoogleSyncQueue.add).toHaveBeenCalledWith(
      "sync",
      {
        userId: MOCK_USER_ID,
        syncType: "calendar",
        daysBack: 14,
        daysForward: 45,
      },
      {
        priority: 5,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );
  });

  it("GET /api/google/sync returns connection and queue stats", async () => {
    const response = await syncGet();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        connected: true,
        queueStats: {
          waiting: 2,
          active: 1,
        },
      },
    });
  });
});
