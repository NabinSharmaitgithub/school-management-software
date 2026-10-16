import { test, expect } from "@playwright/test";

test.describe("Direct Navigation Test", () => {
  test("Navigate to /dashboard without auth", async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/dashboard");
    await page.waitForTimeout(3000);
    
    console.log("Final URL:", page.url());
    console.log("Console errors:", errors.slice(0, 5));
    
    // Check if we're on dashboard or redirected to login
    const isDashboard = page.url().includes("/dashboard");
    const isLogin = page.url() === "/" || page.url().endsWith("/");
    
    console.log("Is dashboard:", isDashboard);
    console.log("Is login:", isLogin);
    
    // Check for auth redirect
    const heading = page.locator("h1");
    if (await heading.count() > 0) {
      console.log("Heading:", await heading.first().textContent());
    }
  });
});
