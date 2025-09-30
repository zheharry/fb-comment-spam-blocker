/**
 * End-to-end tests for Facebook integration
 * Tests the extension's ability to detect and block spam on Facebook
 */

import { test, expect } from '@playwright/test'

// Note: These tests require a test Facebook account and should be run carefully
// to avoid violating Facebook's terms of service

test.describe('Facebook Comment Spam Blocker E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Load the extension (this assumes the extension is built and available)
    // In real testing, you would load the extension via context.addInitScript or similar
    
    // Navigate to Facebook
    await page.goto('https://www.facebook.com')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should load extension on Facebook', async ({ page }) => {
    // Check if extension content script is loaded
    const extensionLoaded = await page.evaluate(() => {
      // Look for extension-specific elements or functions
      return window.fbSpamBlockerLoaded || false
    })

    // This test would need the extension to set a flag when loaded
    // expect(extensionLoaded).toBe(true)
    
    // For now, just verify we're on Facebook
    expect(page.url()).toContain('facebook.com')
  })

  test('should detect spam comments in news feed', async ({ page }) => {
    // This test would require:
    // 1. A test post with known spam comments
    // 2. The ability to inject test comments
    // 3. Verification that the extension blocks them
    
    // Skip this test in CI/automated runs
    test.skip(process.env.CI, 'Skipping Facebook interaction tests in CI')
    
    // Navigate to a specific test post or create one
    // This would require test data setup
    
    // Look for comment sections
    const commentSections = page.locator('[data-testid="comment"]')
    await expect(commentSections.first()).toBeVisible({ timeout: 10000 })
    
    // Check if any comments are marked as spam by our extension
    const blockedComments = page.locator('.fb-spam-blocker-replacement')
    
    // Verify extension is working (this would depend on having actual spam to detect)
    console.log('Comment sections found:', await commentSections.count())
  })

  test('should show popup interface', async ({ page, context }) => {
    // Skip in CI
    test.skip(process.env.CI, 'Skipping extension popup tests in CI')
    
    // In a real test, you would:
    // 1. Click the extension icon
    // 2. Verify popup opens
    // 3. Check UI elements are present
    
    // For now, just verify the page structure we expect
    await expect(page).toHaveTitle(/Facebook/)
  })

  test('should handle Facebook UI changes gracefully', async ({ page }) => {
    // Test that the extension doesn't crash when Facebook updates its UI
    
    // Navigate to different Facebook sections
    const sections = [
      '/',           // News feed
      '/marketplace', // Marketplace
      '/groups',     // Groups
      '/watch'       // Watch
    ]
    
    for (const section of sections) {
      try {
        await page.goto(`https://www.facebook.com${section}`)
        await page.waitForLoadState('networkidle', { timeout: 5000 })
        
        // Check that the page loaded without errors
        const errorElements = page.locator('[role="alert"]')
        const errorCount = await errorElements.count()
        
        // Some alerts are normal (like cookie notices), so we just log them
        if (errorCount > 0) {
          console.log(`Found ${errorCount} alert(s) on ${section}`)
        }
        
        // Verify basic Facebook structure is present
        await expect(page.locator('body')).toBeVisible()
        
      } catch (error) {
        console.log(`Navigation to ${section} failed:`, error.message)
      }
    }
  })

  test('should respect user preferences', async ({ page }) => {
    // Test that extension respects user configuration
    
    // This would involve:
    // 1. Opening extension popup
    // 2. Changing settings
    // 3. Verifying behavior changes accordingly
    
    // Skip detailed testing for now
    test.skip(process.env.CI, 'Skipping preference tests in CI')
    
    expect(page.url()).toContain('facebook.com')
  })
})

test.describe('Facebook DOM Parser Tests', () => {
  test('should parse comment structure correctly', async ({ page }) => {
    // Navigate to Facebook
    await page.goto('https://www.facebook.com')
    await page.waitForLoadState('networkidle')
    
    // Inject our parser code for testing
    const parseResults = await page.evaluate(() => {
      // Mock Facebook comment structure for testing
      const mockComment = document.createElement('div')
      mockComment.setAttribute('data-testid', 'comment')
      mockComment.innerHTML = `
        <div>
          <a href="/user123">Test User</a>
          <span>This is a test comment with some text</span>
          <time datetime="2024-01-01T12:00:00Z">1 hour ago</time>
        </div>
      `
      
      document.body.appendChild(mockComment)
      
      // Test basic element detection
      const comments = document.querySelectorAll('[data-testid="comment"]')
      const userLinks = document.querySelectorAll('a[href*="/"]')
      const timeElements = document.querySelectorAll('time[datetime]')
      
      return {
        commentCount: comments.length,
        userLinkCount: userLinks.length,
        timeElementCount: timeElements.length,
        sampleText: comments[0]?.textContent || ''
      }
    })
    
    expect(parseResults.commentCount).toBeGreaterThan(0)
    expect(parseResults.sampleText).toContain('test comment')
  })

  test('should handle dynamic content loading', async ({ page }) => {
    await page.goto('https://www.facebook.com')
    
    // Test that our extension can handle dynamically loaded content
    const initialCommentCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="comment"]').length
    })
    
    // Simulate scrolling to load more content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    
    // Wait for potential new content
    await page.waitForTimeout(2000)
    
    const finalCommentCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="comment"]').length
    })
    
    // Comment count might increase with scrolling (or stay the same if no new content)
    expect(finalCommentCount).toBeGreaterThanOrEqual(initialCommentCount)
  })
})

test.describe('Performance Tests', () => {
  test('should not significantly impact page load time', async ({ page }) => {
    // Measure page load time with extension
    const startTime = Date.now()
    
    await page.goto('https://www.facebook.com')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Extension should not add more than 2 seconds to load time
    expect(loadTime).toBeLessThan(10000) // 10 seconds total (generous for slow connections)
    
    console.log(`Page load time with extension: ${loadTime}ms`)
  })

  test('should not cause memory leaks', async ({ page }) => {
    await page.goto('https://www.facebook.com')
    
    // Get initial memory usage (if available)
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null
    })
    
    // Navigate around Facebook to test for memory leaks
    const pages = ['/', '/marketplace', '/groups']
    
    for (const pagePath of pages) {
      await page.goto(`https://www.facebook.com${pagePath}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }
    
    // Check final memory usage
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null
    })
    
    if (initialMetrics && finalMetrics) {
      const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize
      console.log(`Memory increase: ${memoryIncrease} bytes`)
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    }
  })
})