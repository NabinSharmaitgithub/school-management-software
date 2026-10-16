import { test, expect } from "@playwright/test";

test.describe("Dashboard HTML Inspection", () => {
  test("Inspect dashboard page HTML", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(5000);

    // Get body HTML
    const bodyHTML = await page.locator("body").innerHTML();
    console.log("Body HTML length:", bodyHTML.length);
    console.log("Body HTML preview:", bodyHTML.substring(0, 500));
    
    // Get page title
    console.log("Page title:", await page.title());
    
    // Check for any text content
    const bodyText = await page.locator("body").textContent();
    console.log("Body text:", bodyText?.substring(0, 200));
    
    // Check for Next.js hydration data
    const scriptTags = await page.locator("script").count();
    console.log("Script tags:", scriptTags);
    
    // Check for __NEXT_DATA__
    const nextData = page.locator('script[id="__NEXT_DATA__"]');
    if (await nextData.count() > 0) {
      const data = await nextData.first().textContent();
      console.log("__NEXT_DATA__ found, length:", data?.length);
    } else {
      console.log("__NEXT_DATA__ NOT found");
    }
  });
});
