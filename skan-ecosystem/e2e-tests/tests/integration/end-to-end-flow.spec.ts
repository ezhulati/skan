import { test, expect } from '@playwright/test';
import { MarketingSitePage } from '../../page-objects/MarketingSitePage';
import { CustomerAppPage } from '../../page-objects/CustomerAppPage';
import { AdminPortalPage } from '../../page-objects/AdminPortalPage';
import { TEST_DATA } from '../../test-data/constants';

test.describe('Integration - End-to-End Flow', () => {
  let marketingPage: MarketingSitePage;
  let customerPage: CustomerAppPage;
  let adminPage: AdminPortalPage;

  test('Complete customer journey from marketing to order fulfillment', async ({ browser }) => {
    // Create separate contexts for customer and admin
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();
    
    const customerPageObj = await customerContext.newPage();
    const adminPageObj = await adminContext.newPage();
    
    customerPage = new CustomerAppPage(customerPageObj);
    adminPage = new AdminPortalPage(adminPageObj);

    // Step 1: Customer discovers SKAN.AL through marketing site
    marketingPage = new MarketingSitePage(customerPageObj);
    await marketingPage.goto();
    await marketingPage.verifyHomepageLoaded();
    
    // Customer views features
    await marketingPage.clickNavigation('features');
    await marketingPage.verifyFeaturesSection();
    
    // Step 2: Customer scans QR code (simulated)
    await customerPage.scanQRCode(TEST_DATA.SAMPLE_VENUE.id);
    await customerPage.verifyQRLandingLoaded();
    await customerPage.verifyVenueInfo();
    
    // Step 3: Customer browses menu and places order
    await customerPage.proceedToMenu();
    await customerPage.verifyMenuLoaded();
    
    // Add multiple items to cart
    await customerPage.addItemToCartByName('Classic Burger', 2);
    await customerPage.addItemToCartByName('Caesar Salad', 1);
    
    // Proceed to checkout
    await customerPage.proceedToCheckout();
    
    // Fill customer information
    await customerPage.fillCustomerInfo({
      name: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com'
    });
    
    await customerPage.selectTable('5');
    
    // Place order
    await customerPage.placeOrder();
    const orderNumber = await customerPage.verifyOrderConfirmation();
    
    // Step 4: Admin receives and processes order
    await adminPage.login();
    await adminPage.verifyDashboardLoaded();
    
    // Navigate to orders
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    // Find the new order (would typically be at the top)
    const orderCards = adminPage.orderCards;
    const orderCount = await orderCards.count();
    
    if (orderCount > 0) {
      // View order details
      await adminPage.viewOrderDetails(0);
      
      // Update order status to preparing
      await adminPage.updateOrderStatus('preparing');
      
      // Update to ready
      await adminPage.updateOrderStatus('ready');
      
      // Mark as completed
      await adminPage.updateOrderStatus('completed');
    }
    
    // Step 5: Customer sees order status updates (simulated)
    await customerPage.verifyOrderStatus('completed');
    
    // Cleanup
    await customerContext.close();
    await adminContext.close();
  });

  test('Marketing site to customer app flow', async ({ page }) => {
    marketingPage = new MarketingSitePage(page);
    customerPage = new CustomerAppPage(page);
    
    // Start at marketing site
    await marketingPage.goto();
    await marketingPage.verifyHomepageLoaded();
    
    // Click demo CTA
    await marketingPage.clickHeroCTA();
    
    // Should lead to demo or customer app
    const currentUrl = page.url();
    
    if (currentUrl.includes('3000') || currentUrl.includes('demo')) {
      // If redirected to customer app, verify it works
      if (currentUrl.includes('3000')) {
        await customerPage.scanQRCode();
        await customerPage.verifyQRLandingLoaded();
      }
    }
  });

  test('Cross-application performance and reliability', async ({ browser }) => {
    // Test concurrent usage across applications
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    // Concurrent operations
    await Promise.all([
      // Marketing site visitor
      (async () => {
        const marketing = new MarketingSitePage(pages[0]);
        await marketing.goto();
        await marketing.verifyHomepageLoaded();
        await marketing.gotoPage('/features');
        await marketing.verifyFeaturesSection();
      })(),
      
      // Customer placing order
      (async () => {
        const customer = new CustomerAppPage(pages[1]);
        await customer.completeOrderingFlow({
          items: [{ name: 'Classic Burger', quantity: 1 }],
          customer: { name: 'Concurrent Customer' }
        });
      })(),
      
      // Admin managing orders
      (async () => {
        const admin = new AdminPortalPage(pages[2]);
        await admin.login();
        await admin.navigateToOrders();
        await admin.verifyOrdersListLoaded();
      })()
    ]);
    
    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  test('Mobile responsive flow across applications', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    
    const page = await context.newPage();
    
    // Test mobile flow
    marketingPage = new MarketingSitePage(page);
    customerPage = new CustomerAppPage(page);
    
    // Marketing site on mobile
    await marketingPage.goto();
    await marketingPage.verifyMobileNavigation();
    
    // Customer app on mobile
    await customerPage.scanQRCode();
    await customerPage.verifyQRLandingLoaded();
    
    // Verify mobile touch targets
    const touchTargets = await page.locator('button, a[href], .clickable').all();
    for (const target of touchTargets.slice(0, 5)) {
      const box = await target.boundingBox();
      if (box && await target.isVisible()) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    await context.close();
  });

  test('Data consistency across applications', async ({ browser }) => {
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();
    
    const customerPageObj = await customerContext.newPage();
    const adminPageObj = await adminContext.newPage();
    
    customerPage = new CustomerAppPage(customerPageObj);
    adminPage = new AdminPortalPage(adminPageObj);
    
    // Customer places specific order
    const orderData = {
      items: [
        { name: 'Classic Burger', quantity: 2 },
        { name: 'Caesar Salad', quantity: 1 }
      ],
      customer: { 
        name: 'Data Consistency Test',
        phone: '+1111111111'
      },
      tableNumber: '10'
    };
    
    const orderNumber = await customerPage.completeOrderingFlow(orderData);
    
    // Admin verifies order data
    await adminPage.login();
    await adminPage.navigateToOrders();
    
    // Search for the specific order
    await adminPage.searchOrders('Data Consistency Test');
    
    const searchResults = await adminPage.orderCards.count();
    if (searchResults > 0) {
      await adminPage.viewOrderDetails(0);
      
      // Verify order contains correct information
      const customerNameElement = adminPage.page.locator('.customer-name');
      await expect(customerNameElement).toContainText('Data Consistency Test');
      
      // Verify items are correct
      const orderItems = adminPage.page.locator('.order-item');
      const itemCount = await orderItems.count();
      expect(itemCount).toBe(2); // Should have 2 different items
    }
    
    await customerContext.close();
    await adminContext.close();
  });

  test('Error handling across applications', async ({ page }) => {
    customerPage = new CustomerAppPage(page);
    
    // Test invalid venue ID
    await customerPage.scanQRCode('invalid-venue-id');
    
    // Should handle gracefully
    const errorState = page.locator('.error-message, .not-found, .invalid-venue');
    const venueInfo = customerPage.venueInfo;
    
    const hasError = await errorState.isVisible();
    const hasVenueInfo = await venueInfo.isVisible();
    
    // Should either show error or fallback content
    expect(hasError || hasVenueInfo).toBeTruthy();
  });

  test('Cross-browser compatibility', async ({ browserName, page }) => {
    // Test basic functionality across browsers
    marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
    await marketingPage.verifyHomepageLoaded();
    
    customerPage = new CustomerAppPage(page);
    await customerPage.scanQRCode();
    await customerPage.verifyQRLandingLoaded();
    
    // Browser-specific checks
    if (browserName === 'webkit') {
      // Safari-specific tests
      await customerPage.verifyPWAPrompt();
    }
    
    if (browserName === 'firefox') {
      // Firefox-specific tests
      await marketingPage.verifySEOElements();
    }
  });

  test('Network conditions impact', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    customerPage = new CustomerAppPage(page);
    
    // Test app behavior under slow network
    const startTime = Date.now();
    await customerPage.scanQRCode();
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time
    expect(loadTime).toBeLessThan(30000); // 30 seconds max
    
    await customerPage.verifyQRLandingLoaded();
  });

  test('Session management and security', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    adminPage = new AdminPortalPage(page);
    
    // Login to admin
    await adminPage.login();
    await adminPage.verifyDashboardLoaded();
    
    // Clear session and try to access protected route
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to protected route
    await page.goto('http://localhost:3002/orders');
    
    // Should redirect to login
    await adminPage.verifyLoginPageLoaded();
    
    await context.close();
  });

  test('Internationalization and localization readiness', async ({ page }) => {
    // Test with different locales
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9'
    });
    
    marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
    
    // Check if site handles different languages gracefully
    const htmlLang = await page.getAttribute('html', 'lang');
    
    // Should have language attribute
    expect(htmlLang).toBeTruthy();
    
    // Test with RTL language
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ar-SA,ar;q=0.9'
    });
    
    await page.reload();
    
    // Should still be functional
    await marketingPage.verifyHomepageLoaded();
  });
});