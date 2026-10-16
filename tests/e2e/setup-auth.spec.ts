import { chromium, test } from "@playwright/test";

const ADMIN_STATE = "tests/e2e/helpers/admin-state.json";
const TEACHER_STATE = "tests/e2e/helpers/teacher-state.json";

/**
 * Signs in via the login form and saves the Firebase Auth session
 * (localStorage) so the queue tests can restore it instantly.
 */
test("setup auth states (admin + teacher)", async () => {
  const browser = await chromium.launch();

  // The role is written to Firestore by ensureUser() on login, so select
  // the correct role per account to avoid overwriting prod data.
  for (const [account, role, statePath] of [
    [{ email: "admin@school.local", password: "admin123!" }, "Admin", ADMIN_STATE],
    [{ email: "teacher@school.local", password: "teacher123!" }, "Teacher", TEACHER_STATE],
  ] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await page.fill('input[id="email"]', account.email);
    await page.fill('input[id="password"]', account.password);
    await page.click(`button[role="radio"]:has-text("${role}")`);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL("/dashboard", { timeout: 30000 });
    await context.storageState({ path: statePath });
    await context.close();
  }

  await browser.close();
});
