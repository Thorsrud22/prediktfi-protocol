import { test, expect } from '@playwright/test'

test('closing connect modal is silent (no WalletNotSelectedError)', async ({ page }) => {
  const logs: string[] = []
  page.on('console', m => logs.push(m.text()))
  
  await page.goto('/')
  
  // Open modal (the official button)
  const connectButton = page.getByRole('button', { name: /connect/i }).first()
  if (await connectButton.isVisible()) {
    await connectButton.click()
    
    // Wait a moment for modal to open
    await page.waitForTimeout(500)
    
    // Close modal via Escape (simulate user cancel)
    await page.keyboard.press('Escape')
    
    // Wait a moment for any error handling
    await page.waitForTimeout(500)
  }
  
  // Assert: no console spam
  const logText = logs.join('\n')
  expect(logText).not.toMatch(/WalletNotSelectedError/i)
  expect(logText).not.toMatch(/\[WalletError\]/i)
})
