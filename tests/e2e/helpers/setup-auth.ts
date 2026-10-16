import { chromium } from "@playwright/test";

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Sign in via login form
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");
  
  await page.fill('input[id="email"]', "admin@school.local");
  await page.fill('input[id="password"]', "admin123!");
  await page.click('button[role="radio"]:has-text("Admin")');
  await page.click('button[type="submit"]:has-text("Sign In")');
  await page.waitForURL("http://localhost:3000/dashboard", { timeout: 30000 });
  
  // Save storage state (cookies + localStorage) for reuse
  await page.context().storageState({ path: "tests/e2e/helpers/admin-state.json" });
  
  await browser.close();
}

export default globalSetup;
