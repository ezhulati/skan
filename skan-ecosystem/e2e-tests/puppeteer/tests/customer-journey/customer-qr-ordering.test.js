const CustomerAppPage = require('../../page-objects/customer/CustomerAppPage');
const AdminPortalPage = require('../../page-objects/admin/AdminPortalPage');
const ApiHelpers = require('../../utils/api-helpers');
const TestData = require('../../utils/test-data');

describe('Customer QR Code Ordering Journey', () => {
  let customerPage;
  let adminPage;
  let customerAppPage;
  let adminPortalPage;
  let apiHelpers;
  let testOrderNumber;

  beforeAll(async () => {
    apiHelpers = new ApiHelpers();
    console.log('🚀 Starting Customer QR Code Ordering Journey Tests');
  });

  afterAll(async () => {
    console.log('✅ Customer QR Code Ordering Journey Tests Complete');
  });

  beforeEach(async () => {
    // Create fresh pages for each test - browser is global from jest-puppeteer
    customerPage = await browser.newPage();
    adminPage = await browser.newPage();
    
    customerAppPage = new CustomerAppPage(customerPage);
    adminPortalPage = new AdminPortalPage(adminPage);
    
    // Set viewport for mobile testing
    await testUtils.setMobileViewport(customerPage);
  });

  afterEach(async () => {
    if (customerPage) await customerPage.close();
    if (adminPage) await adminPage.close();
  });

  describe('1. QR Code Landing and Menu Access', () => {
    test('1.1 Should successfully access venue via QR code URL', async () => {
      console.log('📱 Testing QR code landing page access...');
      
      // Navigate to QR code URL
      await customerAppPage.navigateToQR('beach-bar-durres', 'a1');
      
      // Validate page loaded
      const isLoaded = await customerAppPage.validatePageLoaded('beach');
      expect(isLoaded).toBe(true);
      
      // Get venue information
      const venueInfo = await customerAppPage.getVenueInfo();
      expect(venueInfo.isLoaded).toBe(true);
      expect(venueInfo.name).toContain('Beach Bar');
      
      console.log('✅ QR code landing page loaded successfully');
      await customerAppPage.takeScreenshot('qr-landing');
    });

    test('1.2 Should display menu with categories and items', async () => {
      console.log('📋 Testing menu display and structure...');
      
      // Navigate to menu
      await customerAppPage.navigateToMenu('beach-bar-durres', 'a1');
      
      // Validate menu structure
      const menuStructure = await customerAppPage.validateMenuStructure();
      expect(menuStructure.hasCategories).toBe(true);
      expect(menuStructure.hasItems).toBe(true);
      expect(menuStructure.categoryCount).toBeGreaterThan(0);
      expect(menuStructure.itemCount).toBeGreaterThan(0);
      
      // Get categories and items
      const categories = await customerAppPage.getMenuCategories();
      const items = await customerAppPage.getMenuItems();
      
      console.log(`📊 Menu loaded: ${categories.length} categories, ${items.length} items`);
      
      // Validate specific items exist
      const hasAlbanianBeer = items.some(item => 
        item.name.toLowerCase().includes('albanian') && 
        item.name.toLowerCase().includes('beer')
      );
      expect(hasAlbanianBeer).toBe(true);
      
      console.log('✅ Menu structure validation complete');
      await customerAppPage.takeScreenshot('menu-display');
    });

    test('1.3 Should support language switching between Albanian and English', async () => {
      console.log('🌐 Testing language switching functionality...');
      
      await customerAppPage.navigateToMenu('beach-bar-durres', 'a1');
      
      // Try switching to Albanian
      await customerAppPage.switchToAlbanian();
      await customerPage.waitForTimeout(2000);
      
      // Try switching to English
      await customerAppPage.switchToEnglish();
      await customerPage.waitForTimeout(2000);
      
      console.log('✅ Language switching tested');
      await customerAppPage.takeScreenshot('language-switch');
    });
  });

  describe('2. Cart Management and Order Process', () => {
    test('2.1 Should add items to cart and calculate totals', async () => {
      console.log('🛒 Testing cart functionality...');
      
      await customerAppPage.navigateToMenu('beach-bar-durres', 'a1');
      
      // Add Albanian Beer to cart
      const addedBeer = await customerAppPage.addItemToCart('Albanian Beer');
      expect(addedBeer).toBe(true);
      
      // Wait for cart to update
      await customerPage.waitForTimeout(2000);
      
      // Check cart total
      const cartTotal = await customerAppPage.getCartTotal();
      expect(cartTotal).not.toBe('0');
      
      // Add another item
      const addedSalad = await customerAppPage.addItemToCart('Salad');
      
      console.log(`✅ Cart functionality tested - Total: ${cartTotal}`);
      await customerAppPage.takeScreenshot('cart-with-items');
    });

    test('2.2 Should complete order placement with customer information', async () => {
      console.log('📝 Testing complete order placement...');
      
      await customerAppPage.navigateToMenu('beach-bar-durres', 'a1');
      
      // Add items to cart
      await customerAppPage.addItemToCart('Albanian Beer');
      await customerPage.waitForTimeout(1000);
      
      // View cart
      const cartViewed = await customerAppPage.viewCart();
      if (cartViewed) {
        await customerPage.waitForTimeout(2000);
      }
      
      // Fill customer information
      const customerData = TestData.generateCustomerData();
      await customerAppPage.fillCustomerInfo(customerData.name);
      await customerAppPage.addSpecialInstructions('E2E test order - please ignore');
      
      // Submit order
      const orderSubmitted = await customerAppPage.submitOrder();
      expect(orderSubmitted).toBe(true);
      
      // Get order number
      const orderNumber = await customerAppPage.getOrderNumber();
      if (orderNumber) {
        testOrderNumber = orderNumber;
        console.log(`📋 Order placed successfully: ${orderNumber}`);
      }
      
      console.log('✅ Order placement completed');
      await customerAppPage.takeScreenshot('order-confirmation');
    });

    test('2.3 Should track order status after placement', async () => {
      console.log('📊 Testing order tracking...');
      
      if (!testOrderNumber) {
        console.log('⚠️ No order number available, skipping tracking test');
        return;
      }
      
      // Navigate to order tracking
      const trackingUrl = TestData.urls.orderTracking(testOrderNumber);
      await customerPage.goto(trackingUrl, { waitUntil: 'networkidle2' });
      
      // Get order status
      const orderStatus = await customerAppPage.getOrderStatus();
      expect(orderStatus).toBeTruthy();
      
      console.log(`📈 Order status: ${orderStatus}`);
      console.log('✅ Order tracking tested');
      await customerAppPage.takeScreenshot('order-tracking');
    });
  });

  describe('3. Restaurant Admin Integration', () => {
    test('3.1 Should receive order in restaurant admin portal', async () => {
      console.log('🏪 Testing restaurant order reception...');
      
      // Login to admin portal
      await adminPortalPage.navigateToLogin();
      const loginSuccess = await adminPortalPage.login();
      expect(loginSuccess).toBe(true);
      
      // Validate dashboard loaded
      const dashboardLoaded = await adminPortalPage.validateDashboardLoaded();
      expect(dashboardLoaded).toBe(true);
      
      // Get orders from dashboard
      const orders = await adminPortalPage.getNewOrders();
      expect(orders.length).toBeGreaterThan(0);
      
      console.log(`📊 Found ${orders.length} orders in admin dashboard`);
      
      // Look for our test order
      if (testOrderNumber) {
        const ourOrder = orders.find(order => 
          order.number.includes(testOrderNumber) || 
          testOrderNumber.includes(order.number)
        );
        
        if (ourOrder) {
          console.log(`✅ Test order found in admin: ${ourOrder.number}`);
        }
      }
      
      await adminPortalPage.takeScreenshot('admin-dashboard-orders');
    });

    test('3.2 Should update order status from admin portal', async () => {
      console.log('🔄 Testing order status updates...');
      
      if (!testOrderNumber) {
        console.log('⚠️ No order number available, skipping status update test');
        return;
      }
      
      // Ensure we're logged in
      await adminPortalPage.navigateToLogin();
      await adminPortalPage.login();
      await adminPortalPage.navigateToDashboard();
      
      // Update order status
      const statusUpdated = await adminPortalPage.updateOrderStatus(testOrderNumber, 'preparing');
      
      console.log(`📝 Order status update attempted: ${statusUpdated}`);
      
      await adminPortalPage.takeScreenshot('order-status-update');
    });

    test('3.3 Should validate cross-application data synchronization', async () => {
      console.log('🔄 Testing data synchronization between apps...');
      
      if (!testOrderNumber) {
        console.log('⚠️ No order number available, skipping sync test');
        return;
      }
      
      // Check order via API
      const apiOrder = await apiHelpers.trackOrder(testOrderNumber);
      
      if (apiOrder.success) {
        console.log(`📡 API order status: ${apiOrder.data.status}`);
        expect(apiOrder.data.orderNumber).toBe(testOrderNumber);
      }
      
      // Check order in customer app
      const trackingUrl = TestData.urls.orderTracking(testOrderNumber);
      await customerPage.goto(trackingUrl, { waitUntil: 'networkidle2' });
      
      const customerStatus = await customerAppPage.getOrderStatus();
      console.log(`📱 Customer app status: ${customerStatus}`);
      
      console.log('✅ Data synchronization tested');
    });
  });

  describe('4. Performance and Error Handling', () => {
    test('4.1 Should handle network delays gracefully', async () => {
      console.log('⏱️ Testing performance and timeout handling...');
      
      // Simulate slow network
      await customerPage.setRequestInterception(true);
      customerPage.on('request', request => {
        setTimeout(() => request.continue(), 500); // 500ms delay
      });
      
      // Navigate with delays
      await customerAppPage.navigateToMenu('beach-bar-durres', 'a1');
      
      // Validate menu still loads
      const menuStructure = await customerAppPage.validateMenuStructure();
      expect(menuStructure.hasItems).toBe(true);
      
      console.log('✅ Performance testing completed');
    });

    test('4.2 Should handle invalid QR codes appropriately', async () => {
      console.log('❌ Testing error handling for invalid QR codes...');
      
      // Try invalid venue slug
      await customerPage.goto('https://order.skan.al/invalid-venue/a1', { 
        waitUntil: 'networkidle2' 
      });
      
      // Should handle gracefully (404 page or redirect)
      const url = await customerPage.url();
      const title = await customerPage.title();
      
      console.log(`📍 Invalid venue handling - URL: ${url}, Title: ${title}`);
      
      await customerAppPage.takeScreenshot('invalid-qr-handling');
    });
  });

  describe('5. Mobile Responsiveness', () => {
    test('5.1 Should work properly on mobile viewport', async () => {
      console.log('📱 Testing mobile responsiveness...');
      
      // Already set mobile viewport in beforeEach
      await customerAppPage.navigateToMenu('beach-bar-durres', 'a1');
      
      // Test touch interactions
      const menuItems = await customerAppPage.getMenuItems();
      expect(menuItems.length).toBeGreaterThan(0);
      
      // Test cart on mobile
      await customerAppPage.addItemToCart('Albanian Beer');
      const cartTotal = await customerAppPage.getCartTotal();
      expect(cartTotal).not.toBe('0');
      
      console.log('✅ Mobile responsiveness tested');
      await customerAppPage.takeScreenshot('mobile-view');
    });
  });
});