import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Documents Module Button Audit", () => {
  test("BTN-200: Select Student dropdown", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    await expect(adminPage.locator('select:has(option:has-text("Select a student…"))')).toBeVisible();
  });

  test("BTN-201: Generate Selected button (no-op)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    const genBtn = adminPage.locator('button:has-text("Generate Selected")');
    await expect(genBtn).toBeVisible();
    // This button has onClick={() => {}} - does nothing
  });

  test("BTN-202: Generate Student ID Card button (no-op)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    const idCardBtn = adminPage.locator('button:has-text("Generate")').first();
    if ((await idCardBtn.count()) > 0) {
      await expect(idCardBtn).toBeVisible();
      // No-op handler - does nothing when clicked
    }
  });

  test("BTN-203: Generate Report Card button (no-op)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    const genBtns = adminPage.locator('button:has-text("Generate")');
    const count = await genBtns.count();
    if (count > 1) {
      await expect(genBtns.nth(1)).toBeVisible();
    }
  });

  test("BTN-204: Generate Admit Card button (no-op)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    const genBtns = adminPage.locator('button:has-text("Generate")');
    const count = await genBtns.count();
    if (count > 2) {
      await expect(genBtns.nth(2)).toBeVisible();
    }
  });

  test("BTN-205: Generate Fee Slip button (no-op)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    const genBtns = adminPage.locator('button:has-text("Generate")');
    const count = await genBtns.count();
    if (count > 3) {
      await expect(genBtns.nth(3)).toBeVisible();
    }
  });

  test("BTN-206: Generate Transfer Certificate button (no-op)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    const genBtns = adminPage.locator('button:has-text("Generate")');
    const count = await genBtns.count();
    if (count > 4) {
      await expect(genBtns.nth(4)).toBeVisible();
    }
  });

  test("BTN-207: Generate Character Certificate button (no-op)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Documents")');
    const genBtns = adminPage.locator('button:has-text("Generate")');
    const count = await genBtns.count();
    if (count > 5) {
      await expect(genBtns.nth(5)).toBeVisible();
    }
  });
});


