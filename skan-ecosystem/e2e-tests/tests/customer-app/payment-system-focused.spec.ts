import { test, expect } from '@playwright/test';
import { URLs } from '../../test-data/constants';

test.describe('Payment System - Focused Tests', () => {

  test('should display PaymentMethodSelector when items are in cart', async ({ page }) => {
    // Navigate directly to cart with a real venue
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
    await page.waitForLoadState('networkidle');
    
    // Look for menu items and add one to cart
    const menuItemCards = page.locator('.menu-item, [data-menu-item], .bg-white');
    await page.waitForTimeout(2000); // Wait for menu to load
    
    if (await menuItemCards.count() > 0) {
      const firstItem = menuItemCards.first();
      const addButton = firstItem.locator('button:has-text("Add"), button:has-text("Shto"), [data-testid="add-to-cart"]');
      if (await addButton.count() > 0) {
        await addButton.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Navigate to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if cart is empty and display appropriate message
    const cartEmptyMessage = page.locator('text=Your cart is empty').or(page.locator('text=Shporta është bosh'));
    const isCartEmpty = await cartEmptyMessage.isVisible();
    
    if (isCartEmpty) {
      console.log('Cart is empty - payment method selector should not be visible');
      // Verify payment method section is not shown for empty cart
      const paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Mënyra e Pagesës'));
      await expect(paymentMethodSection).not.toBeVisible();
      return;
    }
    
    // If cart has items, verify payment method selector is visible
    console.log('Cart has items - checking for payment method selector');
    
    // Wait for payment section to load
    await page.waitForTimeout(1000);
    
    // Look for payment method section with more flexible selectors
    const paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Mënyra e Pagesës'));
    const cashOption = page.locator('label:has(input[value="cash"])');
    const cashText = page.locator('text=Pay with Cash').or(page.locator('text=Paguaj me Para'));
    
    try {
      await expect(paymentMethodSection).toBeVisible({ timeout: 5000 });
      console.log('✓ Payment method section found');
    } catch (error) {
      console.log('✗ Payment method section not found, checking for cash option directly');
      await expect(cashOption).toBeVisible({ timeout: 5000 });
      console.log('✓ Cash option found');
    }
    
    // Verify cash payment option is always available
    await expect(cashOption).toBeVisible();
    console.log('✓ Cash payment option is visible');
  });

  test('should show cash and card options based on venue settings', async ({ page }) => {
    // Mock venue with Stripe enabled
    await page.route('**/api/venue/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          venue: {
            id: 'beach-bar-durres',
            name: 'Beach Bar Durrës',
            settings: { stripeConnectEnabled: true }
          },
          categories: [
            {
              id: 'drinks',
              name: 'Drinks',
              items: [
                {
                  id: 'beer',
                  name: 'Albanian Beer',
                  price: 3.50,
                  description: 'Local beer'
                }
              ]
            }
          ]
        })
      });
    });
    
    // Add item to cart first
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
    await page.waitForLoadState('networkidle');
    
    // Find and click add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Shto")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
    
    // Go to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for payment options
    const cashOption = page.locator('label:has(input[value="cash"])');
    const cardOption = page.locator('label:has(input[value="stripe"])');
    
    // Cash should always be available
    await expect(cashOption).toBeVisible({ timeout: 10000 });
    
    // Card should be available when Stripe is enabled
    await expect(cardOption).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Both cash and card options are visible');
  });

  test('should allow switching between payment methods', async ({ page }) => {
    // Mock venue with Stripe enabled
    await page.route('**/api/venue/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          venue: {
            id: 'beach-bar-durres',
            name: 'Beach Bar Durrës',
            settings: { stripeConnectEnabled: true }
          },
          categories: [
            {
              id: 'drinks',
              name: 'Drinks',
              items: [
                {
                  id: 'beer',
                  name: 'Albanian Beer',
                  price: 3.50,
                  description: 'Local beer'
                }
              ]
            }
          ]
        })
      });
    });
    
    // Add item to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("Shto")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
    
    // Go to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify default selection (should be cash)
    const cashRadio = page.locator('input[value="cash"]');
    const cardRadio = page.locator('input[value="stripe"]');
    
    await expect(cashRadio).toBeChecked();
    console.log('✓ Cash is selected by default');
    
    // Click on card option
    const cardOption = page.locator('label:has(input[value="stripe"])');
    await cardOption.click();
    await page.waitForTimeout(500);
    
    // Verify card is now selected
    await expect(cardRadio).toBeChecked();
    await expect(cashRadio).not.toBeChecked();
    console.log('✓ Card selection works');
    
    // Switch back to cash
    const cashOption = page.locator('label:has(input[value="cash"])');
    await cashOption.click();
    await page.waitForTimeout(500);
    
    // Verify cash is selected again
    await expect(cashRadio).toBeChecked();
    await expect(cardRadio).not.toBeChecked();
    console.log('✓ Switching back to cash works');
  });

  test('should show correct submit button text for payment methods', async ({ page }) => {
    // Mock venue with Stripe enabled
    await page.route('**/api/venue/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          venue: {
            id: 'beach-bar-durres',
            name: 'Beach Bar Durrës',
            settings: { stripeConnectEnabled: true }
          },
          categories: [
            {
              id: 'drinks',
              name: 'Drinks',
              items: [
                {
                  id: 'beer',
                  name: 'Albanian Beer',
                  price: 3.50,
                  description: 'Local beer'
                }
              ]
            }
          ]
        })
      });
    });
    
    // Add item to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("Shto")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
    
    // Go to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // With cash selected (default), should show "Submit Order"
    const submitButton = page.locator('button[type="button"]:has-text("Submit"), button[type="button"]:has-text("Dërgo")').last();
    
    // Check initial button text
    let buttonText = await submitButton.textContent();
    console.log('Initial button text:', buttonText);
    
    // Select card payment
    const cardOption = page.locator('label:has(input[value="stripe"])');
    await cardOption.click();
    await page.waitForTimeout(500);
    
    // Button should now show "Proceed to Payment"
    buttonText = await submitButton.textContent();
    console.log('Button text after selecting card:', buttonText);
    
    // Should contain "Proceed" or "Payment" or "Vazhdo"
    const proceedToPaymentButton = page.locator('button:has-text("Proceed"), button:has-text("Payment"), button:has-text("Vazhdo")');
    await expect(proceedToPaymentButton).toBeVisible();
    console.log('✓ Button text changes for card payment');
  });

  test('should handle empty cart scenario', async ({ page }) => {
    // Go directly to cart without adding items
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should show empty cart message
    const emptyCartMessage = page.locator('text=Your cart is empty').or(page.locator('text=Shporta është bosh'));
    await expect(emptyCartMessage).toBeVisible();
    console.log('✓ Empty cart message is shown');
    
    // Payment method section should not be visible
    const paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Mënyra e Pagesës'));
    await expect(paymentMethodSection).not.toBeVisible();
    console.log('✓ Payment method section is hidden for empty cart');
    
    // Should have a button to return to menu
    const backToMenuButton = page.locator('button:has-text("Menu"), button:has-text("Meny")');
    await expect(backToMenuButton).toBeVisible();
    console.log('✓ Back to menu button is available');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mock venue with items
    await page.route('**/api/venue/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          venue: {
            id: 'beach-bar-durres',
            name: 'Beach Bar Durrës',
            settings: { stripeConnectEnabled: true }
          },
          categories: [
            {
              id: 'drinks',
              name: 'Drinks',
              items: [
                {
                  id: 'beer',
                  name: 'Albanian Beer',
                  price: 3.50,
                  description: 'Local beer'
                }
              ]
            }
          ]
        })
      });
    });
    
    // Add item to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("Shto")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
    
    // Go to cart
    await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify payment options are visible and properly sized on mobile
    const cashOption = page.locator('label:has(input[value="cash"])');
    const cardOption = page.locator('label:has(input[value="stripe"])');
    
    await expect(cashOption).toBeVisible();
    await expect(cardOption).toBeVisible();
    
    // Check touch target sizes (should be at least 44px)
    const cashBox = await cashOption.boundingBox();
    const cardBox = await cardOption.boundingBox();
    
    expect(cashBox!.height).toBeGreaterThanOrEqual(44);
    expect(cardBox!.height).toBeGreaterThanOrEqual(44);
    
    console.log('✓ Payment options work properly on mobile');
  });

});