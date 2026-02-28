import { test, expect } from "@playwright/test";

import { signInWithPassword } from "./helpers/auth";
import { canRunGoogleOAuthE2E, hasAuthCredentials } from "./helpers/env";
import {
  expectFeatureCard,
  gotoHome,
} from "./helpers/navigation";

test.describe("Critical Path: google sync", () => {
  test("shows google integration value on landing", async ({ page }) => {
    await gotoHome(page);
    await expectFeatureCard(page, "Google Integration");
    await expect(
      page.getByText("Two-way sync with Google Calendar and Tasks")
    ).toBeVisible();
  });

  test("keeps google endpoints behind auth", async ({ page }) => {
    const response = await page.request.get("/api/google", {
      maxRedirects: 0,
    });

    expect([307, 401, 403, 404]).toContain(response.status());
  });

  test("starts OAuth redirect when explicitly enabled", async ({ page }) => {
    test.skip(
      !canRunGoogleOAuthE2E(),
      "Requires E2E_AUTH_EMAIL, E2E_AUTH_PASSWORD, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and E2E_ENABLE_GOOGLE_OAUTH=true."
    );

    await signInWithPassword(page);

    const response = await page.request.get("/api/google", {
      maxRedirects: 0,
    });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);

    const location = response.headers()["location"];
    expect(location).toContain("accounts.google.com");
  });

  test("shows integrations settings route for authenticated users", async ({ page }) => {
    test.skip(
      !hasAuthCredentials(),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated checks."
    );

    await signInWithPassword(page);
    await page.goto("/settings?section=integrations");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Integrations")).toBeVisible();
  });
});
