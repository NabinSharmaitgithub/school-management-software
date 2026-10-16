import { test as base, type Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const TEST_ACCOUNTS = {
  admin: { email: "admin@school.local", password: "admin123!", role: "Admin" },
  teacher: { email: "teacher@school.local", password: "teacher123!", role: "Teacher" },
};

interface AuditFixtures {
  adminPage: Page;
  teacherPage: Page;
}

/**
 * Authenticated page fixtures backed by storageState saved by
 * setup-auth.spec.ts (runs as the "setup" project dependency).
 * The chromium project already loads admin-state.json, so adminPage
 * just opens a fresh context inheriting it.
 */
export const test = base.extend<AuditFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/dashboard");
    // Shell returns null until Firebase auth resolves; wait for nav to render
    await page.waitForSelector('a[href^="/dashboard/"]', { timeout: 30000 });
    try {
      await use(page);
    } finally {
      await context.close();
    }
  },
  teacherPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "tests/e2e/helpers/teacher-state.json",
    });
    const page = await context.newPage();
    await page.goto("/dashboard");
    // Shell returns null until Firebase auth resolves; wait for nav to render
    await page.waitForSelector('a[href^="/dashboard/"]', { timeout: 30000 });
    try {
      await use(page);
    } finally {
      await context.close();
    }
  },
});

export { expect };
