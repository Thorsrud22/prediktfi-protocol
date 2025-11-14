import { test, expect } from '@playwright/test';

test.describe('Feed privacy protections', () => {
  test('only renders public insights and surfaces shared lessons', async ({ page }) => {
    const now = new Date().toISOString();

    await page.route('**/api/feed**', route => {
      const url = route.request().url();
      if (url.includes('/api/feed')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            insights: [
              {
                id: 'public-1',
                question: 'Public forecast visible to everyone',
                category: 'general',
                probability: 0.62,
                confidence: 0.55,
                stamped: false,
                createdAt: now,
                visibility: 'PUBLIC',
                creator: { handle: 'public_creator', score: 82 },
              },
              {
                id: 'private-1',
                question: 'Private forecast should not appear',
                category: 'general',
                probability: 0.4,
                confidence: 0.5,
                stamped: false,
                createdAt: now,
                visibility: 'PRIVATE',
                creator: { handle: 'secret_creator', score: 70 },
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              pages: 1,
              hasNext: false,
              hasPrev: false,
            },
            filters: {
              current: 'all',
              available: ['all'],
            },
            nextCursor: null,
            query: '',
            category: 'all',
            sort: 'recent',
            timeframe: '30d',
          }),
        });
      }

      return route.continue();
    });

    await page.route('**/api/insight/public-lessons**', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          updatedAt: now,
          totals: {
            publicInsights: 12,
            resolvedPublicInsights: 8,
            includedPredictions: 8,
          },
          metrics: {
            averageBrier: 0.23,
            reliability: 0.04,
            resolution: 0.12,
            uncertainty: 0.25,
          },
          calibration: [
            { bin: 5, predicted: 0.6, actual: 0.58, count: 20, deviation: 0.02 },
            { bin: 7, predicted: 0.8, actual: 0.72, count: 10, deviation: 0.08 },
          ],
          highlights: [
            {
              bin: 7,
              label: '70-80%',
              count: 10,
              predicted: 0.8,
              actual: 0.72,
              deviation: 0.08,
              tendency: 'overconfidence',
            },
          ],
        }),
      });
    });

    await page.goto('/feed');

    await expect(page.getByRole('heading', { name: 'Shared Lessons' })).toBeVisible();

    await expect(page.getByText('Public forecast visible to everyone')).toBeVisible();

    await expect(page.getByText('Private forecast should not appear')).toHaveCount(0);

    await expect(page.getByText('Shared predictions', { exact: false })).toBeVisible();
    await expect(page.getByText('70-80%', { exact: false })).toBeVisible();
  });
});
