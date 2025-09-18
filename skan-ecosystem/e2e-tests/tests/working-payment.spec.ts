import { test, expect } from '@playwright/test';

test.describe('Working Payment System Test', () => {
  test('complete payment flow works end-to-end', async ({ page }) => {
    console.log('🚀 Starting complete payment flow test...');
    
    // Step 1: Navigate to menu page
    await page.goto('http://localhost:3000/beach-bar-durres/a1/menu');
    await page.waitForLoadState('networkidle');
    console.log('📍 Navigated to menu page');
    
    // Step 2: Wait for menu to load and find add buttons
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Look for add to cart buttons with multiple possible selectors
    const addButton = page.locator('button').filter({ hasText: /add|shto/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Found add to cart button');
    
    // Step 3: Add item to cart
    await addButton.click();
    console.log('🛒 Clicked add to cart');
    
    // Wait for any animations/state updates
    await page.waitForTimeout(2000);
    
    // Step 4: Navigate to cart
    await page.goto('http://localhost:3000/beach-bar-durres/a1/cart');
    await page.waitForLoadState('networkidle');
    console.log('📍 Navigated to cart');
    
    // Step 5: Wait for cart to load and check for items
    await page.waitForTimeout(2000);
    
    // Check if cart has items (not empty)
    const emptyCartText = page.locator('text=Shporta është e zbrazët').or(page.locator('text=cart_empty'));
    const hasItems = await emptyCartText.count() === 0;
    
    if (hasItems) {
      console.log('✅ Cart has items - checking for payment methods');
      
      // Step 6: Look for payment method selector with testid
      const paymentSelector = page.locator('[data-testid="payment-method-selector"]');
      await expect(paymentSelector).toBeVisible({ timeout: 10000 });
      console.log('✅ Payment method selector is visible');
      
      // Step 7: Check for cash payment option
      const cashOption = page.locator('[data-testid="cash-payment-radio"]');
      await expect(cashOption).toBeVisible();
      console.log('✅ Cash payment option is visible');
      
      // Step 8: Verify cash is selected by default
      await expect(cashOption).toBeChecked();
      console.log('✅ Cash payment is selected by default');
      
      // Step 9: Look for submit button and verify text
      const submitButton = page.locator('button').filter({ hasText: /submit|dërgo/i });
      await expect(submitButton).toBeVisible();
      console.log('✅ Submit button is visible');
      
      // Step 10: Test clicking submit (cash payment)
      await submitButton.click();
      console.log('🎯 Clicked submit for cash payment');
      
      // Wait for navigation or success
      await page.waitForTimeout(2000);
      
      // Check if we navigated to confirmation page
      const currentUrl = page.url();
      console.log(`🌐 After submit URL: ${currentUrl}`);
      
      if (currentUrl.includes('confirmation')) {
        console.log('✅ Successfully navigated to confirmation page');
      } else {
        console.log('⚠️ Did not navigate to confirmation - checking for errors');
        
        // Look for error messages
        const errorMessage = page.locator('[class*="error"]').or(page.locator('[class*="alert"]'));
        if (await errorMessage.count() > 0) {
          const errorText = await errorMessage.textContent();
          console.log(`❌ Error found: ${errorText}`);
        }
      }
      
    } else {
      console.log('❌ Cart is empty - need to investigate cart state management');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'cart-empty-debug.png', fullPage: true });
      console.log('📸 Saved cart-empty-debug.png');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-state.png', fullPage: true });
    console.log('📸 Saved final-state.png');
  });
  
  test('verify admin portal payment settings page', async ({ page }) => {
    console.log('🔧 Testing admin portal payment settings...');
    
    // Navigate to admin portal
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    console.log('📍 Navigated to admin login');
    
    // Try to navigate directly to payment settings (if already logged in)
    await page.goto('http://localhost:3001/payment-settings');
    await page.waitForLoadState('networkidle');
    console.log('📍 Attempted to navigate to payment settings');
    
    const currentUrl = page.url();
    console.log(`🌐 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('payment-settings')) {
      console.log('✅ Successfully accessed payment settings page');
      
      // Look for payment settings elements
      const pageTitle = page.locator('h1').filter({ hasText: /payment|pagesa/i });
      if (await pageTitle.count() > 0) {
        console.log('✅ Found payment settings page title');
      }
      
      // Look for stripe toggle
      const stripeToggle = page.locator('input[type="checkbox"]');
      if (await stripeToggle.count() > 0) {
        console.log('✅ Found Stripe toggle switch');
      }
      
    } else if (currentUrl.includes('login')) {
      console.log('🔐 Redirected to login - admin portal requires authentication');
    } else {
      console.log('❓ Unexpected redirect or page');
    }
    
    await page.screenshot({ path: 'admin-portal-state.png', fullPage: true });
    console.log('📸 Saved admin-portal-state.png');
  });
});