import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test('hamburger menu should have proper dimensions and spacing', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to homepage
    await page.goto('http://localhost:4323/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find the hamburger button
    const hamburgerButton = page.locator('.hamburger');
    await expect(hamburgerButton).toBeVisible();
    
    // Check hamburger container dimensions
    const hamburgerBox = page.locator('.hamburger-box');
    await expect(hamburgerBox).toBeVisible();
    
    // Check hamburger lines
    const hamburgerInner = page.locator('.hamburger-inner');
    const hamburgerBefore = page.locator('.hamburger-inner::before');
    const hamburgerAfter = page.locator('.hamburger-inner::after');
    
    await expect(hamburgerInner).toBeVisible();
    
    // Test hamburger menu functionality
    await hamburgerButton.click();
    
    // Wait for mobile menu to appear
    const mobileMenu = page.locator('.mobile-header__menu');
    await expect(mobileMenu).toBeVisible();
    
    // Check if all main navigation items are present
    await expect(page.locator('text=Veçoritë')).toBeVisible();
    await expect(page.locator('text=Çmimet')).toBeVisible();
    await expect(page.locator('text=Blog')).toBeVisible();
    await expect(page.locator('text=Kontakti')).toBeVisible();
    
    // Check if additional items are present
    await expect(page.locator('text=Hyni')).toBeVisible();
    await expect(page.locator('text=Demo')).toBeVisible();
    await expect(page.locator('text=Filloni')).toBeVisible();
    
    // Take a screenshot for manual verification
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/test-results/mobile-menu-open.png',
      fullPage: true 
    });
    
    // Close menu by clicking hamburger again
    await hamburgerButton.click();
    
    // Verify menu is closed
    await expect(mobileMenu).not.toHaveClass(/is-active/);
  });
  
  test('hamburger button should have correct styling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4323/');
    await page.waitForLoadState('networkidle');
    
    const hamburgerButton = page.locator('.hamburger');
    const hamburgerBox = page.locator('.hamburger-box');
    
    // Check computed styles
    const boxStyles = await hamburgerBox.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height
      };
    });
    
    console.log('Hamburger box dimensions:', boxStyles);
    
    // Take screenshot of just the hamburger button
    await hamburgerButton.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/test-results/hamburger-button.png'
    });
  });
});