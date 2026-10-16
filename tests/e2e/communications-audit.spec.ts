import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Communications Module Button Audit", () => {
  test("BTN-127: Notice Board tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await expect(adminPage.locator('button:has-text("Notice Board")')).toBeVisible();
  });

  test("BTN-128: Broadcast tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await expect(adminPage.locator('button:has-text("Broadcast")')).toBeVisible();
  });

  test("BTN-129: Messenger tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await expect(adminPage.locator('button:has-text("Messenger")')).toBeVisible();
  });

  test("BTN-130: Create Announcement", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await expect(adminPage.locator('button:has-text("Create Announcement")')).toBeVisible();
  });

  test("BTN-131: All Notices filter", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await expect(adminPage.locator('button:has-text("All Notices")')).toBeVisible();
  });

  test("BTN-132: Important filter", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await expect(adminPage.locator('button:has-text("Important")')).toBeVisible();
  });

  test("BTN-133: Drafts filter", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await expect(adminPage.locator('button:has-text("Drafts")')).toBeVisible();
  });

  test("BTN-136: New Broadcast", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await adminPage.click('button:has-text("Broadcast")');
    await expect(adminPage.locator('button:has-text("New Broadcast")')).toBeVisible();
  });

  test("BTN-142: Post Announcement (modal)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await adminPage.click('button:has-text("Create Announcement")');
    await expect(adminPage.locator('button:has-text("Post Announcement")')).toBeVisible();
  });

  test("BTN-152: Send Now (broadcast modal)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Communications")');
    await adminPage.click('button:has-text("Broadcast")');
    await adminPage.click('button:has-text("New Broadcast")');
    await expect(adminPage.locator('button:has-text("Send Now")')).toBeVisible();
  });
});


