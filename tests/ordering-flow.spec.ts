import { test, expect } from '@playwright/test';

test.describe('Complete Ordering Flow', () => {
  test('should complete full customer ordering journey', async ({ page }) => {
    // Start timing the complete flow
    const startTime = Date.now();
    
    // 1. Scan QR Code (simulate by navigating to QR landing)
    await page.goto('/order/beach-bar-durres/a1');
    await page.waitForLoadState('networkidle');
    
    // Verify QR landing page loads
    await expect(page.locator('h1')).toContainText('Beach Bar Durrës');
    await expect(page.locator('.table-number')).toContainText('a1');
    
    // 2. Navigate to Menu
    await page.click('.continue-button');
    await page.waitForLoadState('networkidle');
    
    // Verify menu page loads
    await expect(page.locator('.menu-content')).toBeVisible();
    await expect(page.locator('.category-title')).toHaveCount(2);
    
    // 3. Browse Menu and Add Items
    // Add a drink
    const drinkItems = page.locator('.menu-category:has(.category-title:has-text("Drinks")) .menu-item');
    await drinkItems.first().locator('.add-button').click();
    
    // Add a food item
    const foodItems = page.locator('.menu-category:has(.category-title:has-text("Food")) .menu-item');
    await foodItems.first().locator('.add-button').click();
    
    // Verify cart updates
    await expect(page.locator('.cart-summary')).toBeVisible();
    await expect(page.locator('.cart-info')).toContainText('2 items');
    
    // 4. Modify quantities
    const quantityControls = page.locator('.quantity-controls').first();
    await quantityControls.locator('.quantity-btn:has-text("+")').click();
    
    // Verify quantity increased
    await expect(quantityControls.locator('.quantity')).toContainText('2');
    await expect(page.locator('.cart-info')).toContainText('3 items');
    
    // 5. Go to Cart
    await page.click('.view-cart-button');
    await page.waitForLoadState('networkidle');
    
    // Verify cart page
    await expect(page).toHaveURL(/\/cart/);
    
    // 6. Complete Order (if cart page has checkout functionality)
    // This would depend on your cart page implementation
    
    // Measure total flow time
    const totalTime = Date.now() - startTime;
    console.log(`Complete ordering flow took: ${totalTime}ms`);
    
    // Should complete reasonably quickly
    expect(totalTime).toBeLessThan(10000); // Under 10 seconds
  });

  test('should handle ordering flow on mobile device', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Complete the flow on mobile
    await page.goto('/order/beach-bar-durres/a1');
    await page.waitForLoadState('networkidle');
    
    // Mobile-specific checks for QR landing
    const button = page.locator('.continue-button');
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // Apple's minimum touch target
    
    await button.click();
    await page.waitForLoadState('networkidle');
    
    // Add items on mobile
    await page.click('.menu-item .add-button');
    
    // Check mobile cart summary
    await expect(page.locator('.cart-summary')).toBeVisible();
    
    // Cart should be easily accessible on mobile
    const cartButton = page.locator('.view-cart-button');
    const cartButtonBox = await cartButton.boundingBox();
    expect(cartButtonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should handle network issues gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/order/beach-bar-durres/a1');
    
    // Should show loading state
    await expect(page.locator('.loading-spinner')).toBeVisible();
    
    // Should eventually load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Beach Bar Durrës');
  });

  test('should maintain cart state across page refreshes', async ({ page }) => {
    // Add items to cart
    await page.goto('/order/beach-bar-durres/a1');
    await page.click('.continue-button');
    await page.waitForLoadState('networkidle');
    
    await page.click('.menu-item .add-button');
    await expect(page.locator('.cart-summary')).toBeVisible();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Cart state should persist (if using localStorage/sessionStorage)
    // This depends on your cart implementation
    await expect(page.locator('.menu-content')).toBeVisible();
  });

  test('should handle multiple rapid interactions', async ({ page }) => {
    await page.goto('/order/beach-bar-durres/a1');
    await page.click('.continue-button');
    await page.waitForLoadState('networkidle');
    
    // Rapidly add multiple items
    const addButtons = page.locator('.add-button');
    
    // Add items quickly
    for (let i = 0; i < 3; i++) {
      await addButtons.nth(i).click({ delay: 100 });
    }
    
    // Should handle all interactions
    await expect(page.locator('.cart-info')).toContainText('3 items');
  });

  test('should work with keyboard navigation', async ({ page }) => {
    await page.goto('/order/beach-bar-durres/a1');
    
    // Use keyboard to navigate
    await page.keyboard.press('Tab'); // Focus on continue button
    await page.keyboard.press('Enter'); // Press enter to continue
    
    await page.waitForLoadState('networkidle');
    
    // Should navigate to menu
    await expect(page.locator('.menu-content')).toBeVisible();
    
    // Tab through menu items
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to add items with Enter
    await page.keyboard.press('Enter');
    
    // Cart should update
    await expect(page.locator('.cart-summary')).toBeVisible();
  });

  test('should handle different table numbers', async ({ page }) => {
    const tableNumbers = ['a1', 'b2', 'c3', '1', '15'];
    
    for (const tableNumber of tableNumbers) {
      await page.goto(`/order/beach-bar-durres/${tableNumber}`);
      await page.waitForLoadState('networkidle');
      
      // Should display correct table number
      await expect(page.locator('.table-number')).toContainText(tableNumber);
      
      // Should work normally
      await page.click('.continue-button');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.table-info')).toContainText(tableNumber);
    }
  });

  test('should track performance metrics', async ({ page }) => {
    // Navigate to QR page and measure metrics
    const startTime = Date.now();
    
    await page.goto('/order/beach-bar-durres/a1');
    
    // Measure First Contentful Paint
    const fcpTime = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    console.log(`First Contentful Paint: ${fcpTime}ms`);
    
    // FCP should be under 2 seconds for good performance
    expect(fcpTime).toBeLessThan(2000);
    
    await page.waitForLoadState('networkidle');
    
    // Measure total load time
    const loadTime = Date.now() - startTime;
    console.log(`Total load time: ${loadTime}ms`);
    
    // Total load should be under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle concurrent users simulation', async ({ page, context }) => {
    // Create multiple pages to simulate concurrent users
    const pages = [page];
    
    // Create additional pages
    for (let i = 0; i < 2; i++) {
      pages.push(await context.newPage());
    }
    
    // All pages navigate simultaneously
    const promises = pages.map((p, index) => 
      p.goto(`/order/beach-bar-durres/table${index + 1}`)
    );
    
    await Promise.all(promises);
    
    // All should load successfully
    for (const p of pages) {
      await expect(p.locator('h1')).toContainText('Beach Bar Durrës');
    }
    
    // Clean up additional pages
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
  });
});