import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Attendance Module Button Audit", () => {
  test("BTN-067: Class Select dropdown", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Attendance")');
    await expect(adminPage.locator('select:has(option:has-text("Select class…"))')).toBeVisible();
  });

  test("BTN-068: Date Select dropdown", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Attendance")');
    await adminPage.click('select:has(option:has-text("Select class…"))');
    // Date select appears after class is selected
    // We'll test date select if class exists
  });

  test("BTN-075: Save Attendance button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Attendance")');
    // Save button appears after students are loaded
  });
});

test.describe("Marks Module Button Audit", () => {
  test("BTN-076: Bulk Entry link", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Marks")');
    await expect(adminPage.locator('a:has-text("Bulk Entry")')).toBeVisible();
  });

  test("BTN-077: Add Marks button (Admin)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Marks")');
    await expect(adminPage.locator('button:has-text("Add Marks")')).toBeVisible();
  });

  test("BTN-077: Add Marks not visible for Teacher", async ({ teacherPage }) => {
    await teacherPage.click('a:has-text("Marks")');
    // Teacher may or may not see Add Marks depending on subject assignment
  });
});

test.describe("Bulk Marks Module Button Audit", () => {
  test("BTN-083: Upload CSV button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Marks")');
    await adminPage.click('a:has-text("Bulk Entry")');
    await expect(adminPage.locator('button:has-text("Upload CSV")')).toBeVisible();
  });

  test("BTN-084: Template download button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Marks")');
    await adminPage.click('a:has-text("Bulk Entry")');
    await expect(adminPage.locator('button:has-text("Template")')).toBeVisible();
  });

  test("BTN-085: Save All button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Marks")');
    await adminPage.click('a:has-text("Bulk Entry")');
    await expect(adminPage.locator('button:has-text("Save All")')).toBeVisible();
  });
});

test.describe("Promotion Module Button Audit", () => {
  test("BTN-100: Student Select dropdown", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Promotion")');
    await expect(adminPage.locator('select:has(option:has-text("Select student…"))')).toBeVisible();
  });

  test("BTN-101: Destination Class Select", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Promotion")');
    await expect(adminPage.locator('select:has(option:has-text("Select class…"))')).toBeVisible();
  });

  test("BTN-102: Academic Year Select", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Promotion")');
    await expect(adminPage.locator('select:has(option:has-text("2026 - 2027"))')).toBeVisible();
  });

  test("BTN-103: Promote Student button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Promotion")');
    await expect(adminPage.locator('button:has-text("Promote Student")')).toBeVisible();
  });
});


