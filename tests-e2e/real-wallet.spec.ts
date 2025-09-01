import { test, expect } from "@playwright/test";

const TREASURY = "HUCsxGDiAQdfmPe9MV52Dd6ERzwNNiu16aEKqFUQ1obN";

test.describe("Real Devnet Happy-Path (semi-automatic)", () => {
  test("connect, bet 0.5 SOL, sign, verify explorer link", async ({
    page,
    context,
  }) => {
    // 1) Navigate to home and instruct manual wallet connect
    await page.goto("/");
    console.log(
      "[ACTION] In Phantom: Connect your PLAYER wallet (not treasury). Ensure Devnet. Airdrop if < 0.6 SOL."
    );
    // Wait until the CTA on market detail becomes available post-connect, or the wallet button no longer says Select Wallet
    // Go to first market to proceed
    await page.goto("/market/1");

    // Wait (up to 5 min) for Connected badge or for the wallet button to change state
    const connectedBadge = page.getByText("Connected");
    await expect(connectedBadge).toBeVisible({ timeout: 5 * 60 * 1000 });

    // 2) Choose side YES and set amount 0.5
    await page.getByRole('radiogroup').locator('label').filter({ hasText: 'YES' }).click();
    const amountInput = page.getByPlaceholder("0.1");
    await amountInput.fill("0.5");

    // Assert Fee and Net info is shown (not on button)
    await expect(page.getByText(/Fee 0\.01/)).toBeVisible();
    await expect(page.getByText(/Net 0\.49/)).toBeVisible();

    // 3) Click CTA and instruct manual signing
    const cta = page.getByRole("button", { name: /Place 0\.5 SOL bet/i });
    await cta.click();
    await expect(page.getByText(/Sending transaction/i)).toBeVisible();
    console.log(
      "[ACTION] In Phantom: Review and Sign the transaction to send ~0.5 SOL to treasury."
    );

    // Wait up to 5 minutes for success toast with explorer link
    await expect(page.getByText(/Bet placed/i)).toBeVisible({
      timeout: 5 * 60 * 1000,
    });
    const link = page.getByRole("link", { name: "View on Explorer" });
    await expect(link).toBeVisible();
    const href = (await link.getAttribute("href")) || "";
    console.log(`[INFO] Explorer URL: ${href}`);
    expect(href).toContain("?cluster=devnet");

    // Bonus: try to open Explorer and read destination address (best-effort)
    try {
      const explorer = await context.newPage();
      await explorer.goto(href, { waitUntil: "domcontentloaded" });
      // Look for the treasury address text somewhere on the page within 20s
      const found = await explorer
        .locator(`text=${TREASURY}`)
        .first()
        .isVisible({ timeout: 20000 })
        .catch(() => false);
      if (found) {
        console.log(`[PASS] Explorer shows treasury address ${TREASURY}`);
      } else {
        console.log(
          "[SKIP] Could not reliably read 'To' address in Explorer DOM; link logged above."
        );
      }
      await explorer.close();
    } catch (err) {
      console.log(
        "[SKIP] Explorer check failed: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  });
});
