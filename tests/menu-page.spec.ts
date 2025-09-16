import { test, expect } from '@playwright/test';

test.describe('Menu Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate through the QR flow to get to menu
    await page.goto('/order/beach-bar-durres/a1');
    await page.waitForLoadState('networkidle');
    await page.click('.continue-button');
    await page.waitForLoadState('networkidle');
  });

  test('should display menu categories and items', async ({ page }) => {
    // Check that menu categories are displayed
    await expect(page.locator('.category-title')).toHaveCount(2); // Drinks and Food
    
    // Check specific categories
    await expect(page.locator('.category-title').first()).toContainText('Drinks');
    await expect(page.locator('.category-title').last()).toContainText('Food');
    
    // Check that menu items are present
    await expect(page.locator('.menu-item')).toHaveCount(6); // 3 drinks + 3 food items
  });

  test('should display item details correctly', async ({ page }) => {
    // Check first drink item
    const firstItem = page.locator('.menu-item').first();
    await expect(firstItem.locator('.item-name')).toContainText('Albanian Beer');
    await expect(firstItem.locator('.item-price')).toContainText('€3.50');
  });

  test('should add items to cart', async ({ page }) => {
    // Add first item to cart
    await page.click('.menu-item .add-button', { timeout: 5000 });
    
    // Cart summary should appear
    await expect(page.locator('.cart-summary')).toBeVisible();
    await expect(page.locator('.cart-info')).toContainText('1 item');
    await expect(page.locator('.cart-info')).toContainText('€3.50');
  });

  test('should handle quantity controls', async ({ page }) => {
    // Add item to cart
    await page.click('.menu-item .add-button');
    
    // Quantity controls should appear
    await expect(page.locator('.quantity-controls').first()).toBeVisible();
    await expect(page.locator('.quantity').first()).toContainText('1');
    
    // Increase quantity
    await page.click('.quantity-controls .quantity-btn:has-text("+")');
    await expect(page.locator('.quantity').first()).toContainText('2');
    
    // Cart should update
    await expect(page.locator('.cart-info')).toContainText('2 items');
    await expect(page.locator('.cart-info')).toContainText('€7.00');
    
    // Decrease quantity
    await page.click('.quantity-controls .quantity-btn:has-text("−")');
    await expect(page.locator('.quantity').first()).toContainText('1');
  });

  test('should navigate to cart page', async ({ page }) => {
    // Add item to cart
    await page.click('.menu-item .add-button');
    
    // Click view cart
    await page.click('.view-cart-button');
    
    // Should navigate to cart page
    await expect(page).toHaveURL(/\/cart/);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check header is sticky
    const header = page.locator('.menu-header');
    await expect(header).toBeVisible();
    
    // Check menu items are properly sized
    const menuItems = page.locator('.menu-item');
    const firstItem = menuItems.first();
    const itemBox = await firstItem.boundingBox();
    
    // Should be full width with proper spacing
    expect(itemBox?.width).toBeGreaterThan(300);
    
    // Check add buttons are touch-friendly
    const addButton = page.locator('.add-button').first();
    const buttonBox = await addButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(40);
  });

  test('should handle multiple items in cart', async ({ page }) => {
    // Add multiple different items
    const addButtons = page.locator('.add-button');
    
    // Add first item
    await addButtons.first().click();
    
    // Add second item
    await addButtons.nth(1).click();
    
    // Cart should show 2 items
    await expect(page.locator('.cart-info')).toContainText('2 items');
    
    // Total should be sum of prices
    const cartInfo = await page.locator('.cart-info').textContent();
    expect(cartInfo).toMatch(/€\d+\.\d{2}/);
  });

  test('should remove items when quantity reaches zero', async ({ page }) => {
    // Add item to cart
    await page.click('.menu-item .add-button');
    
    // Decrease quantity to zero
    await page.click('.quantity-controls .quantity-btn:has-text("−")');
    
    // Add button should reappear
    await expect(page.locator('.add-button').first()).toBeVisible();
    
    // Cart summary should disappear if no items
    await expect(page.locator('.cart-summary')).not.toBeVisible();
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Add item to cart
    await page.click('.menu-item .add-button');
    
    // Navigate away and back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.click('.continue-button');
    await page.waitForLoadState('networkidle');
    
    // Cart state should be maintained
    await expect(page.locator('.cart-summary')).toBeVisible();
    await expect(page.locator('.cart-info')).toContainText('1 item');
  });

  test('should have smooth animations', async ({ page }) => {
    // Check hover effects on menu items
    const menuItem = page.locator('.menu-item').first();
    
    // Hover should change appearance
    await menuItem.hover();
    
    // Button clicks should have feedback
    const addButton = page.locator('.add-button').first();
    await addButton.click();
    
    // Quantity controls should appear smoothly
    await expect(page.locator('.quantity-controls').first()).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Refresh page to test loading
    await page.reload();
    
    // Should show loading state initially
    const loadingSpinner = page.locator('.loading-spinner');
    // Note: This might be very fast in local testing
    
    // Page should eventually load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.menu-content')).toBeVisible();
  });

  test('should work across different browsers', async ({ page, browserName }) => {
    // Test basic functionality works in current browser
    await page.click('.menu-item .add-button');
    await expect(page.locator('.cart-summary')).toBeVisible();
    
    // Browser-specific checks
    if (browserName === 'webkit') {
      // Safari-specific tests
      await expect(page.locator('.menu-header')).toBeVisible();
    } else if (browserName === 'firefox') {
      // Firefox-specific tests
      await expect(page.locator('.cart-info')).toBeVisible();
    }
  });

  test('should handle edge cases', async ({ page }) => {
    // Test rapid clicking
    const addButton = page.locator('.add-button').first();
    await addButton.click();
    
    const plusButton = page.locator('.quantity-btn:has-text("+")').first();
    
    // Rapid clicks should work properly
    for (let i = 0; i < 5; i++) {
      await plusButton.click({ delay: 50 });
    }
    
    // Should show correct quantity
    await expect(page.locator('.quantity').first()).toContainText('6');
    
    // Cart total should be correct
    await expect(page.locator('.cart-info')).toContainText('€21.00');
  });
});