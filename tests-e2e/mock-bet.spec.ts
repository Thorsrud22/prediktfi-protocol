import { test, expect } from "@playwright/test";

test.describe("Prediction studio redirect from legacy market", () => {
  test("shows studio entry form after redirect", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "predikt_auth",
        value: "authenticated",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/market/1");

    // Legacy market routes immediately redirect to the studio experience
    await page.waitForURL("**/studio", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Wait for the studio hero to render so we know the page is ready
    await page.waitForSelector('role=heading[name=/Prediction Studio/i]', { timeout: 20000 });
    await expect(
      page.getByRole("heading", { name: /Prediction Studio/i })
    ).toBeVisible({ timeout: 20000 });

    // Ensure the primary textarea is available and usable
    const questionInput = page.getByPlaceholder(
      "Bitcoin will reach $100,000 by December 31, 2024"
    );
    await expect(questionInput).toBeVisible({ timeout: 20000 });
    await questionInput.click();
    await questionInput.fill("Will SOL flip ETH by Q2 2025?");

    // The generate button should be enabled once text is present
    const generateButton = page.getByRole("button", { name: /Generate AI Analysis/i });
    await expect(generateButton).toBeEnabled();
  });
});
