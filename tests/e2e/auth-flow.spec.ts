import { test, expect } from '@playwright/test'

test.describe('SIWS Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the auth verify endpoint to return authenticated = true
    await page.route('/api/auth/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          wallet: '7Kj1...Abc4' // Mock shortened wallet address
        })
      })
    })

    // Mock auth status endpoint to return authenticated state
    await page.route('/api/auth/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          wallet: '7Kj1...Abc4'
        })
      })
    })

    // Mock auth nonce endpoint
    await page.route('/api/auth/nonce', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nonce: 'mock-nonce-12345'
        })
      })
    })
  })

  test('header shows authenticated state with wallet address and Account link', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Mock wallet connection
    await page.evaluate(() => {
      // Simulate wallet being connected
      const mockWallet = {
        publicKey: {
          toBase58: () => '7Kj1234567890123456789012345678901234Abc4'
        },
        adapter: {
          signMessage: async () => new Uint8Array(64) // Mock signature
        }
      }
      
      // Mock the wallet context
      window.__WALLET_MOCK__ = {
        connected: true,
        publicKey: mockWallet.publicKey,
        wallet: mockWallet
      }
    })

    // Wait for authentication to complete
    await page.waitForTimeout(1000)

    // Header should show short wallet address instead of "Connect Wallet"
    const walletAddress = page.locator('span', { hasText: /7Kj1.*Abc4/i })
    await expect(walletAddress).toBeVisible()

    // Should show Account link
    const accountLink = page.locator('a[href="/account"]', { hasText: 'Account' })
    await expect(accountLink).toBeVisible()

    // Should show Disconnect button
    const disconnectButton = page.locator('button', { hasText: 'Disconnect' })
    await expect(disconnectButton).toBeVisible()

    // Should NOT show "Sign to continue" message
    const signMessage = page.locator('text=/Sign to continue/i')
    await expect(signMessage).not.toBeVisible()
  })

  test('/pricing page shows enabled Upgrade button when authenticated', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')

    // Mock authentication state in localStorage or session
    await page.evaluate(() => {
      // Mock authenticated state
      window.__AUTH_MOCK__ = {
        authenticated: true,
        wallet: '7Kj1...Abc4'
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // The Upgrade button should be enabled when authenticated=true
    const upgradeButton = page.locator('button, a').filter({ hasText: /upgrade/i }).first()
    
    // Button should be visible
    await expect(upgradeButton).toBeVisible()
    
    // Button should NOT have disabled styling
    const buttonClasses = await upgradeButton.getAttribute('class')
    expect(buttonClasses).not.toContain('cursor-not-allowed')
    expect(buttonClasses).not.toContain('bg-gray-600')
    
    // Should not show "Connect via header to upgrade" text
    const connectMessage = page.locator('text=/Connect via header to upgrade/i')
    await expect(connectMessage).not.toBeVisible()
  })

  test('/account page shows plan/expiry/receipts when authenticated', async ({ page }) => {
    // Mock account data endpoint
    await page.route('/api/account/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'pro',
          expiry: '2024-12-31T23:59:59Z',
          payments: [
            {
              id: 'payment_123',
              amount: 2900,
              currency: 'USD',
              date: '2024-01-15T10:30:00Z',
              status: 'completed'
            }
          ]
        })
      })
    })

    await page.goto('/account')
    await page.waitForLoadState('networkidle')

    // Mock authentication state
    await page.evaluate(() => {
      window.__AUTH_MOCK__ = {
        authenticated: true,
        wallet: '7Kj1...Abc4'
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should show plan information
    const planInfo = page.locator('text=/plan/i, text=/pro/i').first()
    await expect(planInfo).toBeVisible()

    // Should show expiry information
    const expiryInfo = page.locator('text=/expiry/i, text=/expires/i').first()
    await expect(expiryInfo).toBeVisible()

    // Should show receipts/payments section
    const receiptsSection = page.locator('text=/receipt/i, text=/payment/i, text=/billing/i').first()
    await expect(receiptsSection).toBeVisible()

    // Should NOT show "Connect your wallet" message
    const connectMessage = page.locator('text=/Connect your wallet/i')
    await expect(connectMessage).not.toBeVisible()
  })

  test('authentication state persists across page navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Mock wallet connection and authentication
    await page.evaluate(() => {
      window.__WALLET_MOCK__ = {
        connected: true,
        publicKey: {
          toBase58: () => '7Kj1234567890123456789012345678901234Abc4'
        }
      }
      window.__AUTH_MOCK__ = {
        authenticated: true,
        wallet: '7Kj1...Abc4'
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify authenticated state on home page
    const walletAddress = page.locator('span', { hasText: /7Kj1.*Abc4/i })
    await expect(walletAddress).toBeVisible()

    // Navigate to account page
    await page.goto('/account')
    await page.waitForLoadState('networkidle')

    // Should still be authenticated (no connect message)
    const connectMessage = page.locator('text=/Connect your wallet/i')
    await expect(connectMessage).not.toBeVisible()

    // Navigate to pricing page
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')

    // Upgrade button should still be enabled
    const upgradeButton = page.locator('button, a').filter({ hasText: /upgrade/i }).first()
    await expect(upgradeButton).toBeVisible()
    
    const buttonClasses = await upgradeButton.getAttribute('class')
    expect(buttonClasses).not.toContain('cursor-not-allowed')
  })

  test('sign out clears authentication state', async ({ page }) => {
    // Mock sign out endpoint
    await page.route('/api/auth/signout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Start with authenticated state
    await page.evaluate(() => {
      window.__WALLET_MOCK__ = {
        connected: true,
        publicKey: {
          toBase58: () => '7Kj1234567890123456789012345678901234Abc4'
        }
      }
      window.__AUTH_MOCK__ = {
        authenticated: true,
        wallet: '7Kj1...Abc4'
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Click disconnect/sign out button
    const disconnectButton = page.locator('button', { hasText: 'Disconnect' })
    await expect(disconnectButton).toBeVisible()
    await disconnectButton.click()

    // Wait for sign out to complete
    await page.waitForTimeout(500)

    // Mock unauthenticated state after sign out
    await page.route('/api/auth/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: false,
          wallet: null
        })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Header should show Connect Wallet button again
    const connectButton = page.locator('button').filter({ hasText: /Connect/i })
    await expect(connectButton).toBeVisible()

    // Should not show wallet address
    const walletAddress = page.locator('span', { hasText: /7Kj1.*Abc4/i })
    await expect(walletAddress).not.toBeVisible()
  })
})
