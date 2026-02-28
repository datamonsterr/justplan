import { expect, type Page } from "@playwright/test";

export const gotoHome = async (page: Page): Promise<void> => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Smart Task Management" })
  ).toBeVisible();
};

export const expectSignedOutRedirectToSignIn = async (
  page: Page,
  path: string
): Promise<void> => {
  await page.goto(path);
  await expect(page).toHaveURL(/\/sign-in/);
};

export const expectFeatureCard = async (
  page: Page,
  title: string
): Promise<void> => {
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
};
