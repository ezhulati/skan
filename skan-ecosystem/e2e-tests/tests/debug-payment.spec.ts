import { test, expect } from '@playwright/test';

test.describe('Debug Payment Integration', () => {
  test('debug cart page and payment methods', async ({ page }) => {
    console.log('🔍 Starting debug test...');
    
    // Navigate directly to cart
    await page.goto('http://localhost:3000/beach-bar-durres/a1/cart');
    console.log('📍 Navigated to cart page');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('⏳ Page loaded');
    
    // Check if we're on cart page or redirected
    const currentUrl = page.url();
    console.log(`🌐 Current URL: ${currentUrl}`);
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for any visible text on page
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 Page body contains: ${bodyText?.substring(0, 200)}...`);
    
    // Look for cart-specific elements
    const cartTitle = page.locator('h1').filter({ hasText: /cart|shporta/i });
    if (await cartTitle.count() > 0) {
      console.log('✅ Found cart title');
    } else {
      console.log('❌ No cart title found');
    }
    
    // Check for empty cart message
    const emptyCart = page.locator('text=cart_empty').or(page.locator('text=Shporta është e zbrazët'));
    if (await emptyCart.count() > 0) {
      console.log('📭 Cart is empty');
    } else {
      console.log('📦 Cart has items or empty check failed');
    }
    
    // Try to add items first by going to menu
    console.log('🍽️ Going to menu to add items...');
    await page.goto('http://localhost:3000/beach-bar-durres/a1/menu');
    await page.waitForLoadState('networkidle');
    
    // Look for add to cart buttons
    const addButtons = page.locator('button').filter({ hasText: /add|shto/i });
    const buttonCount = await addButtons.count();
    console.log(`🛒 Found ${buttonCount} add buttons`);
    
    if (buttonCount > 0) {
      // Click first add button
      await addButtons.first().click();
      console.log('✅ Clicked first add button');
      
      // Wait a bit for cart to update
      await page.waitForTimeout(1000);
      
      // Now go back to cart
      await page.goto('http://localhost:3000/beach-bar-durres/a1/cart');
      await page.waitForLoadState('networkidle');
      console.log('🔄 Returned to cart');
      
      // Look for payment method selector
      const paymentSection = page.locator('[data-testid="payment-method-selector"]');
      if (await paymentSection.count() > 0) {
        console.log('✅ Found payment method selector');
      } else {
        console.log('❌ Payment method selector not found');
        
        // Check for any payment-related text
        const paymentText = page.locator('text=payment').or(page.locator('text=pagesa'));
        const paymentCount = await paymentText.count();
        console.log(`💳 Found ${paymentCount} payment-related elements`);
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-cart-with-items.png', fullPage: true });
      console.log('📸 Screenshot saved: debug-cart-with-items.png');
    }
  });
});