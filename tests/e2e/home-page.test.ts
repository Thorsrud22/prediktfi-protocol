import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display top creator badges when rank <= 3', async ({ page }) => {
    // Mock the leaderboard API response
    await page.route('/api/leaderboard?period=90d&limit=50', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leaderboard: [
            { id: 'creator-1', handle: 'alice', score: 0.95, accuracy: 0.92, totalInsights: 100, resolvedInsights: 80, averageBrier: 0.2, rank: 1, isProvisional: false },
            { id: 'creator-2', handle: 'bob', score: 0.90, accuracy: 0.88, totalInsights: 80, resolvedInsights: 70, averageBrier: 0.25, rank: 2, isProvisional: false },
            { id: 'creator-3', handle: 'charlie', score: 0.85, accuracy: 0.85, totalInsights: 60, resolvedInsights: 50, averageBrier: 0.3, rank: 3, isProvisional: false },
            { id: 'creator-4', handle: 'diana', score: 0.80, accuracy: 0.82, totalInsights: 40, resolvedInsights: 30, averageBrier: 0.35, rank: 4, isProvisional: false },
          ],
          meta: { period: '90d', limit: 50, total: 4, generatedAt: new Date().toISOString() }
        })
      });
    });

    await page.goto('/');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="top-creators"]', { timeout: 10000 });

    // Check that top 3 creators have badges
    await expect(page.locator('text=Top 1 this week')).toBeVisible();
    await expect(page.locator('text=Top 2 this week')).toBeVisible();
    await expect(page.locator('text=Top 3 this week')).toBeVisible();

    // Check that 4th creator doesn't have a badge
    await expect(page.locator('text=Top 4 this week')).not.toBeVisible();
  });

  test('should show toast on copy CTA click', async ({ page }) => {
    await page.goto('/');

    // Mock the copy CTA component (this would be in a real component)
    await page.evaluate(() => {
      // Simulate a copy CTA click
      const event = new CustomEvent('model_copy_clicked', {
        detail: { variant: 'A', insightId: 'test-insight' }
      });
      window.dispatchEvent(event);
    });

    // Check that toast appears
    await expect(page.locator('text=Copied. Open Actions to sign')).toBeVisible();
    await expect(page.locator('text=Open Actions')).toBeVisible();
  });

  test('should track analytics events on CTA clicks', async ({ page }) => {
    const analyticsRequests: any[] = [];

    // Intercept analytics requests
    await page.route('/api/analytics', async route => {
      const request = route.request();
      const body = await request.postDataJSON();
      analyticsRequests.push(body);
      await route.fulfill({ status: 200 });
    });

    await page.goto('/');

    // Click on "Start Creating" button
    await page.click('text=🚀 Start Creating');
    await page.waitForTimeout(100);

    // Click on "View Leaderboard" button
    await page.click('text=🏆 View Leaderboard');
    await page.waitForTimeout(100);

    // Click on "View All" in trending section
    await page.click('text=View All →');
    await page.waitForTimeout(100);

    // Check that analytics events were tracked
    expect(analyticsRequests).toHaveLength(3);
    expect(analyticsRequests[0].event).toBe('home_hero_open_studio_clicked');
    expect(analyticsRequests[1].event).toBe('home_hero_view_feed_clicked');
    expect(analyticsRequests[2].event).toBe('home_trending_view_all');
  });

  test('should display skeleton loaders while loading', async ({ page }) => {
    // Delay the API response to see skeleton loaders
    await page.route('/api/leaderboard?period=90d&limit=50', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leaderboard: [],
          meta: { period: '90d', limit: 50, total: 0, generatedAt: new Date().toISOString() }
        })
      });
    });

    await page.goto('/');

    // Check that skeleton loaders are visible initially
    await expect(page.locator('[data-testid="skeleton-creator-item"]')).toBeVisible();
  });

  test('should show score tooltips on hover', async ({ page }) => {
    // Mock the leaderboard API response
    await page.route('/api/leaderboard?period=90d&limit=50', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leaderboard: [
            { id: 'creator-1', handle: 'alice', score: 0.95, accuracy: 0.92, totalInsights: 100, resolvedInsights: 80, averageBrier: 0.2, rank: 1, isProvisional: false },
          ],
          meta: { period: '90d', limit: 50, total: 1, generatedAt: new Date().toISOString() }
        })
      });
    });

    await page.goto('/');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="top-creators"]', { timeout: 10000 });

    // Hover over the score info icon
    const infoIcon = page.locator('[aria-label="Score calculation details"]').first();
    await infoIcon.hover();

    // Check that tooltip appears
    await expect(page.locator('text=Score Calculation')).toBeVisible();
    await expect(page.locator('text=Accuracy:')).toBeVisible();
    await expect(page.locator('text=92.0%')).toBeVisible();
  });
});
