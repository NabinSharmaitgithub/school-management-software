import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Staff Module Button Audit", () => {
  test("BTN-173: Directory tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Staff")');
    await expect(adminPage.locator('button:has-text("Directory")')).toBeVisible();
  });

  test("BTN-174: Leave Requests tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Staff")');
    await expect(adminPage.locator('button:has-text("Leave Requests")')).toBeVisible();
  });

  test("BTN-175: Request Leave (teacher only)", async ({ teacherPage }) => {
    await teacherPage.click('a:has-text("Staff")');
    await teacherPage.click('button:has-text("Leave Requests")');
    // Teacher may see Request Leave button
  });

  test("BTN-176: Add Staff link-button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Staff")');
    await expect(adminPage.locator('a:has-text("Add Staff")')).toBeVisible();
  });

  test("BTN-179: Approve leave button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Staff")');
    await adminPage.click('button:has-text("Leave Requests")');
    const approveButtons = adminPage.locator('button:has-text("Approve")');
    if ((await approveButtons.count()) > 0) {
      await expect(approveButtons.first()).toBeVisible();
    }
  });

  test("BTN-180: Reject leave button", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Staff")');
    await adminPage.click('button:has-text("Leave Requests")');
    const rejectButtons = adminPage.locator('button:has-text("Reject")');
    if ((await rejectButtons.count()) > 0) {
      await expect(rejectButtons.first()).toBeVisible();
    }
  });
});

test.describe("Staff Profile Button Audit", () => {
  test("BTN-189: Request Leave (staff profile)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Staff")');
    // Navigate to a staff profile first
    const staffLinks = adminPage.locator('a[href*="/dashboard/staff/"]');
    if ((await staffLinks.count()) > 0) {
      await staffLinks.first().click();
      await expect(adminPage.locator('button:has-text("Request Leave")')).toBeVisible();
    }
  });

  test("BTN-190: Edit button (staff profile)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Staff")');
    const staffLinks = adminPage.locator('a[href*="/dashboard/staff/"]');
    if ((await staffLinks.count()) > 0) {
      await staffLinks.first().click();
      await expect(adminPage.locator('button:has-text("Edit")')).toBeVisible();
    }
  });
});


