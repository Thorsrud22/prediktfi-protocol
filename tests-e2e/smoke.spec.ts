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
    
    // In mock mode, the button should be enabled even without wallet
    // Check if we're in mock mode first
    const mockMode = await page.evaluate(() => localStorage.getItem('NEXT_PUBLIC_MOCK_TX') === '1');
    if (mockMode) {
      await expect(ctaButton).toBeEnabled();
    } else {
      await expect(ctaButton).toBeDisabled();
    }
  });
});

test.describe("Portfolio page in mock mode", () => {
  test("place mock bet and view in portfolio", async ({ page }) => {
    // Set mock mode in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('NEXT_PUBLIC_MOCK_TX', '1');
    });

    // Go to a market page
    await page.goto("/market/1");

    // Wait for the page to load
    await expect(page.getByTestId('outcome-group')).toBeVisible();
    
    // Fill in bet amount
    const amountInput = page.getByPlaceholder("0.1");
    await amountInput.fill("0.25");
    
    // Select YES option
    await page.getByRole('radiogroup').locator('label').filter({ hasText: 'YES' }).click();
    
    // Place the bet (should work in mock mode without wallet)
    const placeBetButton = page.getByTestId('place-bet');
    await expect(placeBetButton).toBeEnabled();
    await placeBetButton.click();
    
    // Wait for success toast
    await expect(page.getByText(/Bet placed \(simulated\)/i)).toBeVisible({ timeout: 10000 });
    
    // Navigate to portfolio page
    await page.goto("/me");
    
    // Verify portfolio page loads
    await expect(page.getByRole('heading', { name: 'Your predictions' })).toBeVisible();
    
    // Check that at least one bet is displayed
    const betCards = page.locator('[class*="rounded-xl border"]');
    await expect(betCards).toHaveCount(1);
    
    // Verify the bet details are shown correctly
    await expect(page.getByText("YES")).toBeVisible();
    await expect(page.getByText("0.25 SOL")).toBeVisible();
    await expect(page.getByText(/Market:/)).toBeVisible();
    
    // Verify Explorer link is present
    await expect(page.getByRole('link', { name: 'Explorer' })).toBeVisible();
  });

  test("portfolio shows empty state when no bets", async ({ page }) => {
    // Clear localStorage to ensure no previous bets
    await page.addInitScript(() => {
      localStorage.removeItem('predikt:mock-bets');
      localStorage.setItem('NEXT_PUBLIC_MOCK_TX', '1');
    });

    await page.goto("/me");
    
    // Verify empty state
    await expect(page.getByRole('heading', { name: 'Your predictions' })).toBeVisible();
    await expect(page.getByText("No predictions yet.")).toBeVisible();
  });
});
