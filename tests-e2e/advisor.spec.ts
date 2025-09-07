// tests-e2e/advisor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Advisor Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Set feature flags
    await page.addInitScript(() => {
      window.localStorage.setItem('predikt:featureFlags', JSON.stringify({
        ADVISOR: true,
        ALERTS: true
      }));
    });
  });

  test('should show advisor page when feature is enabled', async ({ page }) => {
    await page.goto('/advisor');
    
    // Check if advisor page loads
    await expect(page.locator('h1')).toContainText('Predikt Advisor');
    await expect(page.locator('text=Connect Your Wallet')).toBeVisible();
  });

  test('should show advisor link in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if advisor link is visible in navigation
    await expect(page.locator('text=Advisor')).toBeVisible();
  });

  test('should handle wallet connection flow', async ({ page }) => {
    await page.goto('/advisor');
    
    // Mock wallet address
    const mockAddress = 'So11111111111111111111111111111111111111112';
    
    // Fill in wallet address
    await page.fill('input[placeholder*="wallet address"]', mockAddress);
    
    // Mock API response
    await page.route('/api/advisor/portfolio/snapshot', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            snapshot: {
              walletId: 'test-wallet',
              timestamp: new Date().toISOString(),
              totalValueUsd: 10000,
              holdings: [
                {
                  asset: 'So11111111111111111111111111111111111111112',
                  symbol: 'SOL',
                  amount: 10,
                  valueUsd: 1000
                }
              ],
              topPositions: [
                {
                  asset: 'So11111111111111111111111111111111111111112',
                  symbol: 'SOL',
                  amount: 10,
                  valueUsd: 1000
                }
              ],
              concentration: {
                hhi: 0.2,
                top5Percent: 80,
                stablecoinPercent: 20
              },
              risk: {
                drawdownFromAth: 5,
                volatility: 0.3,
                diversification: 'medium'
              }
            },
            riskAssessment: {
              overallRisk: 'medium',
              riskScore: 45,
              riskFactors: [],
              recommendations: []
            }
          }
        })
      });
    });
    
    // Click connect button
    await page.click('button:has-text("Connect Wallet")');
    
    // Wait for portfolio to load
    await expect(page.locator('text=Portfolio Overview')).toBeVisible();
    await expect(page.locator('text=$10,000')).toBeVisible();
  });

  test('should navigate to alerts page', async ({ page }) => {
    await page.goto('/advisor');
    
    // Mock wallet connection
    await page.addInitScript(() => {
      window.localStorage.setItem('predikt:connectedWallets', JSON.stringify([{
        id: 'test-wallet',
        address: 'So11111111111111111111111111111111111111112',
        chain: 'solana'
      }]));
    });
    
    await page.goto('/advisor/alerts');
    
    // Check if alerts page loads
    await expect(page.locator('h1')).toContainText('Alert Management');
    await expect(page.locator('text=Select Wallet')).toBeVisible();
  });

  test('should navigate to strategies page', async ({ page }) => {
    await page.goto('/advisor');
    
    // Mock wallet connection
    await page.addInitScript(() => {
      window.localStorage.setItem('predikt:connectedWallets', JSON.stringify([{
        id: 'test-wallet',
        address: 'So11111111111111111111111111111111111111112',
        chain: 'solana'
      }]));
    });
    
    await page.goto('/advisor/strategies');
    
    // Check if strategies page loads
    await expect(page.locator('h1')).toContainText('Strategy Studio');
    await expect(page.locator('text=Generate Strategy')).toBeVisible();
  });

  test('should create alert rule', async ({ page }) => {
    await page.goto('/advisor/alerts');
    
    // Mock wallet connection
    await page.addInitScript(() => {
      window.localStorage.setItem('predikt:connectedWallets', JSON.stringify([{
        id: 'test-wallet',
        address: 'So11111111111111111111111111111111111111112',
        chain: 'solana'
      }]));
    });
    
    await page.goto('/advisor/alerts');
    
    // Select wallet
    await page.selectOption('select', 'test-wallet');
    
    // Click new alert button
    await page.click('button:has-text("New Alert")');
    
    // Fill in alert form
    await page.fill('input[placeholder*="descriptive name"]', 'Test Alert');
    await page.selectOption('select', 'price_drop');
    await page.fill('input[type="number"]', '10');
    await page.selectOption('select', '1h');
    
    // Mock API response
    await page.route('/api/advisor/alerts/rules', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-rule',
            walletId: 'test-wallet',
            name: 'Test Alert',
            ruleJson: { type: 'price_drop', threshold: 10 },
            channel: 'inapp',
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    });
    
    // Submit form
    await page.click('button:has-text("Create Alert Rule")');
    
    // Check if rule was created
    await expect(page.locator('text=Test Alert')).toBeVisible();
  });

  test('should generate strategy from prompt', async ({ page }) => {
    await page.goto('/advisor/strategies');
    
    // Mock wallet connection
    await page.addInitScript(() => {
      window.localStorage.setItem('predikt:connectedWallets', JSON.stringify([{
        id: 'test-wallet',
        address: 'So11111111111111111111111111111111111111112',
        chain: 'solana'
      }]));
    });
    
    await page.goto('/advisor/strategies');
    
    // Select wallet
    await page.selectOption('select', 'test-wallet');
    
    // Click new strategy button
    await page.click('button:has-text("New Strategy")');
    
    // Fill in strategy prompt
    await page.fill('textarea', 'Monitor my portfolio and alert me if Bitcoin drops by more than 15%');
    
    // Click generate button
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for generation to complete
    await expect(page.locator('text=Generated Strategy Preview')).toBeVisible();
    
    // Check if strategy was generated
    await expect(page.locator('text=Strategy: Monitor my portfolio')).toBeVisible();
  });

  test('should show feature disabled message when flags are off', async ({ page }) => {
    // Clear feature flags
    await page.addInitScript(() => {
      window.localStorage.removeItem('predikt:featureFlags');
    });
    
    await page.goto('/advisor');
    
    // Check if feature disabled message is shown
    await expect(page.locator('text=Advisor Feature Not Available')).toBeVisible();
  });
});
