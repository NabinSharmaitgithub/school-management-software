import { test, expect } from "@playwright/test";

test.describe("Dev Server Check", () => {
  test("Login page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Welcome Back");
  });
});
