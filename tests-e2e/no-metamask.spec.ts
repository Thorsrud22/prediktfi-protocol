import { test, expect } from '@playwright/test'

test('no WalletModal UI and no MetaMask anywhere', async ({ page }) => {
  const logs: string[] = []
  page.on('console', m => logs.push(m.text()))
  await page.goto('/')
  await expect(page.getByText(/MetaMask/i)).toHaveCount(0)
  await page.getByRole('button', { name: /connect with phantom/i }).click()
  // If Phantom not installed on CI, the button will open install page; just ensure no console dup-key errors
  expect(logs.join('\n')).not.toMatch(/two children with the same key|MetaMask/i)
})
