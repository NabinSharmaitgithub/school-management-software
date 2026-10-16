import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Finance Module Button Audit", () => {
  test("BTN-104: Record Payment button (Collections tab)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    await expect(adminPage.locator('button:has-text("Record Payment")')).toBeVisible();
  });

  test("BTN-105: Fee Settings button (Fees tab)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    // Click Fees tab
    await adminPage.click('button:has-text("Fees")');
    await expect(adminPage.locator('button:has-text("Fee Settings")')).toBeVisible();
  });

  test("BTN-106: Generate Invoices button (Fees tab)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    await adminPage.click('button:has-text("Fees")');
    await expect(adminPage.locator('button:has-text("Generate Invoices")')).toBeVisible();
  });

  test("BTN-107: Collections tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    await expect(adminPage.locator('button:has-text("Collections")')).toBeVisible();
  });

  test("BTN-108: Payroll tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    await expect(adminPage.locator('button:has-text("Payroll")')).toBeVisible();
  });

  test("BTN-109: Fees tab", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    await expect(adminPage.locator('button:has-text("Fees")')).toBeVisible();
  });

  test("BTN-120: View link (invoice row)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    await adminPage.click('button:has-text("Fees")');
    const viewLinks = adminPage.locator('a:has-text("View")');
    if ((await viewLinks.count()) > 0) {
      await expect(viewLinks.first()).toBeVisible();
    }
  });

  test("BTN-114: Collect button (invoice row)", async ({ adminPage }) => {
    await adminPage.click('a:has-text("Finance")');
    await adminPage.click('button:has-text("Fees")');
    const collectButtons = adminPage.locator('button:has-text("Collect")');
    if ((await collectButtons.count()) > 0) {
      await expect(collectButtons.first()).toBeVisible();
    }
  });
});


