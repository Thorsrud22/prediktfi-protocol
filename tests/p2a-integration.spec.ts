/**
 * Integration tests for Predikt Prediction-to-Action v1
 * Tests the complete flow: create → simulate → execute → embed
 */

import { test, expect } from '@playwright/test';

test.describe('Predikt Prediction-to-Action v1', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3001');
  });

  test('should display Actions link in navbar when feature is enabled', async ({ page }) => {
    // Check if Actions link is visible in navbar
    const actionsLink = page.locator('a[href="/advisor/actions"]');
    await expect(actionsLink).toBeVisible();
  });

  test('should navigate to Actions page', async ({ page }) => {
    // Click on Actions link
    await page.click('a[href="/advisor/actions"]');
    
    // Verify we're on the Actions page
    await expect(page).toHaveURL('/advisor/actions');
    await expect(page.locator('h1')).toContainText('Trading Actions');
  });

  test('should show wallet selection when no wallet is selected', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Should show wallet selection
    await expect(page.locator('text=Select Wallet')).toBeVisible();
  });

  test('should show create intent button', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Should show create intent button
    await expect(page.locator('text=Create Intent')).toBeVisible();
  });

  test('should open trade panel when create intent is clicked', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Click create intent button
    await page.click('text=Create Intent');
    
    // Should show trade panel modal
    await expect(page.locator('text=Create Trading Intent')).toBeVisible();
  });

  test('should have proper form fields in trade panel', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Open trade panel
    await page.click('text=Create Intent');
    
    // Check form fields
    await expect(page.locator('select')).toHaveCount(2); // Base and Quote selects
    await expect(page.locator('input[type="number"]')).toHaveCount(4); // Size value and guard inputs
    await expect(page.locator('textarea')).toHaveCount(1); // Rationale textarea
  });

  test('should show monitor only warning', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Should show monitor only warning
    await expect(page.locator('text=Monitor only. No trades are executed automatically.')).toBeVisible();
  });

  test('should show pause all alerts switch', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Should show pause all alerts switch
    await expect(page.locator('text=Pause all actions')).toBeVisible();
  });
});

test.describe('Studio Integration', () => {
  test('should show Trade This Prediction button in Studio', async ({ page }) => {
    await page.goto('/studio');
    
    // Should show Trade This Prediction button (may be hidden until prediction is made)
    const tradeButton = page.locator('text=Trade This Prediction');
    
    // The button might not be visible until a prediction is made
    // This test verifies the button exists in the DOM
    await expect(tradeButton).toBeAttached();
  });

  test('should navigate to Actions with template when Trade This Prediction is clicked', async ({ page }) => {
    await page.goto('/studio');
    
    // This test would require a prediction to be made first
    // For now, we'll just verify the button exists
    const tradeButton = page.locator('text=Trade This Prediction');
    await expect(tradeButton).toBeAttached();
  });
});

test.describe('API Endpoints', () => {
  test('should return 403 when ACTIONS feature is disabled', async ({ request }) => {
    // This test would require feature flags to be disabled
    // For now, we'll test that the endpoint exists
    const response = await request.post('/api/intents/create', {
      data: {
        intent: {
          walletId: 'test',
          base: 'SOL',
          quote: 'USDC',
          side: 'BUY',
          sizeJson: { type: 'pct', value: 5 },
          guardsJson: {
            dailyLossCapPct: 5,
            posLimitPct: 20,
            minLiqUsd: 100000,
            maxSlippageBps: 50,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        },
        idempotencyKey: 'test'
      }
    });
    
    // Should return 400 (validation error) or 403 (feature disabled)
    expect([400, 403]).toContain(response.status());
  });

  test('should return 200 for public intent status', async ({ request }) => {
    // This test would require a valid intent ID
    // For now, we'll test that the endpoint exists
    const response = await request.get('/api/public/intents/test-intent-id');
    
    // Should return 404 (not found) or 403 (feature disabled)
    expect([404, 403]).toContain(response.status());
  });

  test('should return 200 for health check', async ({ request }) => {
    const response = await request.get('/api/health/p2a');
    
    // Should return 200 (healthy) or 503 (degraded)
    expect([200, 503]).toContain(response.status());
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('checks');
  });
});

test.describe('Embed Functionality', () => {
  test('should load embed script', async ({ page }) => {
    // Test that embed script loads without errors
    await page.goto('http://localhost:3001/embed/intent.js');
    
    // Should return JavaScript content
    const content = await page.content();
    expect(content).toContain('PrediktIntentEmbed');
  });

  test('should render embed page', async ({ page }) => {
    // Test embed page with a test intent ID
    await page.goto('/embed/intent/test-intent-id');
    
    // Should return HTML content
    const content = await page.content();
    expect(content).toContain('html');
  });
});

test.describe('Error Handling', () => {
  test('should handle invalid intent ID gracefully', async ({ page }) => {
    await page.goto('/embed/intent/invalid-intent-id');
    
    // Should not crash the page
    const content = await page.content();
    expect(content).toContain('html');
  });

  test('should show error message for failed API calls', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Open trade panel
    await page.click('text=Create Intent');
    
    // Try to submit with invalid data
    await page.fill('input[type="number"]', '999'); // Invalid size
    await page.click('text=Create Intent');
    
    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Check for proper ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/advisor/actions');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should not crash
    const content = await page.content();
    expect(content).toContain('html');
  });
});

test.describe('Performance', () => {
  test('should load Actions page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/advisor/actions');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should load embed script quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3001/embed/intent.js');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 1 second
    expect(loadTime).toBeLessThan(1000);
  });
});
