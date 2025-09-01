import { test, expect } from "@playwright/test";

test.describe("Basic navigation flow", () => {
  test("landing → markets → detail", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Predict markets without limits/i)).toBeVisible();

    // Navigate to markets using the "View all markets" link
    await page.getByTestId('view-all-markets').click();

    await expect(page).toHaveURL(/\/markets/);

    // Wait for markets page to load
    await expect(page.getByRole('heading', { name: 'All Markets' })).toBeVisible();
    
    // Verify 3+ market cards render (matches mock data)
    const cards = page.getByTestId(/market-card-/);
    await expect(cards).toHaveCount(3);
    
    // Navigate to first market detail
    await cards.first().click();
    
    // Verify we're on a market detail page
    await expect(page).toHaveURL(/\/market\/\d+/);

    // Check that the betting interface is visible
    await expect(page.getByTestId('outcome-group')).toBeVisible();
    await expect(page.getByTestId('place-bet')).toBeVisible();

    // Test CTA label update: fill amount and select YES
    const amountInput = page.getByPlaceholder("0.1");
    await amountInput.fill("0.5");
    
    // Select YES option
    await page.getByRole('radiogroup').locator('label').filter({ hasText: 'YES' }).click();
    
    // Verify the CTA button updates to show wallet connection needed
    // (Since no wallet is connected in test environment, it shows "Connect wallet")
    const ctaButton = page.getByTestId('place-bet');
    await expect(ctaButton).toContainText("Connect wallet");
    
    // Verify the button is disabled when wallet not connected
    await expect(ctaButton).toBeDisabled();
  });
});
