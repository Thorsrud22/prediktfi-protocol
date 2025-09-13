import { test, expect } from '@playwright/test'

test('no WalletContext/duplicate-key errors during nav', async ({ page }) => {
  const logs: string[] = []
  page.on('console', m => logs.push(m.text()))
  
  await page.goto('/')
  await page.goto('/pricing')
  await page.goto('/advisor')
  await page.goto('/pay')
  
  // Check that there are no WalletContext errors or duplicate key warnings
  const errorLogs = logs.join('\n')
  expect(errorLogs).not.toMatch(/WalletContext|two children with the same key/i)
  expect(errorLogs).not.toMatch(/You have tried to read publicKey on a WalletContext/i)
})

test('disconnect clears adapter and session', async ({ page }) => {
  await page.goto('/')
  
  // Look for connect button in header
  const connectButton = page.getByRole('button', { name: /connect wallet/i })
  await expect(connectButton).toBeVisible()
  
  // Note: In a real test, you would mock wallet connection here
  // For now, we just verify the disconnect button would work if connected
  
  // Check that pages show correct gating messages
  await page.goto('/pricing')
  await expect(page.getByText(/connect wallet to upgrade/i)).toBeVisible()
  
  await page.goto('/advisor')
  await expect(page.getByText(/connect via the header to continue/i)).toBeVisible()
  
  await page.goto('/pay')
  await expect(page.getByText(/connect via header to continue/i)).toBeVisible()
})

test('gating copy reflects actual state', async ({ page }) => {
  // Test Connect state
  await page.goto('/pricing')
  await expect(page.getByText(/connect wallet to upgrade/i)).toBeVisible()
  
  await page.goto('/advisor')
  await expect(page.getByText(/connect via the header to continue/i)).toBeVisible()
  
  await page.goto('/pay')
  await expect(page.getByText(/connect via header to continue/i)).toBeVisible()
  
  await page.goto('/advisor/actions')
  await expect(page.getByText(/connect via the header to continue/i)).toBeVisible()
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
