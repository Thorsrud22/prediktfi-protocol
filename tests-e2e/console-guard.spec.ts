import { test, expect } from '@playwright/test'

test('no WalletContext errors on key routes', async ({ page }) => {
  const logs: string[] = []
  page.on('console', m => logs.push(m.text()))
  
  for (const path of ['/', '/pricing', '/account', '/advisor', '/pay']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  
  const logText = logs.join('\n')
  expect(logText).not.toMatch(/WalletContext|You have tried to read .* on a WalletContext/i)
})
