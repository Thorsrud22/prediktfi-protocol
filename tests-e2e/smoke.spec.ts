import { test, expect } from "@playwright/test";

test.describe("Basic navigation flow", () => {
  test("landing → markets → detail", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Predict markets without limits/i)).toBeVisible();

    // Gå til markets
    const viewAll = page.getByRole("link", { name: /View all/i });
    if (await viewAll.isVisible()) {
      await viewAll.click();
    } else {
      await page.goto("/markets");
    }

    await expect(page).toHaveURL(/\/markets/);

    // Wait for cards to be visible
    await page.waitForSelector("a[href^='/market/']");
    const cards = page.locator("a[href^='/market/']");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    await cards.first().click();
    await expect(page).toHaveURL(/\/market\/\d+/);

    await expect(page.getByRole('radiogroup').getByText('YES')).toBeVisible();
    await expect(page.getByRole('radiogroup').getByText('NO')).toBeVisible();
  });
});
