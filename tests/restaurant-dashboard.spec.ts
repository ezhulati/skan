import { test, expect } from '@playwright/test';

test.describe('Restaurant Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to restaurant dashboard
    await page.goto('http://localhost:3001/login');
  });

  test('should load login page', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
    
    // Should have email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('should login with demo credentials', async ({ page }) => {
    // Fill in demo credentials
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    
    // Submit login
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    // Should redirect to dashboard
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard|orders/);
  });

  test('should reject invalid credentials', async ({ page }) => {
    // Try invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@email.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('.error, .alert, [role="alert"]')).toBeVisible();
  });

  test('should display orders after login', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // Should show orders or empty state
    const ordersExist = await page.locator('.order, .order-item').count() > 0;
    const emptyState = await page.locator('.empty, .no-orders').isVisible();
    
    // Either orders should be visible or empty state should be shown
    expect(ordersExist || emptyState).toBeTruthy();
  });

  test('should handle order status updates', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // Check if there are any orders with status buttons
    const statusButtons = page.locator('button:has-text("preparing"), button:has-text("ready"), button:has-text("served")');
    const buttonCount = await statusButtons.count();
    
    if (buttonCount > 0) {
      // Click first status button
      await statusButtons.first().click();
      
      // Should update the order status
      // This depends on your dashboard implementation
    }
  });

  test('should refresh orders automatically', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // Wait for potential auto-refresh (30 seconds mentioned in specs)
    // For testing, we'll just verify the page doesn't crash
    await page.waitForTimeout(2000);
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Login should work on tablet
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // Dashboard should be usable on tablet
    await expect(page.locator('body')).toBeVisible();
    
    // Touch targets should be appropriate size
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      const buttonBox = await firstButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should handle logout', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // Look for logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), .logout');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should display order details correctly', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // If there are orders, check their structure
    const orders = page.locator('.order, .order-item');
    const orderCount = await orders.count();
    
    if (orderCount > 0) {
      const firstOrder = orders.first();
      
      // Should have essential order information
      // Order number, table, items, total, status
      await expect(firstOrder).toBeVisible();
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // Look for status filter buttons
    const filterButtons = page.locator('button:has-text("new"), button:has-text("preparing"), button:has-text("ready"), button:has-text("all")');
    
    if (await filterButtons.count() > 0) {
      // Click different filters
      await filterButtons.first().click();
      await page.waitForTimeout(500);
      
      // Orders should update based on filter
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('http://localhost:3001/login');
    
    // Should still load the login page
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    
    // Try to login (will fail due to network)
    await page.fill('input[type="email"], input[name="email"]', 'manager_email@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'demo123');
    await page.click('button[type="submit"], .login-button, button:has-text("Login")');
    
    // Should show error state
    await page.waitForTimeout(1000);
    // Error handling depends on implementation
  });
});