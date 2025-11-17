import { test, expect } from "@playwright/test";

test.describe("Prediction studio redirect from legacy market", () => {
  test("shows studio entry form after redirect", async ({ page }) => {
    await page.goto("/market/1");

    // Legacy market routes immediately redirect to the studio experience
    await page.waitForURL("**/studio", { timeout: 10000 });

    // Wait for the studio hero to render so we know the page is ready
    await expect(page.getByRole("heading", { name: /Prediction Studio/i })).toBeVisible();

    // Ensure the primary textarea is available and usable
    const questionInput = page.getByPlaceholder(
      "Bitcoin will reach $100,000 by December 31, 2024"
    );
    await questionInput.click();
    await questionInput.fill("Will SOL flip ETH by Q2 2025?");

    // The generate button should be enabled once text is present
    const generateButton = page.getByRole("button", { name: /Generate AI Analysis/i });
    await expect(generateButton).toBeEnabled();
  });
});
