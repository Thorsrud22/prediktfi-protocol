import { test, expect } from "@playwright/test";

test.describe("Mock bet flow", () => {
  test.beforeEach(async ({ context }) => {
    // Ensure mock mode during test
    await context.addCookies([
      // No cookies needed; relies on .env.local NEXT_PUBLIC_MOCK_TX=1
    ]);
  });

  test("fee and net info appears when amount and side are selected", async ({
    page,
  }) => {
    await page.goto("/market/1");
    
    // Fill amount
    const amountInput = page.getByPlaceholder("0.1");
    await amountInput.fill("0.5");
    
    // Choose side
    await page.getByRole('radiogroup').locator('label').filter({ hasText: 'YES' }).click();
    
    // Check that fee and net info is displayed
    await expect(page.getByText(/Fee 0.01/)).toBeVisible();
    await expect(page.getByText(/Net 0.49/)).toBeVisible();
    
    // Verify the button is in the expected state
    const connectButton = page.getByRole("button", { name: /Connect wallet/i });
    await expect(connectButton).toBeVisible();
    
    // Note: We can't test the actual bet placement without wallet connection
    // in the CI environment, so we verify the prep state only
  });
});
