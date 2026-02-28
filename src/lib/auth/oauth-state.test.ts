import { afterEach, describe, expect, it } from "vitest";
import {
  createSignedOAuthState,
  isSafeRelativeReturnUrl,
  verifySignedOAuthState,
} from "./oauth-state";

describe("oauth-state", () => {
  const originalSecret = process.env.OAUTH_STATE_SECRET;

  afterEach(() => {
    process.env.OAUTH_STATE_SECRET = originalSecret;
  });

  it("creates and verifies a signed state token", () => {
    process.env.OAUTH_STATE_SECRET = "test-secret";

    const token = createSignedOAuthState({
      subject: "user_123",
      returnUrl: "/settings",
      now: new Date("2026-02-27T00:00:00.000Z"),
      ttlSeconds: 600,
    });

    const verified = verifySignedOAuthState(
      token,
      new Date("2026-02-27T00:05:00.000Z")
    );

    expect(verified.sub).toBe("user_123");
    expect(verified.returnUrl).toBe("/settings");
    expect(verified.exp).toBeGreaterThan(verified.iat);
    expect(verified.nonce).toBeDefined();
  });

  it("rejects tampered state tokens", () => {
    process.env.OAUTH_STATE_SECRET = "test-secret";

    const token = createSignedOAuthState({
      subject: "user_123",
      returnUrl: "/settings",
    });

    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: "user_123",
        returnUrl: "/admin",
        iat: 1,
        exp: 9999999999,
        nonce: "abc",
      }),
      "utf8"
    ).toString("base64url");

    expect(() =>
      verifySignedOAuthState(`${tamperedPayload}.${signature}`)
    ).toThrow("Invalid OAuth state signature");
    expect(() => verifySignedOAuthState(`${payload}.bad-signature`)).toThrow(
      "Invalid OAuth state signature"
    );
  });

  it("rejects expired tokens", () => {
    process.env.OAUTH_STATE_SECRET = "test-secret";

    const token = createSignedOAuthState({
      subject: "user_123",
      returnUrl: "/settings",
      now: new Date("2026-02-27T00:00:00.000Z"),
      ttlSeconds: 60,
    });

    expect(() =>
      verifySignedOAuthState(token, new Date("2026-02-27T00:02:00.000Z"))
    ).toThrow("OAuth state expired");
  });

  it("validates safe relative return URLs", () => {
    expect(isSafeRelativeReturnUrl("/settings")).toBe(true);
    expect(isSafeRelativeReturnUrl("/dashboard?tab=calendar")).toBe(true);
    expect(isSafeRelativeReturnUrl("https://evil.com")).toBe(false);
    expect(isSafeRelativeReturnUrl("//evil.com")).toBe(false);
    expect(isSafeRelativeReturnUrl("/path\\with-backslash")).toBe(false);
  });
});

