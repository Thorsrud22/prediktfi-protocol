import { test, expect } from "@playwright/test";

test.describe("Studio experience smoke test", () => {
  test("example questions populate the prompt", async ({ page }) => {
    await page.goto("/market/1");

    // The legacy market route redirects to the studio; wait for it before interacting
    await page.waitForURL("**/studio", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    await page.waitForSelector('role=heading[name=/Prediction Studio/i]', { timeout: 20000 });

    // Wait for the suggestion buttons to render and click the first one
    const exampleButtons = page.getByRole("button", { name: /Bitcoin will reach \$100,000/i });
    await expect(exampleButtons.first()).toBeVisible({ timeout: 20000 });
    await exampleButtons.first().click();

    // After clicking an example, the textarea should contain the example text
    const questionInput = page.getByPlaceholder(
      "Bitcoin will reach $100,000 by December 31, 2024"
    );
    await expect(questionInput).toBeVisible({ timeout: 20000 });
    await expect(questionInput).toHaveValue(/Bitcoin will reach \$100,000/);

    // Confirm the commit step UI is present so we know the whole flow rendered
    await expect(page.getByText(/Commit/)).toBeVisible();
  });
});
