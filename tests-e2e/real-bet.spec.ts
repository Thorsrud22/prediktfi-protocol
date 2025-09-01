import { test, expect } from "@playwright/test";

test.describe("Real bet flow (best-effort)", () => {
  test.beforeAll(async () => {
    // We assume NEXT_PUBLIC_MOCK_TX=0 is set manually before running this test.
  });

  test("shows sending toast and explorer link with cluster=devnet", async ({
    page,
  }) => {
    await page.goto("/market/1");
    const amountInput = page.getByPlaceholder("0.1");
    await amountInput.fill("0.5");
    
    // Choose YES using the accessible radio button
    await page.getByRole('radiogroup').locator('label').filter({ hasText: 'YES' }).click();
    
    // Note: This test will fail in CI as it requires a connected wallet,
    // but we're updating the selector for consistency
    const cta = page.getByRole("button", { name: /Place 0.5 SOL bet/i });
    
    // Display current button instead of failing if the wallet isn't connected
    const buttons = await page.getByRole('button').all();
    const buttonTexts = await Promise.all(buttons.map(b => b.textContent()));
    console.log(`Available buttons: ${buttonTexts.join(', ')}`);
    
    // Continue with test (will still fail in CI without a wallet)
    await cta.click();
    // Expect loading toast
    await expect(page.getByText(/Sending transaction/)).toBeVisible();
    // We cannot sign in CI; after failure or success, ensure any explorer link (if present) has devnet
    const link = page.getByRole("link", { name: "View on Explorer" });
    if (await link.count()) {
      const href = await link.getAttribute("href");
      expect(href).toContain("?cluster=devnet");
    }
  });
});
