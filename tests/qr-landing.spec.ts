import { test, expect } from '@playwright/test';

test.describe('QR Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the QR landing page
    await page.goto('/order/beach-bar-durres/a1');
  });

  test('should load QR landing page quickly', async ({ page }) => {
    // Performance: Check that page loads within 3 seconds
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
  });

  test('should display venue information correctly', async ({ page }) => {
    // Check venue name is displayed
    await expect(page.locator('h1')).toContainText('Beach Bar Durrës');
    
    // Check table number is displayed
    await expect(page.locator('.table-number')).toContainText('a1');
    
    // Check venue address is displayed
    await expect(page.locator('.venue-address')).toContainText('Durrës Beach, Albania');
  });

  test('should have mobile-optimized design', async ({ page }) => {
    // Check mobile viewport rendering
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    // Verify elements are properly sized for mobile
    const button = page.locator('.continue-button');
    await expect(button).toBeVisible();
    
    // Check button is large enough for touch (minimum 44px)
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.width).toBeGreaterThanOrEqual(120);
  });

  test('should navigate to menu page on button click', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Click the "View Menu" button
    await page.click('.continue-button');
    
    // Should navigate to menu page
    await expect(page).toHaveURL(/\/menu\//);
    
    // Menu page should load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Beach Bar Durrës');
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Slow down network to test loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });
    
    await page.goto('/order/beach-bar-durres/a1');
    
    // Should show loading spinner initially
    await expect(page.locator('.loading-spinner')).toBeVisible();
    
    // Loading should complete
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.loading-spinner')).not.toBeVisible();
  });

  test('should handle error states properly', async ({ page }) => {
    // Test with invalid venue slug
    await page.goto('/order/invalid-venue/a1');
    
    // Should show error message
    await expect(page.locator('.error-container')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Oops!');
    
    // Try again button should be present
    await expect(page.locator('button')).toContainText('Try Again');
  });

  test('should have proper accessibility features', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check button has proper accessibility attributes
    const button = page.locator('.continue-button');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    
    // Check for keyboard navigation
    await button.focus();
    const focusedElement = await page.evaluate(() => document.activeElement?.className);
    expect(focusedElement).toContain('continue-button');
  });

  test('should work on different mobile devices', async ({ page }) => {
    const devices = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone XR' },
      { width: 360, height: 640, name: 'Galaxy S5' }
    ];

    for (const device of devices) {
      await page.setViewportSize({ width: device.width, height: device.height });
      
      // Check that all elements are visible and properly positioned
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.table-info')).toBeVisible();
      await expect(page.locator('.continue-button')).toBeVisible();
      
      // Check that button is touchable
      const button = page.locator('.continue-button');
      const buttonBox = await button.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should prefetch menu page for better performance', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check that prefetch link is present for menu page
    const prefetchLink = page.locator('link[rel="prefetch"]');
    await expect(prefetchLink).toBeVisible();
    
    // Verify prefetch URL points to menu
    const href = await prefetchLink.getAttribute('href');
    expect(href).toMatch(/\/menu\//);
  });
});