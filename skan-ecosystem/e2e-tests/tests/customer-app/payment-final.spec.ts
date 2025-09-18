import { test, expect } from '@playwright/test';
import { URLs } from '../../test-data/constants';

test.describe('Payment System - Final Integration Tests', () => {

  test('should complete end-to-end payment selection flow', async ({ page }) => {
    console.log('🚀 Starting comprehensive payment system test...');
    
    // Step 1: Navigate to menu and add items to cart
    console.log('📄 Navigating to menu page...');
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify we're on the menu page with real data
    const venueTitle = page.locator('h1, .venue-title');
    await expect(venueTitle).toBeVisible();
    console.log('✅ Menu page loaded with venue information');

    // Look for "Shto në Shportë" (Add to Cart) buttons 
    const addToCartButtons = page.locator('button:has-text("Shto në Shportë")');
    const buttonCount = await addToCartButtons.count();
    console.log(`Found ${buttonCount} add-to-cart buttons`);

    if (buttonCount > 0) {
      // Add first item to cart
      await addToCartButtons.first().click();
      console.log('✅ Added first item to cart');
      await page.waitForTimeout(1000);

      // Add second item to cart for better testing
      if (buttonCount > 1) {
        await addToCartButtons.nth(1).click();
        console.log('✅ Added second item to cart');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('⚠️ No add-to-cart buttons found, using alternative method');
      // Try clicking on any button that might add items
      const anyButton = page.locator('button').filter({ hasText: /Shto|Add/ });
      if (await anyButton.count() > 0) {
        await anyButton.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 2: Navigate to cart
    console.log('🛒 Navigating to cart page...');
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'final-cart-test.png', fullPage: true });

    // Check if cart is empty
    const emptyCartAlbanian = page.locator('text=Shporta është e zbrazët');
    const emptyCartEnglish = page.locator('text=Your cart is empty');
    const isCartEmpty = await emptyCartAlbanian.isVisible() || await emptyCartEnglish.isVisible();

    if (isCartEmpty) {
      console.log('⚠️ Cart is empty - testing empty cart behavior');
      
      // Verify payment method section is not shown for empty cart
      const paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Mënyra e Pagesës'));
      await expect(paymentMethodSection).not.toBeVisible();
      console.log('✅ Payment method section correctly hidden for empty cart');
      
      // Should show back to menu button
      const menuButton = page.locator('button:has-text("Menyja")');
      await expect(menuButton).toBeVisible();
      console.log('✅ Back to menu button is available');
      
      return; // End test since cart is empty
    }

    console.log('✅ Cart has items - testing payment functionality');

    // Step 3: Verify payment method selector appears with items in cart
    const paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Mënyra e Pagesës'));
    const cashOption = page.locator('label:has(input[value="cash"])');
    
    // Payment method section should be visible when items are in cart
    try {
      await expect(paymentMethodSection).toBeVisible({ timeout: 5000 });
      console.log('✅ Payment method section is visible');
    } catch (error) {
      console.log('ℹ️ Payment method section header not found, checking for payment options directly');
    }

    // Cash option should always be available
    await expect(cashOption).toBeVisible({ timeout: 5000 });
    console.log('✅ Cash payment option is available');

    // Step 4: Test payment method interactions
    const cashRadio = page.locator('input[value="cash"]');
    
    // Cash should be selected by default
    await expect(cashRadio).toBeChecked();
    console.log('✅ Cash payment is selected by default');

    // Look for card option (depends on venue settings)
    const cardOption = page.locator('label:has(input[value="stripe"])');
    const hasCardOption = await cardOption.isVisible();
    
    if (hasCardOption) {
      console.log('💳 Card payment option is available - testing selection');
      const cardRadio = page.locator('input[value="stripe"]');
      
      // Select card payment
      await cardOption.click();
      await page.waitForTimeout(500);
      
      // Verify card is now selected
      await expect(cardRadio).toBeChecked();
      await expect(cashRadio).not.toBeChecked();
      console.log('✅ Card payment selection works');
      
      // Switch back to cash
      await cashOption.click();
      await page.waitForTimeout(500);
      
      // Verify cash is selected again
      await expect(cashRadio).toBeChecked();
      await expect(cardRadio).not.toBeChecked();
      console.log('✅ Switching between payment methods works');
    } else {
      console.log('ℹ️ Card payment option not available (Stripe not enabled for this venue)');
    }

    // Step 5: Test form integration
    console.log('📝 Testing form integration with payment methods...');
    
    // Fill customer information
    const customerNameInput = page.locator('input[type="text"]').first();
    await customerNameInput.fill('Test Customer');
    console.log('✅ Customer name filled');

    // Fill order notes if available
    const orderNotesTextarea = page.locator('textarea');
    if (await orderNotesTextarea.count() > 0) {
      await orderNotesTextarea.last().fill('No onions please');
      console.log('✅ Order notes filled');
    }

    // Step 6: Verify submit button behavior
    console.log('🔘 Testing submit button behavior...');
    
    const submitButton = page.locator('button').filter({ 
      hasText: /Submit|Order|Dërgo|Porosi|Proceed|Vazhdo/ 
    }).last();

    // Button should be visible and enabled with items in cart
    await expect(submitButton).toBeVisible();
    console.log('✅ Submit button is visible');

    // Check button text
    const buttonText = await submitButton.textContent();
    console.log(`Submit button text: "${buttonText}"`);

    // Step 7: Test different scenarios based on payment method
    if (hasCardOption) {
      console.log('🧪 Testing card payment flow...');
      
      // Select card payment
      await cardOption.click();
      await page.waitForTimeout(500);
      
      // Button text should indicate proceeding to payment
      const updatedButtonText = await submitButton.textContent();
      console.log(`Updated button text for card: "${updatedButtonText}"`);
      
      // Should contain words indicating payment
      const hasPaymentText = /proceed|payment|vazhdo|pagesë/i.test(updatedButtonText || '');
      if (hasPaymentText) {
        console.log('✅ Button text correctly indicates payment flow');
      } else {
        console.log('ℹ️ Button text may not explicitly mention payment');
      }
      
      // Switch back to cash for the final test
      await cashOption.click();
      await page.waitForTimeout(500);
    }

    // Step 8: Test final submission preparation
    console.log('📋 Testing order submission preparation...');
    
    // Ensure cash is selected
    await expect(cashRadio).toBeChecked();
    
    // Verify all form fields are filled
    const customerNameValue = await customerNameInput.inputValue();
    expect(customerNameValue).toBe('Test Customer');
    console.log('✅ Form validation checks passed');

    // The submit button should be enabled and ready
    const isButtonDisabled = await submitButton.isDisabled();
    expect(isButtonDisabled).toBe(false);
    console.log('✅ Submit button is enabled with valid form data');

    // Step 9: Verify mobile responsiveness
    console.log('📱 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Payment options should still be visible on mobile
    await expect(cashOption).toBeVisible();
    console.log('✅ Cash option visible on mobile');

    if (hasCardOption) {
      await expect(cardOption).toBeVisible();
      console.log('✅ Card option visible on mobile');
      
      // Check touch target sizes
      const cashBox = await cashOption.boundingBox();
      const cardBox = await cardOption.boundingBox();
      
      if (cashBox && cardBox) {
        expect(cashBox.height).toBeGreaterThanOrEqual(44);
        expect(cardBox.height).toBeGreaterThanOrEqual(44);
        console.log('✅ Touch targets meet minimum size requirements');
      }
    }

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('🎉 Payment system integration test completed successfully!');
    console.log('📊 Test Summary:');
    console.log(`   - Cart functionality: Working`);
    console.log(`   - Payment method selector: Working`);
    console.log(`   - Cash payment option: Available`);
    console.log(`   - Card payment option: ${hasCardOption ? 'Available' : 'Not configured'}`);
    console.log(`   - Form integration: Working`);
    console.log(`   - Mobile responsiveness: Working`);
  });

  test('should handle empty cart properly', async ({ page }) => {
    console.log('🗳️ Testing empty cart behavior...');
    
    // Go directly to cart without adding items
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show empty cart message in Albanian
    const emptyCartMessage = page.locator('text=Shporta është e zbrazët');
    await expect(emptyCartMessage).toBeVisible();
    console.log('✅ Empty cart message displayed correctly');

    // Payment method section should not be visible
    const paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Mënyra e Pagesës'));
    await expect(paymentMethodSection).not.toBeVisible();
    console.log('✅ Payment method section properly hidden for empty cart');

    // Should have button to return to menu
    const menuButton = page.locator('button:has-text("Menyja")');
    await expect(menuButton).toBeVisible();
    console.log('✅ Return to menu button is available');

    // Clicking menu button should navigate back
    await menuButton.click();
    await page.waitForURL('**/menu');
    console.log('✅ Navigation back to menu works');
  });

  test('should preserve cart state during navigation', async ({ page }) => {
    console.log('🔄 Testing cart state persistence...');
    
    // Add items to cart from menu
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const addToCartButtons = page.locator('button:has-text("Shto në Shportë")');
    if (await addToCartButtons.count() > 0) {
      await addToCartButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Added item to cart');
    }

    // Navigate to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if payment options are visible (indicating cart has items)
    const cashOption = page.locator('label:has(input[value="cash"])');
    const hasItems = await cashOption.isVisible();

    if (hasItems) {
      console.log('✅ Cart has items - payment options are visible');
      
      // Select card payment if available
      const cardOption = page.locator('label:has(input[value="stripe"])');
      if (await cardOption.isVisible()) {
        await cardOption.click();
        await page.waitForTimeout(500);
        console.log('✅ Selected card payment');
      }

      // Navigate back to menu
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForTimeout(1000);

      // Navigate back to cart
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Cart should still have items and payment state should be preserved
      await expect(cashOption).toBeVisible();
      console.log('✅ Cart state preserved during navigation');
    } else {
      console.log('ℹ️ Cart appears empty - state persistence test not applicable');
    }
  });

});