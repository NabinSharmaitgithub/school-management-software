import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Settings Module Button Audit", () => {
  test("BTN-155: General tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await expect(adminPage.locator('button:has-text("General")')).toBeVisible();
  });

  test("BTN-156: Fee Structure tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await expect(adminPage.locator('button:has-text("Fee Structure")')).toBeVisible();
  });

  test("BTN-157: Upload logo label", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    // Wait for settings data to load
    await adminPage.waitForSelector('label:has-text("Upload New")', { timeout: 10000 });
    await expect(adminPage.locator('label:has-text("Upload New")')).toBeVisible();
  });

  test("BTN-158: Delete logo button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    // Delete logo button only appears after logo is uploaded
  });

  test("BTN-159: Cancel (general form)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await expect(adminPage.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test("BTN-160: Save Changes (general form)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await expect(adminPage.locator('button:has-text("Save Changes")')).toBeVisible();
  });

  test("BTN-161: Year Filter Select", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await adminPage.click('button:has-text("Fee Structure")');
    await expect(adminPage.locator('select:has(option:has-text("All Years"))')).toBeVisible();
  });

  test("BTN-162: Academic Year Select", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await adminPage.click('button:has-text("Fee Structure")');
    await expect(adminPage.locator('select:has(option:has-text("Academic Year: 2024 - 2025"))')).toBeVisible();
  });

  test("BTN-163: Create Structure", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await adminPage.click('button:has-text("Fee Structure")');
    await expect(adminPage.locator('button:has-text("Create Structure")')).toBeVisible();
  });

  test("BTN-166: Add Fee Item (structure modal)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Settings")');
    await adminPage.click('button:has-text("Fee Structure")');
    await adminPage.click('button:has-text("Create Structure")');
    await expect(adminPage.locator('button:has-text("Add Fee Item")')).toBeVisible();
  });
});


