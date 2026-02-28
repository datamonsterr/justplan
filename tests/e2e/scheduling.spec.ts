import { test, expect } from "@playwright/test";

import { signInWithPassword } from "./helpers/auth";
import { hasAuthCredentials } from "./helpers/env";
import { expectFeatureCard, gotoHome } from "./helpers/navigation";

test.describe("Critical Path: scheduling", () => {
  test("shows scheduling value proposition on landing page", async ({ page }) => {
    await gotoHome(page);
    await expectFeatureCard(page, "Auto-Scheduling");
    await expect(
      page.getByText("Tasks automatically placed on your calendar")
    ).toBeVisible();
  });

  test("supports calendar navigation and schedule panel interactions", async ({ page }) => {
    test.skip(
      !hasAuthCredentials(),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated checks."
    );

    await signInWithPassword(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("button", { name: "Today" })).toBeVisible();

    const viewSelect = page.getByRole("combobox").first();
    await viewSelect.click();
    await page.getByRole("option", { name: "Month" }).click();
    await expect(page.getByText("Month view coming soon...")).toBeVisible();

    await viewSelect.click();
    await page.getByRole("option", { name: "Week" }).click();

    await page.getByText("Team standup").first().click();
    await expect(page.getByRole("button", { name: "Reschedule" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete" })).toBeVisible();
  });
});
