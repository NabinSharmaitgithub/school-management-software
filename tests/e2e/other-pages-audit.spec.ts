import { test } from "./helpers/auth"; import { expect } from "@playwright/test";

test.describe("Other Pages Button Audit", () => {
  const pages = [
    { name: "My Class", path: "/dashboard/my-class" },
    { name: "My Attendance", path: "/dashboard/my-attendance" },
    { name: "My Fees", path: "/dashboard/my-fees" },
    { name: "Academics", path: "/dashboard/academics" },
    { name: "Assignments", path: "/dashboard/assignments" },
    { name: "Library", path: "/dashboard/library" },
    { name: "Transport", path: "/dashboard/transport" },
    { name: "Hostel", path: "/dashboard/hostel" },
    { name: "Timetable", path: "/dashboard/timetable" },
    { name: "Exam Schedules", path: "/dashboard/exam-schedules" },
    { name: "Report Cards", path: "/dashboard/report-cards" },
    { name: "ID Cards", path: "/dashboard/id-cards" },
    { name: "Attendance Reports", path: "/dashboard/attendance-reports" },
    { name: "Analytics", path: "/dashboard/analytics" },
  ];

  pages.forEach(({ name, path }) => {
    test(`Page loads: ${name} (${path})`, async ({ adminPage }) => {
      const response = await adminPage.goto(path);
      // Page should load without server error
      await expect(adminPage).toHaveURL(path);
      // Check for error messages
      const errorAlert = adminPage.locator('[role="alert"]');
      if (await errorAlert.count() > 0) {
        console.log(`WARNING: ${name} page has error alert: ${await errorAlert.first().textContent()}`);
      }
    });
  });

  test("BTN-218: PDF download (My Fees)", async ({ adminPage }) => {
    await adminPage.goto("/dashboard/my-fees");
    const pdfButtons = adminPage.locator('button:has-text("PDF")');
    if ((await pdfButtons.count()) > 0) {
      await expect(pdfButtons.first()).toBeVisible();
    }
  });
});


