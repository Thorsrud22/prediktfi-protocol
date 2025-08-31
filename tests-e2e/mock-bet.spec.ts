import { test, expect } from "@playwright/test";

test.describe("Mock bet flow", () => {
  test.beforeEach(async ({ context }) => {
    // Ensure mock mode during test
    await context.addCookies([
      // No cookies needed; relies on .env.local NEXT_PUBLIC_MOCK_TX=1
    ]);
  });

  test("fee and net are shown and simulated toast appears", async ({
    page,
  }) => {
    await page.goto("/market/1");
    // Fill amount
    const amountInput = page.getByPlaceholder("0.1");
    await amountInput.fill("0.5");
    // Choose side
    await page.getByRole("button", { name: /YES/ }).click();
    // CTA should contain Fee and Net
    const cta = page.getByRole("button", { name: /Place 0.5 SOL Bet/ });
    await expect(cta).toContainText("Fee 0.01");
    await expect(cta).toContainText("Net 0.49");
    await cta.click();
    // Expect simulated toast without an explorer link
    await expect(page.getByText(/Bet placed \(simulated\)/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View on Explorer" })
    ).toHaveCount(0);
  });
});
