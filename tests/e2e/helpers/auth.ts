import { expect, type Page } from "@playwright/test";
import { e2eEnv } from "./env";

const getFirstVisible = async (page: Page, selectors: string[]) => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0 && (await locator.isVisible())) {
      return locator;
    }
  }

  return null;
};

export const signInWithPassword = async (page: Page): Promise<void> => {
  if (!e2eEnv.authEmail || !e2eEnv.authPassword) {
    throw new Error("E2E auth credentials are missing");
  }

  await page.goto("/sign-in");
  await page.waitForLoadState("domcontentloaded");

  const identifier = await getFirstVisible(page, [
    'input[name="identifier"]',
    'input[name="emailAddress"]',
    'input[type="email"]',
  ]);

  if (!identifier) {
    throw new Error("Unable to find Clerk identifier input");
  }

  await identifier.fill(e2eEnv.authEmail);

  const nextOrSignIn = page
    .getByRole("button", { name: /continue|sign in/i })
    .first();

  const inlinePassword = await getFirstVisible(page, [
    'input[name="password"]',
    'input[type="password"]',
  ]);

  if (inlinePassword) {
    await inlinePassword.fill(e2eEnv.authPassword);
    await nextOrSignIn.click();
  } else {
    await nextOrSignIn.click();

    const password = page
      .locator('input[name="password"], input[type="password"]')
      .first();

    await expect(password).toBeVisible({ timeout: 15000 });
    await password.fill(e2eEnv.authPassword);

    await page.getByRole("button", { name: /sign in|continue/i }).first().click();
  }

  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
};
