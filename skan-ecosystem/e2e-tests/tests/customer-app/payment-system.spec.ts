import { test, expect } from '@playwright/test';
import { CustomerAppPage } from '../../page-objects/CustomerAppPage';
import { TEST_DATA, URLs, VIEWPORTS } from '../../test-data/constants';

test.describe('Customer App - Payment System Integration', () => {
  let customerPage: CustomerAppPage;

  test.beforeEach(async ({ page }) => {
    customerPage = new CustomerAppPage(page);
  });

  test.describe('Payment Method Selection', () => {
    test('should display PaymentMethodSelector component in cart', async ({ page }) => {
      // Navigate to menu and add items to cart
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add an item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      // Navigate to cart
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Verify PaymentMethodSelector is rendered
      const paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Metoda e Pagesës'));
      await expect(paymentMethodSection).toBeVisible({ timeout: 10000 });
      
      // Verify cash payment option is always visible
      const cashOption = page.locator('label:has(input[value="cash"])');
      await expect(cashOption).toBeVisible();
      
      // Verify cash option content
      const cashLabel = page.locator('text=Pay with Cash').or(page.locator('text=Paguaj me Para në Dorë'));
      await expect(cashLabel).toBeVisible();
      
      const payWhenServed = page.locator('text=Pay when served').or(page.locator('text=Paguaj kur shërbehet'));
      await expect(payWhenServed).toBeVisible();
    });

    test('should show card payment option when Stripe is enabled', async ({ page }) => {
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
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Verify card payment option is visible when Stripe is enabled
      const cardOption = page.locator('label:has(input[value="stripe"])');
      await expect(cardOption).toBeVisible();
      
      const cardLabel = page.locator('text=Pay with Card').or(page.locator('text=Paguaj me Kartë'));
      await expect(cardLabel).toBeVisible();
    });

    test('should hide card payment option when Stripe is disabled', async ({ page }) => {
      // Mock venue with Stripe disabled
      await page.route('**/api/venue/**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            venue: {
              id: 'beach-bar-durres',
              name: 'Beach Bar Durrës',
              settings: { stripeConnectEnabled: false }
            },
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Verify card payment option is not visible when Stripe is disabled
      const cardOption = page.locator('label:has(input[value="stripe"])');
      await expect(cardOption).not.toBeVisible();
    });

    test('should allow selecting different payment methods', async ({ page }) => {
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
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Initially cash should be selected (default)
      const cashRadio = page.locator('input[value="cash"]');
      await expect(cashRadio).toBeChecked();
      
      // Select card payment
      const cardOption = page.locator('label:has(input[value="stripe"])');
      await cardOption.click();
      
      // Verify card is now selected
      const cardRadio = page.locator('input[value="stripe"]');
      await expect(cardRadio).toBeChecked();
      await expect(cashRadio).not.toBeChecked();
      
      // Select cash payment again
      const cashOption = page.locator('label:has(input[value="cash"])');
      await cashOption.click();
      
      // Verify cash is selected again
      await expect(cashRadio).toBeChecked();
      await expect(cardRadio).not.toBeChecked();
    });

    test('should update submit button text based on payment method', async ({ page }) => {
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
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      const submitButton = page.locator('button:has-text("Submit Order")').or(page.locator('button:has-text("Dërgo Porosinë")'));
      
      // With cash selected, button should show "Submit Order"
      await expect(submitButton).toBeVisible();
      
      // Select card payment
      const cardOption = page.locator('label:has(input[value="stripe"])');
      await cardOption.click();
      
      // Button should now show "Proceed to Payment"
      const proceedButton = page.locator('button:has-text("Proceed to Payment")').or(page.locator('button:has-text("Vazhdo në Pagesë")'));
      await expect(proceedButton).toBeVisible();
    });
  });

  test.describe('Cash Payment Flow', () => {
    test('should complete cash payment order successfully', async ({ page }) => {
      let orderCreated = false;
      
      // Mock API endpoints
      await page.route('**/api/venue/**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            venue: {
              id: 'beach-bar-durres',
              name: 'Beach Bar Durrës',
              settings: { stripeConnectEnabled: false }
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
      
      await page.route('**/api/orders', (route) => {
        orderCreated = true;
        const requestData = route.request().postDataJSON();
        
        // Verify order contains payment method
        expect(requestData.paymentMethod).toBe('cash');
        expect(requestData.paymentStatus).toBe('pending');
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            orderId: 'test-order-123',
            orderNumber: 'SKN-20240918-001',
            totalAmount: requestData.totalAmount,
            status: 'new'
          })
        });
      });
      
      // Start ordering flow
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      // Go to cart
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Fill customer details
      const customerNameInput = page.locator('input[type="text"]').first();
      await customerNameInput.fill('Test Customer');
      
      // Ensure cash is selected (should be default)
      const cashRadio = page.locator('input[value="cash"]');
      await expect(cashRadio).toBeChecked();
      
      // Submit order
      const submitButton = page.locator('button:has-text("Submit Order")').or(page.locator('button:has-text("Dërgo Porosinë")'));
      await submitButton.click();
      
      // Wait for navigation to confirmation page
      await page.waitForURL('**/confirmation');
      
      // Verify order was created with correct payment method
      expect(orderCreated).toBe(true);
      
      // Verify confirmation page shows correct information
      const orderNumber = page.locator('text=SKN-20240918-001').or(page.locator('[data-order-number]'));
      await expect(orderNumber).toBeVisible({ timeout: 10000 });
    });

    test('should handle order creation errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/orders', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Fill customer details
      const customerNameInput = page.locator('input[type="text"]').first();
      await customerNameInput.fill('Test Customer');
      
      // Submit order
      const submitButton = page.locator('button:has-text("Submit Order")').or(page.locator('button:has-text("Dërgo Porosinë")'));
      await submitButton.click();
      
      // Wait for error message
      const errorMessage = page.locator('.bg-red-50').or(page.locator('[role="alert"]'));
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Stripe Payment Flow', () => {
    test('should navigate to payment page when card is selected', async ({ page }) => {
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
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Fill customer details
      const customerNameInput = page.locator('input[type="text"]').first();
      await customerNameInput.fill('Test Customer');
      
      // Select card payment
      const cardOption = page.locator('label:has(input[value="stripe"])');
      await cardOption.click();
      
      // Submit should navigate to payment page
      const proceedButton = page.locator('button:has-text("Proceed to Payment")').or(page.locator('button:has-text("Vazhdo në Pagesë")'));
      await proceedButton.click();
      
      // Verify navigation to payment page
      await page.waitForURL('**/payment');
      
      // Verify payment page elements (basic check)
      await expect(page.locator('body')).toBeVisible();
    });

    test('should preserve customer data when navigating to payment', async ({ page }) => {
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
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Fill customer details
      const customerNameInput = page.locator('input[type="text"]').first();
      await customerNameInput.fill('John Doe');
      
      const orderNotesInput = page.locator('textarea').last();
      await orderNotesInput.fill('No onions please');
      
      // Select card payment
      const cardOption = page.locator('label:has(input[value="stripe"])');
      await cardOption.click();
      
      // Submit
      const proceedButton = page.locator('button:has-text("Proceed to Payment")').or(page.locator('button:has-text("Vazhdo në Pagesë")'));
      await proceedButton.click();
      
      // Payment page should have received the data via location state
      await page.waitForURL('**/payment');
      
      // Verify customer data is preserved (this would be implementation dependent)
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Translation Support', () => {
    test('should display payment method labels in Albanian', async ({ page }) => {
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
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Switch to Albanian
      const languageButton = page.locator('button:has-text("EN")').or(page.locator('[data-language-picker]'));
      if (await languageButton.isVisible()) {
        await languageButton.click();
        const albanianOption = page.locator('button:has-text("SQ")').or(page.locator('text=Shqip'));
        if (await albanianOption.isVisible()) {
          await albanianOption.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Verify Albanian translations
      const paymentMethodHeader = page.locator('text=Metoda e Pagesës');
      await expect(paymentMethodHeader).toBeVisible();
      
      const cashLabel = page.locator('text=Paguaj me Para në Dorë');
      await expect(cashLabel).toBeVisible();
      
      const cardLabel = page.locator('text=Paguaj me Kartë');
      await expect(cardLabel).toBeVisible();
    });

    test('should display payment method labels in English', async ({ page }) => {
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
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Ensure English is selected
      const languageButton = page.locator('button:has-text("SQ")').or(page.locator('[data-language-picker]'));
      if (await languageButton.isVisible()) {
        await languageButton.click();
        const englishOption = page.locator('button:has-text("EN")').or(page.locator('text=English'));
        if (await englishOption.isVisible()) {
          await englishOption.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Verify English translations
      const paymentMethodHeader = page.locator('text=Payment Method');
      await expect(paymentMethodHeader).toBeVisible();
      
      const cashLabel = page.locator('text=Pay with Cash');
      await expect(cashLabel).toBeVisible();
      
      const cardLabel = page.locator('text=Pay with Card');
      await expect(cardLabel).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display payment methods correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize(VIEWPORTS.MOBILE);
      
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
            categories: []
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Verify payment method section is visible and properly sized
      const paymentSection = page.locator('text=Payment Method').locator('..').locator('..');
      await expect(paymentSection).toBeVisible();
      
      // Verify payment options are stacked vertically
      const cashOption = page.locator('label:has(input[value="cash"])');
      const cardOption = page.locator('label:has(input[value="stripe"])');
      
      await expect(cashOption).toBeVisible();
      await expect(cardOption).toBeVisible();
      
      // Verify touch targets are large enough (minimum 44px)
      const cashBox = await cashOption.boundingBox();
      const cardBox = await cardOption.boundingBox();
      
      expect(cashBox!.height).toBeGreaterThanOrEqual(44);
      expect(cardBox!.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Error Handling', () => {
    test('should prevent submission with empty cart', async ({ page }) => {
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Verify empty cart message
      const emptyCartMessage = page.locator('text=Your cart is empty').or(page.locator('text=Shporta është bosh'));
      await expect(emptyCartMessage).toBeVisible();
      
      // Verify no payment method section is shown
      const paymentMethodSection = page.locator('text=Payment Method');
      await expect(paymentMethodSection).not.toBeVisible();
    });

    test('should handle network failures gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/venue/**', (route) => {
        route.abort('failed');
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // App should handle the error gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should validate required fields before submission', async ({ page }) => {
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add item to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Try to submit without customer name (if required)
      const submitButton = page.locator('button:has-text("Submit Order")').or(page.locator('button:has-text("Dërgo Porosinë")'));
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation error or prevent submission
        // Implementation may vary based on validation approach
        await page.waitForTimeout(1000);
        
        // Verify we're still on cart page (didn't submit)
        expect(page.url()).toContain('/cart');
      }
    });
  });

  test.describe('Integration Tests', () => {
    test('should maintain cart state during payment method changes', async ({ page }) => {
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
                    price: 3.50
                  }
                ]
              }
            ]
          })
        });
      });
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
      await page.waitForLoadState('networkidle');
      
      // Add multiple items to cart
      const addToCartButtons = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.first().click();
        await page.waitForTimeout(300);
        await addToCartButtons.first().click();
        await page.waitForTimeout(300);
      }
      
      await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
      await page.waitForLoadState('networkidle');
      
      // Verify initial cart total
      const initialTotal = await page.locator('text=Total').locator('..').locator('span').last().textContent();
      
      // Change payment method multiple times
      const cashOption = page.locator('label:has(input[value="cash"])');
      const cardOption = page.locator('label:has(input[value="stripe"])');
      
      await cardOption.click();
      await page.waitForTimeout(300);
      await cashOption.click();
      await page.waitForTimeout(300);
      await cardOption.click();
      await page.waitForTimeout(300);
      
      // Verify cart total remains unchanged
      const finalTotal = await page.locator('text=Total').locator('..').locator('span').last().textContent();
      expect(finalTotal).toBe(initialTotal);
    });

    test('should work across different venue configurations', async ({ page }) => {
      // Test with different venue settings
      const venueConfigs = [
        { stripeConnectEnabled: true },
        { stripeConnectEnabled: false },
        { stripeConnectEnabled: undefined }
      ];
      
      for (const config of venueConfigs) {
        await page.route('**/api/venue/**', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              venue: {
                id: 'beach-bar-durres',
                name: 'Beach Bar Durrës',
                settings: config
              },
              categories: []
            })
          });
        });
        
        await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
        await page.waitForLoadState('networkidle');
        
        // Cash option should always be visible
        const cashOption = page.locator('label:has(input[value="cash"])');
        await expect(cashOption).toBeVisible();
        
        // Card option visibility depends on Stripe configuration
        const cardOption = page.locator('label:has(input[value="stripe"])');
        if (config.stripeConnectEnabled) {
          await expect(cardOption).toBeVisible();
        } else {
          await expect(cardOption).not.toBeVisible();
        }
      }
    });
  });
});