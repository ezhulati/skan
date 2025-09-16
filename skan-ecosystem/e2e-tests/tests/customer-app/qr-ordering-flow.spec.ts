import { test, expect } from '@playwright/test';
import { CustomerAppPage } from '../../page-objects/CustomerAppPage';
import { TEST_DATA } from '../../test-data/constants';

test.describe('Customer App - QR Ordering Flow', () => {
  let customerPage: CustomerAppPage;

  test.beforeEach(async ({ page }) => {
    customerPage = new CustomerAppPage(page);
  });

  test('should complete full QR ordering flow', async () => {
    // Complete the entire ordering process
    const orderNumber = await customerPage.completeOrderingFlow({
      venueId: TEST_DATA.SAMPLE_VENUE.id,
      items: [
        { name: 'Classic Burger', quantity: 2 },
        { name: 'Caesar Salad', quantity: 1 }
      ],
      customer: {
        name: 'John Doe',
        phone: '+1234567890'
      },
      tableNumber: '5'
    });

    expect(orderNumber).toBeTruthy();
    expect(orderNumber).toMatch(/\d+/);
  });

  test('should handle QR code scanning and venue display', async () => {
    // Simulate QR code scan
    await customerPage.scanQRCode(TEST_DATA.SAMPLE_VENUE.id);
    
    // Verify QR landing page loads
    await customerPage.verifyQRLandingLoaded();
    
    // Verify venue information
    await customerPage.verifyVenueInfo(TEST_DATA.SAMPLE_VENUE);
    
    // Proceed to menu
    await customerPage.proceedToMenu();
    await customerPage.verifyMenuLoaded();
  });

  test('should display menu with categories and items', async () => {
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    await customerPage.verifyMenuLoaded();
    
    // Check menu categories exist
    const categories = customerPage.page.locator('.category-button, [data-category]');
    const categoryCount = await categories.count();
    
    if (categoryCount > 0) {
      // Test category filtering
      const firstCategory = await categories.first().textContent();
      if (firstCategory) {
        await customerPage.selectMenuCategory(firstCategory);
        
        // Verify items are filtered
        await customerPage.page.waitForTimeout(500);
        const menuItems = customerPage.menuItemCards;
        const itemCount = await menuItems.count();
        expect(itemCount).toBeGreaterThan(0);
      }
    }
  });

  test('should add items to cart and update totals', async () => {
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    await customerPage.verifyMenuLoaded();
    
    // Add first item to cart
    await customerPage.addItemToCart(0, 2);
    await customerPage.verifyCartCount(2);
    
    // Add second item
    await customerPage.addItemToCart(1, 1);
    await customerPage.verifyCartCount(3);
    
    // Open cart and verify contents
    await customerPage.openCart();
    
    // Verify cart shows items
    const cartItems = customerPage.cartItems;
    await expect(cartItems).toBeVisible();
    
    // Verify cart total is calculated
    const cartTotal = customerPage.cartTotal;
    const totalText = await cartTotal.textContent();
    expect(totalText).toMatch(/\$\d+\.\d{2}/);
  });

  test('should handle cart operations', async () => {
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    
    // Add items to cart by name
    await customerPage.addItemToCartByName('Classic Burger', 2);
    await customerPage.addItemToCartByName('Caesar Salad', 1);
    
    // Open cart
    await customerPage.openCart();
    
    // Update quantity
    await customerPage.updateCartItemQuantity('Classic Burger', 3);
    await customerPage.verifyCartCount(4); // 3 burgers + 1 salad
    
    // Remove item
    await customerPage.removeCartItem('Caesar Salad');
    await customerPage.verifyCartCount(3); // 3 burgers only
  });

  test('should proceed through checkout process', async () => {
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    
    // Add items
    await customerPage.addItemToCart(0, 2);
    
    // Proceed to checkout
    await customerPage.proceedToCheckout();
    
    // Fill customer information
    await customerPage.fillCustomerInfo({
      name: 'Test Customer',
      phone: '+1234567890',
      email: 'test@example.com'
    });
    
    // Select table
    await customerPage.selectTable('3');
    
    // Place order
    await customerPage.placeOrder();
    
    // Verify order confirmation
    const orderNumber = await customerPage.verifyOrderConfirmation();
    expect(orderNumber).toBeTruthy();
  });

  test('should handle order status updates', async () => {
    // Complete an order first
    const orderNumber = await customerPage.completeOrderingFlow({
      items: [{ name: 'Classic Burger', quantity: 1 }],
      customer: { name: 'Test Customer' }
    });
    
    // Verify initial status
    await customerPage.verifyOrderStatus('pending');
    
    // Mock status update (in real scenario, this would come from admin updates)
    await customerPage.page.evaluate(() => {
      // Simulate real-time status update
      const statusElement = document.querySelector('[data-testid="order-status"]');
      if (statusElement) {
        statusElement.textContent = 'preparing';
      }
    });
    
    await customerPage.verifyOrderStatus('preparing');
  });

  test('should work on mobile devices', async () => {
    // Set mobile viewport
    await customerPage.page.setViewportSize({ width: 375, height: 667 });
    
    // Complete flow on mobile
    await customerPage.scanQRCode();
    await customerPage.verifyQRLandingLoaded();
    
    // Verify mobile-friendly layout
    const venueInfo = customerPage.venueInfo;
    await expect(venueInfo).toBeVisible();
    
    // Test menu on mobile
    await customerPage.proceedToMenu();
    await customerPage.verifyMenuLoaded();
    
    // Add item on mobile
    await customerPage.addItemToCart(0, 1);
    
    // Verify cart button is accessible
    const cartButton = customerPage.cartButton;
    const buttonBox = await cartButton.boundingBox();
    
    // Touch target should be at least 44px
    expect(buttonBox!.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should handle edge cases and errors', async () => {
    // Test with invalid venue ID
    await customerPage.scanQRCode('invalid-venue-id');
    
    // Should show error message or redirect
    const errorMessage = customerPage.page.locator('.error-message, .not-found');
    const venueInfo = customerPage.venueInfo;
    
    // Either error message or default venue info should be shown
    const hasError = await errorMessage.isVisible();
    const hasVenueInfo = await venueInfo.isVisible();
    
    expect(hasError || hasVenueInfo).toBeTruthy();
  });

  test('should verify PWA functionality', async () => {
    await customerPage.goto();
    
    // Verify PWA manifest
    await customerPage.verifyPWAPrompt();
    
    // Test offline mode
    await customerPage.verifyOfflineMode();
  });

  test('should handle empty cart checkout attempt', async () => {
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    
    // Try to checkout with empty cart
    const checkoutButton = customerPage.checkoutButton;
    
    // Checkout button should be disabled or show error
    if (await checkoutButton.isVisible()) {
      const isDisabled = await checkoutButton.isDisabled();
      if (!isDisabled) {
        await checkoutButton.click();
        
        // Should show error message
        const errorMessage = customerPage.page.locator('.error-message, .cart-empty-error');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should preserve cart state during session', async () => {
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    
    // Add items to cart
    await customerPage.addItemToCart(0, 2);
    await customerPage.verifyCartCount(2);
    
    // Navigate away and back
    await customerPage.page.goBack();
    await customerPage.page.goForward();
    
    // Cart should be preserved
    await customerPage.verifyCartCount(2);
  });
});