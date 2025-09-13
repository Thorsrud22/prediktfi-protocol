import { test, expect } from '@playwright/test'

test.describe('Console Guard - Duplicate Key Regression', () => {
  test('should not produce duplicate key errors when interacting with wallet modal', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleLogs: string[] = []

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(text)
      
      // Specifically capture error messages
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait a moment for initial render
    await page.waitForTimeout(500)

    // Open wallet modal
    const connectButton = page.getByRole('button', { name: /connect/i })
    await expect(connectButton).toBeVisible()
    await connectButton.click()

    // Wait for modal to appear
    await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
    await page.waitForTimeout(500)

    // Navigate within the modal (hover over different wallet options)
    const walletOptions = page.locator('.wallet-adapter-modal-list-item')
    const optionCount = await walletOptions.count()

    if (optionCount > 0) {
      // Hover over each wallet option
      for (let i = 0; i < optionCount; i++) {
        await walletOptions.nth(i).hover()
        await page.waitForTimeout(100) // Small delay between hovers
      }

      // Click on the first wallet option to trigger potential re-renders
      await walletOptions.first().click()
      await page.waitForTimeout(300)

      // Close modal by clicking outside or pressing Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }

    // Re-open the modal to test for duplicate key issues
    if (await connectButton.isVisible()) {
      await connectButton.click()
      await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
      await page.waitForTimeout(500)

      // Interact with modal again
      if (optionCount > 0) {
        await walletOptions.first().hover()
        await page.waitForTimeout(100)
        
        // Try clicking a different wallet option
        if (optionCount > 1) {
          await walletOptions.nth(1).click()
          await page.waitForTimeout(300)
        }
      }

      // Close modal again
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }

    // Navigate to different pages to test wallet modal across routes
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)

    // Test wallet modal on pricing page
    const pricingConnectButton = page.getByRole('button', { name: /connect/i })
    if (await pricingConnectButton.isVisible()) {
      await pricingConnectButton.click()
      await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
      await page.waitForTimeout(300)
      
      // Interact with modal
      const pricingWalletOptions = page.locator('.wallet-adapter-modal-list-item')
      const pricingOptionCount = await pricingWalletOptions.count()
      
      if (pricingOptionCount > 0) {
        await pricingWalletOptions.first().hover()
        await page.waitForTimeout(100)
      }
      
      // Close modal
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }

    // Navigate to account page
    await page.goto('/account')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)

    // Test wallet modal on account page
    const accountConnectButton = page.getByRole('button', { name: /connect/i })
    if (await accountConnectButton.isVisible()) {
      await accountConnectButton.click()
      await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
      await page.waitForTimeout(300)
      
      // Final interaction with modal
      const accountWalletOptions = page.locator('.wallet-adapter-modal-list-item')
      const accountOptionCount = await accountWalletOptions.count()
      
      if (accountOptionCount > 0) {
        // Hover over multiple options quickly to stress test
        for (let i = 0; i < Math.min(accountOptionCount, 3); i++) {
          await accountWalletOptions.nth(i).hover()
          await page.waitForTimeout(50)
        }
      }
      
      // Close modal
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }

    // Wait a bit more for any delayed console messages
    await page.waitForTimeout(1000)

    // Check for duplicate key errors
    const allLogs = consoleLogs.join('\n')
    
    // Assert no duplicate key errors
    expect(allLogs).not.toMatch(/two children with the same key/i)
    expect(allLogs).not.toMatch(/duplicate key/i)
    expect(allLogs).not.toMatch(/same key.*provided to/i)
    expect(allLogs).not.toMatch(/encountered two children with the same key/i)

    // Also check console errors specifically
    const errorText = consoleErrors.join('\n')
    expect(errorText).not.toMatch(/two children with the same key/i)
    expect(errorText).not.toMatch(/duplicate key/i)
    expect(errorText).not.toMatch(/same key.*provided to/i)

    // Log summary for debugging if needed
    console.log(`Captured ${consoleLogs.length} console messages, ${consoleErrors.length} errors`)
    
    // If there are any React-related errors, log them for investigation
    const reactErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('react') || 
      error.toLowerCase().includes('key') ||
      error.toLowerCase().includes('warning')
    )
    
    if (reactErrors.length > 0) {
      console.log('React-related console messages:', reactErrors)
    }

    // Ensure no React key warnings at all
    expect(reactErrors.filter(error => 
      error.toLowerCase().includes('key') && 
      error.toLowerCase().includes('same')
    )).toHaveLength(0)
  })

  test('should not produce duplicate key errors during rapid wallet modal interactions', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Rapid open/close cycles to stress test for duplicate keys
    for (let cycle = 0; cycle < 5; cycle++) {
      // Open modal
      const connectButton = page.getByRole('button', { name: /connect/i })
      if (await connectButton.isVisible()) {
        await connectButton.click()
        
        // Wait for modal to appear
        try {
          await page.waitForSelector('.wallet-adapter-modal', { timeout: 2000 })
          await page.waitForTimeout(100)
          
          // Quick interaction
          const walletOptions = page.locator('.wallet-adapter-modal-list-item')
          const count = await walletOptions.count()
          
          if (count > 0) {
            await walletOptions.first().hover()
            await page.waitForTimeout(50)
          }
          
          // Close modal quickly
          await page.keyboard.press('Escape')
          await page.waitForTimeout(100)
        } catch (error) {
          console.log(`Cycle ${cycle}: Modal interaction failed, continuing...`)
        }
      }
    }

    // Final check for duplicate key errors
    const errorText = consoleErrors.join('\n')
    expect(errorText).not.toMatch(/two children with the same key/i)
    expect(errorText).not.toMatch(/duplicate key/i)
  })

  test('should handle wallet provider re-renders without key conflicts', async ({ page }) => {
    const consoleWarnings: string[] = []
    const consoleErrors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'warning') {
        consoleWarnings.push(text)
      }
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Trigger potential re-renders by navigating and returning
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(200)

    await page.goto('/account')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(200)

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(200)

    // Open wallet modal after navigation
    const connectButton = page.getByRole('button', { name: /connect/i })
    if (await connectButton.isVisible()) {
      await connectButton.click()
      await page.waitForTimeout(300)
      
      // Verify modal appears without key errors
      await expect(page.locator('.wallet-adapter-modal')).toBeVisible()
      
      // Close modal
      await page.keyboard.press('Escape')
    }

    // Check for any React key warnings or errors
    const allWarnings = consoleWarnings.join('\n')
    const allErrors = consoleErrors.join('\n')

    expect(allWarnings).not.toMatch(/two children with the same key/i)
    expect(allWarnings).not.toMatch(/duplicate key/i)
    expect(allErrors).not.toMatch(/two children with the same key/i)
    expect(allErrors).not.toMatch(/duplicate key/i)
  })
})
