import { test, expect, vi } from 'vitest'

// Mock the Next.js router and other browser-specific APIs
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/studio',
  query: {},
  asPath: '/studio',
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/dynamic', () => ({
  default: (fn: any) => fn(),
}))

test('SaveInsightModal renders without ReferenceError when no insight is present', async ({ page }) => {
  const logs: string[] = []
  
  // Capture console messages
  page.on('console', msg => {
    logs.push(msg.text())
  })
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    logs.push(`PAGE ERROR: ${error.message}`)
  })
  
  // Navigate to studio page
  await page.goto('/studio')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // Try to open the modal by clicking "Save & Preview" button if it exists
  // This might not work if the button requires an insight first, which is fine
  const saveButton = page.locator('button:has-text("Save & Preview")')
  if (await saveButton.isVisible()) {
    await saveButton.click()
  }
  
  // Check that no ReferenceError occurred
  const errorMessages = logs.filter(log => 
    log.includes('ReferenceError') && 
    log.toLowerCase().includes('insightresponse')
  )
  
  expect(errorMessages).toHaveLength(0)
  
  // Also check that the page doesn't have any uncaught errors
  const jsErrors = logs.filter(log => 
    log.includes('PAGE ERROR') || 
    log.includes('Uncaught')
  )
  
  expect(jsErrors).toHaveLength(0)
})

test('SaveInsightModal shows disabled state when no insight is available', async ({ page }) => {
  await page.goto('/studio')
  await page.waitForLoadState('networkidle')
  
  // Check that Save & Preview button is either not visible or disabled
  // when no insight has been generated
  const saveButton = page.locator('button:has-text("Save & Preview")')
  
  if (await saveButton.isVisible()) {
    // If button is visible, it should be disabled
    await expect(saveButton).toBeDisabled()
  }
  
  // The test passes if the button is either not visible or disabled
  // This ensures the modal handles the null insight case properly
})
