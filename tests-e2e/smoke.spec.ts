import { test, expect } from "@playwright/test";

test.describe("Basic navigation flow", () => {
  test("landing → markets → detail", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Predict markets without limits/i)).toBeVisible();

    // Go to markets using the data-testid
    await page.getByTestId('view-all-markets').click();

    await expect(page).toHaveURL(/\/markets/);

    // Wait for market cards to be visible
    await expect(page.getByRole('heading', { name: 'All Markets' })).toBeVisible();
    
    // Get market cards using data-testid and verify count
    const cards = page.getByTestId(/market-card-/);
    await expect(cards).toHaveCount(3); // matches current mock size
    await cards.first().click();
    
    // Verify we're on a market detail page
    await expect(page).toHaveURL(/\/market\/\d+/);

    // Check that the outcome group and place bet button are visible
    await expect(page.getByTestId('outcome-group')).toBeVisible();
    await expect(page.getByTestId('place-bet')).toBeVisible();
  });
});
