import { test, expect } from '@playwright/test';

test.describe('Skan.al Restaurant App', () => {
  test('should load QR landing page and navigate to menu', async ({ page }) => {
    // Navigate to QR landing page
    await page.goto('/order/beach-bar-durres/a1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that venue information is displayed
    await expect(page.locator('h1')).toContainText('Beach Bar Durrës');
    await expect(page.locator('.table-number')).toContainText('a1');
    
    // Click continue to menu
    await page.click('.continue-button');
    await page.waitForLoadState('networkidle');
    
    // Should be on menu page
    await expect(page).toHaveURL(/\/menu\//);
    await expect(page.locator('.menu-content')).toBeVisible();
  });

  test('should add items to cart and display cart summary', async ({ page }) => {
    // Start from QR page
    await page.goto('/order/beach-bar-durres/a1');
    await page.click('.continue-button');
    await page.waitForLoadState('networkidle');
    
    // Add first item to cart
    await page.click('.menu-item .add-button');
    
    // Cart summary should appear
    await expect(page.locator('.cart-summary')).toBeVisible();
    await expect(page.locator('.cart-info')).toContainText('1 item');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to app
    await page.goto('/order/beach-bar-durres/a1');
    await page.waitForLoadState('networkidle');
    
    // Check mobile optimization
    const button = page.locator('.continue-button');
    await expect(button).toBeVisible();
    
    // Button should be large enough for touch
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should handle performance requirements', async ({ page }) => {
    const startTime = Date.now();
    
    // Load QR page
    await page.goto('/order/beach-bar-durres/a1');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.continue-button')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with invalid venue
    await page.goto('/order/invalid-venue/a1');
    
    // Should show error
    await expect(page.locator('.error-container')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Oops!');
  });
});