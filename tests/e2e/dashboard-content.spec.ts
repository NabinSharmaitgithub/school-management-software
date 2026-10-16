import { test, expect } from "@playwright/test";

test.describe("Dashboard Content Without Auth", () => {
  test("Check dashboard page content", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/dashboard");
    await page.waitForTimeout(5000);

    console.log("URL:", page.url());
    
    // Check what's on the page
    const heading = page.locator("h1");
    if (await heading.count() > 0) {
      console.log("Heading:", await heading.first().textContent());
    }
    
    // Check for dashboard-specific elements
    const statCards = page.locator('[class*="StatCard"], [class*="stat-card"]');
    console.log("Stat cards count:", await statCards.count());
    
    const quickActions = page.locator('button:has-text("Admit Student"), button:has-text("Collect Fee"), button:has-text("Mark Attendance"), button:has-text("Enter Marks")');
    console.log("Quick action buttons:", await quickActions.count());
    
    // Check for error/loading states
    const loading = page.locator('text=Loading');
    console.log("Loading text:", await loading.count());
    
    const error = page.locator('[role="alert"], .text-rose-700');
    console.log("Error alerts:", await error.count());
    
    // List all buttons on the page
    const allButtons = page.locator("button");
    const buttonCount = await allButtons.count();
    console.log("Total buttons:", buttonCount);
    
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const btn = allButtons.nth(i);
      const text = await btn.textContent();
      console.log(`  Button ${i}: "${text?.trim()}"`);
    }
    
    console.log("Console errors:", errors.slice(0, 10));
  });
});
