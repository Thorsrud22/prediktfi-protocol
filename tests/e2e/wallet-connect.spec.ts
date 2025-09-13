import { test, expect } from '@playwright/test'

test('wallet modal shows curated Solana wallets', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /connect/i }).click()
  await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
  const listText = await page.locator('.wallet-adapter-modal-container').innerText()
  expect(listText).toMatch(/Phantom/i)
  expect(listText).toMatch(/Solflare/i)
  expect(listText).toMatch(/Ledger/i)
  expect(listText).not.toMatch(/Backpack/i)
  expect(listText).not.toMatch(/Coinbase/i)
  expect(listText).not.toMatch(/MetaMask/i)
})

test('pricing gated until wallet connected', async ({ page }) => {
  await page.goto('/pricing')
  const btn = page.getByRole('button', { name: /upgrade/i })
  await expect(btn).toBeDisabled()
  
  // Check that the connect wallet message is shown
  await expect(page.locator('text=Connect Your Wallet')).toBeVisible()
  await expect(page.locator('text=Connect wallet to upgrade')).toBeVisible()
})

test('account page shows connect message when not connected', async ({ page }) => {
  await page.goto('/account')
  await expect(page.locator('text=Connect your wallet via the header')).toBeVisible()
  await expect(page.locator('text=Connect Your Wallet')).toBeVisible()
})

test('advisor page shows connect message when not connected', async ({ page }) => {
  await page.goto('/advisor')
  await expect(page.locator('text=Connect Your Wallet')).toBeVisible()
  await expect(page.locator('text=Connect your wallet via the header')).toBeVisible()
})

test('actions page shows connect message when not connected', async ({ page }) => {
  await page.goto('/advisor/actions')
  await expect(page.locator('text=Connect Your Wallet')).toBeVisible()
  await expect(page.locator('text=Connect your wallet via the header')).toBeVisible()
})

test('header shows connect button when not connected', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /connect/i })).toBeVisible()
})

test('no duplicate wallet keys in console', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('same key')) {
      consoleErrors.push(msg.text())
    }
  })
  
  await page.goto('/')
  await page.getByRole('button', { name: /connect/i }).click()
  await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
  
  // Wait a bit for any potential errors
  await page.waitForTimeout(1000)
  
  // Should not have any duplicate key errors
  expect(consoleErrors).toHaveLength(0)
})

test('account page shows state-driven hints', async ({ page }) => {
  await page.goto('/account')
  
  // Should show connect hint when not connected
  await expect(page.getByText('Connect via the header to access your account')).toBeVisible()
  
  // Should not show any wallet connect buttons on the page
  const connectButtons = page.locator('button:has-text("Connect")')
  await expect(connectButtons).toHaveCount(0)
})

test('advisor page shows state-driven hints', async ({ page }) => {
  await page.goto('/advisor')
  
  // Should show connect hint when not connected
  await expect(page.getByText('Connect via the header to continue')).toBeVisible()
  
  // Should not show any wallet connect buttons on the page
  const connectButtons = page.locator('button:has-text("Connect")')
  await expect(connectButtons).toHaveCount(0)
})

test('actions page shows state-driven hints', async ({ page }) => {
  await page.goto('/advisor/actions')
  
  // Should show connect hint when not connected
  await expect(page.getByText('Connect via the header to continue')).toBeVisible()
  
  // Should not show any wallet connect buttons on the page
  const connectButtons = page.locator('button:has-text("Connect")')
  await expect(connectButtons).toHaveCount(0)
})

test('header connect button shows correct states', async ({ page }) => {
  await page.goto('/')
  
  // Initially should show connect button
  await expect(page.getByRole('button', { name: /connect/i })).toBeVisible()
  
  // Click connect and verify modal appears
  await page.getByRole('button', { name: /connect/i }).click()
  await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
  
  // Close modal
  await page.keyboard.press('Escape')
  await expect(page.locator('.wallet-adapter-modal')).not.toBeVisible()
})
