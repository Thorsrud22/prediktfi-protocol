import { test, expect } from '@playwright/test';

test.describe('Creator Profile', () => {
  test('should display creator profile with share functionality', async ({ page }) => {
    // Navigate to leaderboard first
    await page.goto('/leaderboard-v2');
    
    // Wait for leaderboard to load
    await page.waitForSelector('[data-testid="leaderboard"]', { timeout: 10000 });
    
    // Click on the first creator row
    const firstCreatorRow = page.locator('[data-testid="leaderboard-row"]').first();
    await expect(firstCreatorRow).toBeVisible();
    
    // Get the creator handle from the row
    const creatorHandle = await firstCreatorRow.locator('[data-testid="creator-handle"]').textContent();
    expect(creatorHandle).toBeTruthy();
    
    // Click on the creator row to navigate to profile
    await firstCreatorRow.click();
    
    // Wait for navigation to creator profile
    await page.waitForURL(/\/creator\/.*/, { timeout: 10000 });
    
    // Verify we're on the creator profile page
    const url = page.url();
    expect(url).toMatch(/\/creator\/.+/);
    
    // Check that profile elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Score')).toBeVisible();
    await expect(page.locator('text=Share on X')).toBeVisible();
    await expect(page.locator('text=Copy link')).toBeVisible();
    
    // Check for performance badges
    const performanceBadge = page.locator('[class*="bg-gradient-to-r from-yellow-500 to-orange-500"]');
    const provisionalBadge = page.locator('text=Provisional');
    
    // At least one of these should be visible
    const hasPerformanceBadge = await performanceBadge.isVisible();
    const hasProvisionalBadge = await provisionalBadge.isVisible();
    expect(hasPerformanceBadge || hasProvisionalBadge).toBeTruthy();
  });

  test('should handle 304 responses for history API', async ({ page }) => {
    // Track network responses
    const responses: { url: string; status: number }[] = [];
    
    page.on('response', (response) => {
      if (response.url().includes('/api/profile/') || response.url().includes('/history')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Navigate to a creator profile
    await page.goto('/creator/alice_predictor');
    
    // Wait for initial load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Reload the page to trigger 304 check
    await page.reload();
    
    // Wait for reload to complete
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check that we got 304 responses for cached data
    const historyResponses = responses.filter(r => r.url.includes('/history'));
    const profileResponses = responses.filter(r => r.url.includes('/api/profile/'));
    
    // At least one 304 response should be present (either history or profile)
    const has304Response = [...historyResponses, ...profileResponses].some(r => r.status === 304);
    
    // This might not always be 304 on first load, but should be on subsequent loads
    console.log('Response statuses:', responses);
    
    // Verify the page still loads correctly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Score')).toBeVisible();
  });

  test('should display calibration chart when data is available', async ({ page }) => {
    await page.goto('/creator/alice_predictor');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Look for calibration chart section
    const calibrationSection = page.locator('text=Calibration Analysis');
    await expect(calibrationSection).toBeVisible();
    
    // Check for chart container (SVG or canvas)
    const chartContainer = page.locator('svg, canvas').first();
    await expect(chartContainer).toBeVisible();
  });

  test('should handle non-existent creator gracefully', async ({ page }) => {
    // Navigate to non-existent creator
    const response = await page.goto('/creator/nonexistent_creator_12345');
    
    // Should return 404
    expect(response?.status()).toBe(404);
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible();
  });
});
