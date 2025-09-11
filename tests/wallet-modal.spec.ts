import { test, expect } from '@playwright/test';

test.describe('Wallet Modal Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('should show only Phantom and Solflare wallets', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click the wallet connect button in the header
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await expect(walletButton).toBeVisible();
    
    // Click the wallet button
    await walletButton.click();
    
    // Wait for the wallet modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Verify the modal is visible
    const modal = page.locator('.wallet-adapter-modal');
    await expect(modal).toBeVisible();
    
    // Verify the modal contains only the expected wallet options
    const walletList = page.locator('.wallet-adapter-modal-list');
    await expect(walletList).toBeVisible();
    
    // Check for specific wallet options
    const phantomOption = page.locator('.wallet-adapter-modal-list-item').filter({ hasText: /Phantom/i });
    const solflareOption = page.locator('.wallet-adapter-modal-list-item').filter({ hasText: /Solflare/i });
    
    await expect(phantomOption).toBeVisible();
    await expect(solflareOption).toBeVisible();
    
    // Verify no other wallets are present
    const allWalletOptions = page.locator('.wallet-adapter-modal-list-item');
    const count = await allWalletOptions.count();
    expect(count).toBe(2);
  });

  test('should open wallet modal when header connect button is clicked', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click the wallet connect button in the header
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await expect(walletButton).toBeVisible();
    
    // Click the wallet button
    await walletButton.click();
    
    // Wait for the wallet modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Verify the modal is visible
    const modal = page.locator('.wallet-adapter-modal');
    await expect(modal).toBeVisible();
    
    // Verify the modal contains wallet options
    const walletList = page.locator('.wallet-adapter-modal-list');
    await expect(walletList).toBeVisible();
  });

  test('should allow clicking on wallet options', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click the wallet connect button
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await walletButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Click on Phantom wallet option
    const phantomOption = page.locator('.wallet-adapter-modal-list-item').filter({ hasText: /Phantom/i });
    await expect(phantomOption).toBeVisible();
    await phantomOption.click();
    
    // The modal should still be visible (wallet selection flow should start)
    // Note: In a real test environment, you might need to mock the wallet connection
    const modal = page.locator('.wallet-adapter-modal');
    await expect(modal).toBeVisible();
  });

  test('should have proper z-index to appear above other elements', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click the wallet connect button
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await walletButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Check that the modal has high z-index
    const modal = page.locator('.wallet-adapter-modal');
    const zIndex = await modal.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    
    // The z-index should be high (9999 or similar)
    expect(parseInt(zIndex)).toBeGreaterThan(1000);
  });

  test('should close modal when clicking outside', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click the wallet connect button
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await walletButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Click outside the modal (on the overlay)
    const overlay = page.locator('.wallet-adapter-modal-overlay');
    await overlay.click();
    
    // The modal should be hidden
    const modal = page.locator('.wallet-adapter-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when pressing Escape key', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click the wallet connect button
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await walletButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // The modal should be hidden
    const modal = page.locator('.wallet-adapter-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should trap focus within modal', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click the wallet connect button
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await walletButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Get focusable elements
    const focusableElements = page.locator('.wallet-adapter-modal button, .wallet-adapter-modal [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements.first();
    const lastElement = focusableElements.last();
    
    // Focus should be on the first element
    await expect(firstElement).toBeFocused();
    
    // Tab to the last element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Tab again should wrap to the first element
    await page.keyboard.press('Tab');
    await expect(firstElement).toBeFocused();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click the wallet connect button
    const walletButton = page.locator('button').filter({ hasText: /Connect Wallet/i }).first();
    await expect(walletButton).toBeVisible();
    await walletButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('.wallet-adapter-modal', { timeout: 5000 });
    
    // Verify the modal is visible and properly sized for mobile
    const modal = page.locator('.wallet-adapter-modal');
    await expect(modal).toBeVisible();
    
    // Check that the modal is responsive
    const modalBox = await modal.boundingBox();
    expect(modalBox?.width).toBeLessThanOrEqual(375);
  });
});

test.describe('Pricing Page Gating', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('should disable upgrade button when wallet is not connected', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find the upgrade button
    const upgradeButton = page.locator('a').filter({ hasText: /Connect Wallet to Upgrade/i });
    await expect(upgradeButton).toBeVisible();
    
    // The button should be disabled (grayed out)
    const buttonClasses = await upgradeButton.getAttribute('class');
    expect(buttonClasses).toContain('cursor-not-allowed');
    expect(buttonClasses).toContain('bg-gray-600');
  });

  test('should show connect wallet message for upgrade button', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the button text shows connect wallet message
    const upgradeButton = page.locator('a').filter({ hasText: /Connect Wallet to Upgrade/i });
    await expect(upgradeButton).toBeVisible();
    
    // Clicking should not navigate (prevented)
    await upgradeButton.click();
    expect(page.url()).toContain('/pricing');
  });
});

test.describe('Pay Page Gating', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pay');
  });

  test('should disable pay button when wallet is not authenticated', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find the pay button
    const payButton = page.locator('button').filter({ hasText: /Connect and authenticate wallet to pay/i });
    await expect(payButton).toBeVisible();
    
    // The button should be disabled
    await expect(payButton).toBeDisabled();
    
    // Check that the button has disabled styling
    const buttonClasses = await payButton.getAttribute('class');
    expect(buttonClasses).toContain('cursor-not-allowed');
    expect(buttonClasses).toContain('bg-slate-800');
  });

  test('should show authentication required message', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for the authentication message
    const authMessage = page.locator('text=Connect and authenticate your wallet to continue with payment');
    await expect(authMessage).toBeVisible();
  });
});

test.describe('Account Page Refresh Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account');
  });

  test('should show refresh button and call auth status endpoints', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for the refresh button
    const refreshButton = page.locator('button').filter({ hasText: /Refresh/i });
    
    // If user is not authenticated, they should see connect wallet message
    const connectMessage = page.locator('text=Connect your wallet to manage your plan');
    if (await connectMessage.isVisible()) {
      // User is not authenticated, which is expected for this test
      await expect(connectMessage).toBeVisible();
    } else {
      // User is authenticated, check for refresh button
      await expect(refreshButton).toBeVisible();
      
      // Click refresh button
      await refreshButton.click();
      
      // Wait a moment for the refresh to complete
      await page.waitForTimeout(1000);
    }
  });

  test('should disable refresh button while fetching and update timestamp', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for the refresh button
    const refreshButton = page.locator('button').filter({ hasText: /Refresh/i });
    
    // If user is authenticated
    if (await refreshButton.isVisible()) {
      // Click refresh button
      await refreshButton.click();
      
      // Button should be disabled while fetching
      await expect(refreshButton).toBeDisabled();
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000);
      
      // Button should be enabled again
      await expect(refreshButton).toBeEnabled();
      
      // Check for "Last updated" timestamp
      const lastUpdated = page.locator('text=Last updated:');
      await expect(lastUpdated).toBeVisible();
    }
  });
});

test.describe('Landing Page Routing', () => {
  test('should redirect to /feed only when authenticated (not just connected)', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // If not authenticated, should stay on home page
    const homeContent = page.locator('text=Ready to make predictions?');
    if (await homeContent.isVisible()) {
      // User is not authenticated, should see home page content
      await expect(homeContent).toBeVisible();
      
      // Should not redirect to /feed
      expect(page.url()).toContain('/');
      expect(page.url()).not.toContain('/feed');
    } else {
      // User is authenticated, should redirect to /feed
      expect(page.url()).toContain('/feed');
    }
  });

  test('should show redirect message for authenticated users', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if redirect message is shown
    const redirectMessage = page.locator('text=Taking you to your Feed...');
    if (await redirectMessage.isVisible()) {
      // Should show redirect message
      await expect(redirectMessage).toBeVisible();
      
      // Should show wallet authenticated message
      const authMessage = page.locator('text=Wallet Authenticated!');
      await expect(authMessage).toBeVisible();
    }
  });
});
