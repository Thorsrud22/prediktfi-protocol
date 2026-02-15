import { test, expect } from '@playwright/test'

test('no WalletNotConnectedError/duplicate-key errors during nav', async ({ page }) => {
  const logs: string[] = []
  page.on('console', m => logs.push(m.text()))
  
  await page.goto('/')
  await page.goto('/studio')
  await page.goto('/pricing')
  await page.goto('/pay')
  await page.goto('/account')
  
  // Check that meaningful wallet errors are not being spammed
  const errorLogs = logs.join('\n')
  expect(errorLogs).not.toMatch(/WalletNotConnectedError/i)
  expect(errorLogs).not.toMatch(/two children with the same key/i)
  // Note: WalletContext errors may still appear but shouldn't include NotConnected errors
})

test('direct phantom flow does not mount wallet-adapter modal', async ({ page }) => {
  await page.goto('/account')

  const modalSelectors =
    '.wallet-adapter-modal-wrapper, .wallet-adapter-modal, .wallet-adapter-modal-overlay, .wallet-adapter-modal-container'
  const connectButton = page.getByRole('button', { name: /connect phantom/i })
  await expect(connectButton).toBeVisible()

  await expect(page.locator(modalSelectors)).toHaveCount(0)
  const bodyBeforeClass = await page.evaluate(() => document.body.className)

  await connectButton.click()
  await page.waitForTimeout(1200)

  await expect(page.locator(modalSelectors)).toHaveCount(0)
  const bodyAfterClass = await page.evaluate(() => document.body.className)
  expect(bodyBeforeClass.includes('modal-open')).toBe(false)
  expect(bodyAfterClass.includes('modal-open')).toBe(false)
})

test('gating copy reflects actual state', async ({ page }) => {
  // Pricing now shows plan CTAs instead of wallet-gating copy
  await page.goto('/pricing')
  await expect(page.getByRole('heading', { name: /choose your plan/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /start scouting/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /get founder pro/i })).toBeVisible()
  
  // Pay still requires wallet connection
  await page.goto('/pay')
  await expect(page.getByText(/connect with phantom in the header to continue/i)).toBeVisible()
  
  // Account has direct connect action
  await page.goto('/account')
  await expect(page.getByRole('button', { name: /connect phantom/i })).toBeVisible()
})

test('pay endpoint returns 200 with link', async ({ page }) => {
  // Test the API endpoint directly
  const response = await page.request.post('/api/pay/create', {
    data: {
      plan: 'pro',
      currency: 'SOL',
      payer: 'test_wallet_address'
    }
  })
  
  expect(response.status()).toBe(200)
  
  const data = await response.json()
  expect(data).toHaveProperty('ok', true)
  expect(data).toHaveProperty('link')
  expect(data).toHaveProperty('plan', 'pro')
  expect(data).toHaveProperty('currency', 'SOL')
  expect(data.link).toMatch(/^solana:/)
})
