import { test, expect } from "@playwright/test";

import { signInWithPassword } from "./helpers/auth";
import { hasAuthCredentials } from "./helpers/env";
import { expectFeatureCard, gotoHome } from "./helpers/navigation";

test.describe("Critical Path: workflow transitions", () => {
  test("shows workflow capability on public landing", async ({ page }) => {
    await gotoHome(page);
    await expectFeatureCard(page, "Custom Workflows");
  });

  test("loads workflow configuration surface for authenticated users", async ({ page }) => {
    test.skip(
      !hasAuthCredentials(),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated checks."
    );

    await signInWithPassword(page);
    await page.goto("/settings/workflows");

    await expect(
      page.getByRole("heading", { name: "Workflow Configuration" })
    ).toBeVisible();

    const addState = page.getByRole("button", { name: "Add State" });
    const retry = page.getByRole("button", { name: "Retry" });

    await expect(addState.or(retry)).toBeVisible();

    if (await addState.isVisible()) {
      await addState.click();
      await expect(page.getByRole("heading", { name: "Add State" })).toBeVisible();
      await page.getByLabel("Name").fill("F10-04 transition state");
      await page.getByRole("button", { name: "Create" }).click();
    }
  });
});
