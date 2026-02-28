import { test, expect } from "@playwright/test";

import { signInWithPassword } from "./helpers/auth";
import { hasAuthCredentials } from "./helpers/env";
import {
  expectSignedOutRedirectToSignIn,
  expectFeatureCard,
  gotoHome,
} from "./helpers/navigation";

test.describe("Critical Path: auth", () => {
  test("shows public auth entry points", async ({ page }) => {
    await gotoHome(page);
    await expectFeatureCard(page, "Smart Task Management");
    await expect(page.getByRole("button", { name: "Sign In" }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Get Started/i }).first()
    ).toBeVisible();
  });

  test("protects dashboard for signed-out users", async ({ page }) => {
    await expectSignedOutRedirectToSignIn(page, "/dashboard");
  });

  test("allows signed-in users to open dashboard", async ({ page }) => {
    test.skip(
      !hasAuthCredentials(),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated checks."
    );

    await signInWithPassword(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Task" })).toBeVisible();
  });
});
