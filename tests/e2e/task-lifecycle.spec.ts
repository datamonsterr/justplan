import { test, expect } from "@playwright/test";

import { signInWithPassword } from "./helpers/auth";
import { hasAuthCredentials } from "./helpers/env";
import {
  expectSignedOutRedirectToSignIn,
  expectFeatureCard,
  gotoHome,
} from "./helpers/navigation";

test.describe("Critical Path: task lifecycle", () => {
  test("exposes task management capability in public landing", async ({ page }) => {
    await gotoHome(page);
    await expectFeatureCard(page, "Smart Task Management");
    await expect(page.getByText("With Auto-Scheduling")).toBeVisible();
  });

  test("requires auth before opening task workspace", async ({ page }) => {
    await expectSignedOutRedirectToSignIn(page, "/dashboard");
  });

  test("allows task list interactions for authenticated users", async ({ page }) => {
    test.skip(
      !hasAuthCredentials(),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated checks."
    );

    await signInWithPassword(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();

    await page.getByRole("button", { name: "New Task" }).click();

    const taskInput = page.getByPlaceholder("Task name [2hr:high:before Feb 25]");
    await expect(taskInput).toBeVisible();
    await taskInput.fill("F10-04 e2e task quick entry");
    await taskInput.press("Enter");
    await expect(taskInput).toBeHidden();

    const search = page.getByPlaceholder("Search tasks...");
    await search.fill("Write API documentation");
    await expect(page.getByText("Write API documentation")).toBeVisible();

    await search.fill("task-not-found-e2e");
    await expect(page.getByText("Write API documentation")).toHaveCount(0);
  });
});
