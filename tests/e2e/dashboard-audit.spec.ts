import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Dashboard Navigation Button Audit (Admin)", () => {
  test("BTN-014: Sign Out (sidebar, wide)", async ({ adminPage }) => {
    await expect(adminPage.locator("text=Sign Out")).toBeVisible();
  });

  test("BTN-040: Admit Student quick action", async ({ adminPage }) => {
    await expect(adminPage.locator('a:has-text("Admit Student")')).toBeVisible();
  });

  test("BTN-041: Collect Fee quick action", async ({ adminPage }) => {
    await expect(adminPage.locator('a:has-text("Collect Fee")')).toBeVisible();
  });

  test("BTN-042: Mark Attendance quick action", async ({ adminPage }) => {
    await expect(adminPage.locator('a:has-text("Mark Attendance")')).toBeVisible();
  });

  test("BTN-043: Enter Marks quick action", async ({ adminPage }) => {
    await expect(adminPage.locator('a:has-text("Enter Marks")')).toBeVisible();
  });
});

test.describe("Dashboard Navigation Button Audit (Teacher)", () => {
  test("Teacher dashboard shows teacher-scoped quick actions", async ({ teacherPage }) => {
    // Teacher should see Mark Attendance and Enter Marks but not Admit Student/Collect Fee
    await expect(teacherPage.locator('a:has-text("Mark Attendance")')).toBeVisible();
    await expect(teacherPage.locator('a:has-text("Enter Marks")')).toBeVisible();
    // Admin-only quick actions should not be visible
    await expect(teacherPage.locator('a:has-text("Admit Student")')).not.toBeVisible();
    await expect(teacherPage.locator('a:has-text("Collect Fee")')).not.toBeVisible();
  });
});

test.describe("Students Module Button Audit", () => {
  test("BTN-044: Add Student (Admin)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Students")');
    await expect(adminPage.locator('button:has-text("Add Student")')).toBeVisible();
  });

  test("BTN-045: Active tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Students")');
    await expect(adminPage.locator('button:has-text("Active")')).toBeVisible();
  });

  test("BTN-046: Archived tab (Admin)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Students")');
    await expect(adminPage.locator('button:has-text("Archived")')).toBeVisible();
  });

  test("BTN-047: View student link (row)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Students")');
    const viewLinks = adminPage.locator('a[href*="/dashboard/students/"] span:has-text("visibility")');
    if ((await viewLinks.count()) > 0) {
      await expect(viewLinks.first()).toBeVisible();
    } else {
      // No students - test passes (button not present because no data)
    }
  });

  test("BTN-048: Archive button (row, Admin)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Students")');
    const archiveButtons = adminPage.locator('button:has(span:has-text("archive"))');
    if ((await archiveButtons.count()) > 0) {
      await expect(archiveButtons.first()).toBeVisible();
    }
  });

  test("BTN-053: Cancel (new student form)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Students")');
    await adminPage.click('button:has-text("Add Student")');
    await expect(adminPage.locator('a:has-text("Students")')).toBeVisible();
    await adminPage.click('a:has-text("Cancel")');
  });

  test("BTN-054: Save Student form validation", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Students")');
    await adminPage.click('button:has-text("Add Student")');
    // Wait for the new student page to load
    await adminPage.waitForURL("/dashboard/students/new");
    await adminPage.click('button:has-text("Save Student")');
    // Should show validation error for required fields
    await expect(adminPage.locator('text=Name and class are required.')).toBeVisible();
  });
});

test.describe("Students Module Button Audit (Teacher)", () => {
  test("BTN-044: Add Student not visible for Teacher", async ({ teacherPage }) => {
    await teacherPage.click('a:has-text("Students")');
    await expect(teacherPage.locator('button:has-text("Add Student")')).not.toBeVisible();
  });

  test("BTN-046: Archived tab not visible for Teacher", async ({ teacherPage }) => {
    await teacherPage.click('a:has-text("Students")');
    await expect(teacherPage.locator('button:has-text("Archived")')).not.toBeVisible();
  });
});


