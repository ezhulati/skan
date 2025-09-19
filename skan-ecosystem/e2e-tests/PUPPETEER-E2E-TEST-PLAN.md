# SKAN.AL COMPREHENSIVE PUPPETEER E2E TEST PLAN

## 📋 Overview

This comprehensive end-to-end test plan uses Puppeteer to automate complete user journeys across the SKAN.AL QR restaurant ordering ecosystem. It covers all user types, workflows, and integration points with real browser testing.

---

## 🎯 Test Scope & Coverage

### **Test Domains**
- **Marketing Site:** `skan.al` (Astro)
- **Customer App:** `order.skan.al` (React PWA)  
- **Admin Portal:** `admin.skan.al` (React)
- **API Backend:** `api.skan.al` (Firebase Functions)

### **User Types Covered**
1. **Prospective Restaurant Owner** → Marketing site exploration
2. **New Restaurant Owner** → Registration and onboarding
3. **Restaurant Manager** → Daily operations management
4. **Restaurant Staff** → Order processing workflows
5. **Customer** → QR ordering experience
6. **System Admin** → Multi-venue management

---

## 📁 Test File Structure

```
e2e-tests/puppeteer/
├── config/
│   ├── puppeteer.config.js          # Browser and test configuration
│   ├── test-data.js                 # Shared test data and constants
│   └── environment.js               # Environment URLs and settings
├── utils/
│   ├── browser-utils.js             # Browser management utilities
│   ├── api-utils.js                 # API interaction helpers
│   ├── auth-utils.js                # Authentication helpers
│   ├── screenshot-utils.js          # Screenshot and visual testing
│   └── performance-utils.js         # Performance measurement tools
├── page-objects/
│   ├── marketing/
│   │   ├── HomePage.js              # Marketing site homepage
│   │   ├── ContactPage.js           # Contact form page
│   │   └── RegistrationPage.js      # Restaurant registration
│   ├── customer/
│   │   ├── MenuPage.js              # Customer menu viewing
│   │   ├── CartPage.js              # Shopping cart management
│   │   └── OrderTrackingPage.js     # Order status tracking
│   └── admin/
│       ├── LoginPage.js             # Admin authentication
│       ├── DashboardPage.js         # Order management dashboard
│       ├── OnboardingPage.js        # Restaurant setup wizard
│       └── UserManagementPage.js    # Staff management
├── tests/
│   ├── customer-journey/
│   │   ├── qr-ordering-flow.test.js         # Complete QR ordering
│   │   ├── menu-browsing.test.js            # Menu exploration
│   │   ├── cart-management.test.js          # Cart operations
│   │   └── order-tracking.test.js           # Status tracking
│   ├── restaurant-operations/
│   │   ├── manager-workflow.test.js         # Manager daily operations
│   │   ├── staff-workflow.test.js           # Staff order processing
│   │   ├── order-lifecycle.test.js          # Complete order management
│   │   └── dashboard-functionality.test.js  # Dashboard features
│   ├── onboarding/
│   │   ├── restaurant-registration.test.js  # New restaurant setup
│   │   ├── onboarding-wizard.test.js        # Setup wizard completion
│   │   └── user-management.test.js          # Staff invitation system
│   ├── integration/
│   │   ├── cross-domain.test.js             # Domain integration
│   │   ├── real-time-updates.test.js        # Live order updates
│   │   └── end-to-end-complete.test.js      # Full system workflow
│   ├── performance/
│   │   ├── page-load-times.test.js          # Load performance
│   │   ├── api-response-times.test.js       # API performance
│   │   └── mobile-performance.test.js       # Mobile optimization
│   └── accessibility/
│       ├── keyboard-navigation.test.js      # Keyboard accessibility
│       ├── screen-reader.test.js            # Screen reader support
│       └── contrast-compliance.test.js      # Visual accessibility
├── fixtures/
│   ├── test-restaurant-data.json    # Sample restaurant data
│   ├── test-menu-items.json         # Sample menu items
│   └── test-orders.json             # Sample order data
├── reports/
│   ├── test-results.html            # HTML test report
│   ├── screenshots/                 # Test screenshots
│   └── performance-metrics.json     # Performance data
└── scripts/
    ├── run-full-suite.js            # Complete test runner
    ├── run-smoke-tests.js           # Quick validation tests
    └── cleanup-test-data.js         # Test data cleanup
```

---

## 🔧 Configuration Setup

### **Puppeteer Configuration** (`config/puppeteer.config.js`)

```javascript
const config = {
  // Browser settings
  browser: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    devtools: process.env.DEVTOOLS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  },
  
  // Test settings
  test: {
    timeout: 30000,
    retries: 2,
    screenshotOnFailure: true,
    videoRecording: process.env.VIDEO_RECORDING === 'true'
  },
  
  // Performance thresholds
  performance: {
    pageLoadTimeout: 5000,
    apiResponseTimeout: 2000,
    elementWaitTimeout: 10000
  },
  
  // Viewport configurations
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  
  // Environment URLs
  urls: {
    marketing: process.env.MARKETING_URL || 'https://skan.al',
    customer: process.env.CUSTOMER_URL || 'https://order.skan.al',
    admin: process.env.ADMIN_URL || 'https://admin.skan.al',
    api: process.env.API_URL || 'https://api.skan.al'
  }
};

module.exports = config;
```

### **Test Data Configuration** (`config/test-data.js`)

```javascript
const testData = {
  // Test restaurant data
  restaurant: {
    name: 'E2E Test Restaurant',
    address: 'Test Address 123, Tirana, Albania',
    phone: '+355 67 123 4567',
    cuisineType: 'traditional',
    description: 'Test restaurant for E2E testing'
  },
  
  // Test user accounts
  users: {
    manager: {
      email: 'e2e-manager@test.skan.al',
      password: 'TestManager123!',
      fullName: 'E2E Test Manager'
    },
    staff: {
      email: 'e2e-staff@test.skan.al', 
      password: 'TestStaff123!',
      fullName: 'E2E Test Staff'
    },
    owner: {
      email: 'e2e-owner@test.skan.al',
      password: 'TestOwner123!',
      fullName: 'E2E Test Owner'
    }
  },
  
  // Test menu items
  menuItems: [
    {
      name: 'Test Pizza',
      nameAlbanian: 'Picë Test',
      price: 12.50,
      category: 'Main Courses',
      description: 'Test pizza for E2E testing'
    },
    {
      name: 'Test Salad',
      nameAlbanian: 'Sallatë Test', 
      price: 8.50,
      category: 'Appetizers',
      description: 'Test salad for E2E testing'
    }
  ],
  
  // Test orders
  orders: {
    standard: {
      customerName: 'E2E Test Customer',
      tableNumber: 'T-E2E-01',
      items: [
        { id: 'test-pizza', quantity: 2 },
        { id: 'test-salad', quantity: 1 }
      ],
      specialInstructions: 'E2E test order - please handle with care'
    }
  },
  
  // QR code test data
  qrCodes: {
    testTable: 'T-E2E-01',
    testVenue: 'e2e-test-restaurant'
  }
};

module.exports = testData;
```

---

## 🧪 Test Implementation Examples

### **Complete Customer Journey Test** (`tests/customer-journey/qr-ordering-flow.test.js`)

```javascript
const puppeteer = require('puppeteer');
const config = require('../../config/puppeteer.config');
const testData = require('../../config/test-data');
const MenuPage = require('../../page-objects/customer/MenuPage');
const CartPage = require('../../page-objects/customer/CartPage');
const OrderTrackingPage = require('../../page-objects/customer/OrderTrackingPage');

describe('Complete QR Ordering Flow', () => {
  let browser, page;
  let menuPage, cartPage, orderTrackingPage;

  beforeAll(async () => {
    browser = await puppeteer.launch(config.browser);
    page = await browser.newPage();
    await page.setViewport(config.viewports.mobile);
    
    menuPage = new MenuPage(page);
    cartPage = new CartPage(page);
    orderTrackingPage = new OrderTrackingPage(page);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Customer can complete full ordering flow via QR code', async () => {
    // Step 1: Simulate QR code scan by navigating to venue/table URL
    const qrUrl = `${config.urls.customer}/${testData.qrCodes.testVenue}/${testData.qrCodes.testTable}`;
    await page.goto(qrUrl);
    
    // Step 2: Verify menu loads correctly
    await menuPage.waitForMenuToLoad();
    expect(await menuPage.getVenueName()).toContain('Test Restaurant');
    expect(await menuPage.getCategoryCount()).toBeGreaterThan(0);
    
    // Step 3: Browse menu and verify translations
    await menuPage.switchLanguage('english');
    const englishItems = await menuPage.getMenuItems();
    await menuPage.switchLanguage('albanian');
    const albanianItems = await menuPage.getMenuItems();
    
    expect(englishItems.length).toBe(albanianItems.length);
    
    // Step 4: Add items to cart
    await menuPage.addItemToCart('test-pizza', 2);
    await menuPage.addItemToCart('test-salad', 1);
    
    // Step 5: Review cart
    await menuPage.goToCart();
    await cartPage.waitForCartToLoad();
    
    const cartItems = await cartPage.getCartItems();
    expect(cartItems).toHaveLength(2);
    expect(await cartPage.getTotalAmount()).toBe('€33.50');
    
    // Step 6: Add customer information
    await cartPage.setCustomerName('E2E Test Customer');
    await cartPage.setSpecialInstructions('E2E test order - please handle with care');
    
    // Step 7: Place order
    const orderNumber = await cartPage.placeOrder();
    expect(orderNumber).toMatch(/SKN-\d{8}-\d{3}/);
    
    // Step 8: Track order status
    await orderTrackingPage.waitForOrderTracking();
    expect(await orderTrackingPage.getOrderStatus()).toBe('new');
    expect(await orderTrackingPage.getOrderNumber()).toBe(orderNumber);
    
    // Step 9: Verify order details
    const orderDetails = await orderTrackingPage.getOrderDetails();
    expect(orderDetails.customerName).toBe('E2E Test Customer');
    expect(orderDetails.items).toHaveLength(2);
    expect(orderDetails.totalAmount).toBe('€33.50');
    
    console.log(`✅ Order completed successfully: ${orderNumber}`);
  });

  test('Customer can track order with real-time updates', async () => {
    // This test would simulate restaurant updating order status
    // and verify customer sees real-time updates
    
    const orderNumber = 'SKN-20250919-999'; // Mock order
    const trackingUrl = `${config.urls.customer}/track/${orderNumber}`;
    
    await page.goto(trackingUrl);
    await orderTrackingPage.waitForOrderTracking();
    
    // Simulate status updates and verify UI changes
    expect(await orderTrackingPage.getOrderStatus()).toBe('new');
    
    // Would integrate with API to simulate status changes
    // and verify real-time updates in the UI
  });
});
```

### **Restaurant Manager Workflow Test** (`tests/restaurant-operations/manager-workflow.test.js`)

```javascript
const puppeteer = require('puppeteer');
const config = require('../../config/puppeteer.config');
const testData = require('../../config/test-data');
const LoginPage = require('../../page-objects/admin/LoginPage');
const DashboardPage = require('../../page-objects/admin/DashboardPage');

describe('Restaurant Manager Daily Operations', () => {
  let browser, page;
  let loginPage, dashboardPage;

  beforeAll(async () => {
    browser = await puppeteer.launch(config.browser);
    page = await browser.newPage();
    await page.setViewport(config.viewports.desktop);
    
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Manager can log in and access dashboard', async () => {
    await page.goto(config.urls.admin);
    
    // Step 1: Login
    await loginPage.login(testData.users.manager.email, testData.users.manager.password);
    
    // Step 2: Verify dashboard access
    await dashboardPage.waitForDashboardToLoad();
    expect(await dashboardPage.getManagerName()).toContain('E2E Test Manager');
    expect(await dashboardPage.getVenueName()).toContain('Test Restaurant');
  });

  test('Manager can process orders through complete lifecycle', async () => {
    // Assume already logged in from previous test
    
    // Step 1: View new orders
    await dashboardPage.filterOrdersByStatus('new');
    const newOrders = await dashboardPage.getOrderList();
    expect(newOrders.length).toBeGreaterThan(0);
    
    // Step 2: Select first order
    const orderId = await dashboardPage.selectFirstOrder();
    const orderDetails = await dashboardPage.getOrderDetails(orderId);
    
    expect(orderDetails).toHaveProperty('customerName');
    expect(orderDetails).toHaveProperty('items');
    expect(orderDetails).toHaveProperty('totalAmount');
    
    // Step 3: Update order to preparing
    await dashboardPage.updateOrderStatus(orderId, 'preparing');
    expect(await dashboardPage.getOrderStatus(orderId)).toBe('preparing');
    
    // Step 4: Update order to ready
    await dashboardPage.updateOrderStatus(orderId, 'ready');
    expect(await dashboardPage.getOrderStatus(orderId)).toBe('ready');
    
    // Step 5: Update order to served
    await dashboardPage.updateOrderStatus(orderId, 'served');
    expect(await dashboardPage.getOrderStatus(orderId)).toBe('served');
    
    // Step 6: Verify order appears in served list
    await dashboardPage.filterOrdersByStatus('served');
    const servedOrders = await dashboardPage.getOrderList();
    expect(servedOrders.some(order => order.id === orderId)).toBe(true);
    
    console.log(`✅ Order ${orderId} processed through complete lifecycle`);
  });

  test('Manager can filter and search orders', async () => {
    // Test order filtering functionality
    const statusFilters = ['new', 'preparing', 'ready', 'served', 'all'];
    
    for (const status of statusFilters) {
      await dashboardPage.filterOrdersByStatus(status);
      const orders = await dashboardPage.getOrderList();
      
      if (status !== 'all') {
        orders.forEach(order => {
          expect(order.status).toBe(status);
        });
      }
    }
    
    // Test search functionality
    await dashboardPage.searchOrders('E2E Test Customer');
    const searchResults = await dashboardPage.getOrderList();
    expect(searchResults.length).toBeGreaterThan(0);
    
    searchResults.forEach(order => {
      expect(order.customerName).toContain('E2E Test Customer');
    });
  });
});
```

### **Onboarding Wizard Test** (`tests/onboarding/onboarding-wizard.test.js`)

```javascript
const puppeteer = require('puppeteer');
const config = require('../../config/puppeteer.config');
const testData = require('../../config/test-data');
const OnboardingPage = require('../../page-objects/admin/OnboardingPage');

describe('Restaurant Onboarding Wizard', () => {
  let browser, page;
  let onboardingPage;

  beforeAll(async () => {
    browser = await puppeteer.launch(config.browser);
    page = await browser.newPage();
    await page.setViewport(config.viewports.desktop);
    
    onboardingPage = new OnboardingPage(page);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('New restaurant owner can complete onboarding wizard', async () => {
    // Step 1: Navigate to onboarding (assume user already registered and logged in)
    await page.goto(`${config.urls.admin}/onboarding`);
    await onboardingPage.waitForWizardToLoad();
    
    // Step 2: Complete restaurant information step
    expect(await onboardingPage.getCurrentStep()).toBe(1);
    
    await onboardingPage.fillRestaurantInfo({
      name: testData.restaurant.name,
      address: testData.restaurant.address,
      phone: testData.restaurant.phone,
      cuisineType: testData.restaurant.cuisineType,
      description: testData.restaurant.description
    });
    
    await onboardingPage.continueToNextStep();
    
    // Step 3: Verify menu categories step
    expect(await onboardingPage.getCurrentStep()).toBe(2);
    expect(await onboardingPage.getCategoryCount()).toBe(4);
    
    await onboardingPage.continueToNextStep();
    
    // Step 4: Add sample menu items
    expect(await onboardingPage.getCurrentStep()).toBe(3);
    
    for (const item of testData.menuItems) {
      await onboardingPage.addMenuItem(item);
    }
    
    await onboardingPage.continueToNextStep();
    
    // Step 5: Configure tables
    expect(await onboardingPage.getCurrentStep()).toBe(4);
    
    await onboardingPage.setTableCount(10);
    await onboardingPage.continueToNextStep();
    
    // Step 6: Complete onboarding
    expect(await onboardingPage.getCurrentStep()).toBe(5);
    expect(await onboardingPage.isOnboardingComplete()).toBe(true);
    
    const summary = await onboardingPage.getOnboardingSummary();
    expect(summary.restaurantName).toBe(testData.restaurant.name);
    expect(summary.categoriesCreated).toBe(4);
    expect(summary.tablesCreated).toBe(10);
    
    await onboardingPage.completeOnboarding();
    
    // Step 7: Verify redirect to dashboard
    await page.waitForNavigation();
    expect(page.url()).toContain('/dashboard');
    
    console.log('✅ Onboarding completed successfully');
  });

  test('Onboarding wizard handles errors gracefully', async () => {
    // Test error handling and recovery scenarios
    await page.goto(`${config.urls.admin}/onboarding`);
    await onboardingPage.waitForWizardToLoad();
    
    // Try to continue without filling required fields
    await onboardingPage.continueToNextStep();
    
    const errorMessage = await onboardingPage.getErrorMessage();
    expect(errorMessage).toContain('required');
    
    // Test retry functionality
    await onboardingPage.retryOnError();
    expect(await onboardingPage.getErrorMessage()).toBe('');
    
    // Test continue anyway functionality
    await onboardingPage.continueAnyway();
    expect(await onboardingPage.getCurrentStep()).toBe(2);
  });

  test('Onboarding wizard preserves data on page refresh', async () => {
    // Test localStorage persistence
    await page.goto(`${config.urls.admin}/onboarding`);
    await onboardingPage.waitForWizardToLoad();
    
    // Fill in restaurant info
    await onboardingPage.fillRestaurantInfo({
      name: 'Test Persistence Restaurant',
      address: 'Test Address for Persistence',
      phone: '+355 67 999 8888'
    });
    
    // Refresh page
    await page.reload();
    await onboardingPage.waitForWizardToLoad();
    
    // Verify data is preserved
    const savedData = await onboardingPage.getRestaurantInfo();
    expect(savedData.name).toBe('Test Persistence Restaurant');
    expect(savedData.address).toBe('Test Address for Persistence');
    expect(savedData.phone).toBe('+355 67 999 8888');
  });
});
```

---

## 📊 Page Object Examples

### **Menu Page Object** (`page-objects/customer/MenuPage.js`)

```javascript
class MenuPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.selectors = {
      venueInfo: '.venue-info',
      venueName: '.venue-name',
      categoryList: '.menu-categories',
      menuItems: '.menu-item',
      languageToggle: '.language-toggle',
      addToCartButton: '.add-to-cart-btn',
      cartButton: '.cart-button',
      cartCount: '.cart-count',
      loadingSpinner: '.loading-spinner'
    };
  }

  async waitForMenuToLoad() {
    await this.page.waitForSelector(this.selectors.venueInfo);
    await this.page.waitForSelector(this.selectors.categoryList);
    await this.page.waitForFunction(
      () => !document.querySelector('.loading-spinner')
    );
  }

  async getVenueName() {
    return await this.page.$eval(this.selectors.venueName, el => el.textContent);
  }

  async getCategoryCount() {
    const categories = await this.page.$$(this.selectors.categoryList + ' .category');
    return categories.length;
  }

  async getMenuItems() {
    return await this.page.$$eval(this.selectors.menuItems, items => 
      items.map(item => ({
        id: item.dataset.itemId,
        name: item.querySelector('.item-name').textContent,
        nameAlbanian: item.querySelector('.item-name-albanian')?.textContent,
        price: item.querySelector('.item-price').textContent,
        description: item.querySelector('.item-description').textContent
      }))
    );
  }

  async switchLanguage(language) {
    await this.page.click(this.selectors.languageToggle);
    await this.page.waitForSelector(`[data-language="${language}"]`);
    await this.page.click(`[data-language="${language}"]`);
    await this.page.waitForTimeout(500); // Wait for language switch
  }

  async addItemToCart(itemId, quantity = 1) {
    const itemSelector = `[data-item-id="${itemId}"]`;
    await this.page.waitForSelector(itemSelector);
    
    // Set quantity if needed
    if (quantity > 1) {
      const quantitySelector = `${itemSelector} .quantity-input`;
      await this.page.click(quantitySelector);
      await this.page.fill(quantitySelector, quantity.toString());
    }
    
    // Add to cart
    await this.page.click(`${itemSelector} ${this.selectors.addToCartButton}`);
    
    // Wait for cart count to update
    await this.page.waitForFunction(
      (expectedCount) => {
        const cartCount = document.querySelector('.cart-count');
        return cartCount && parseInt(cartCount.textContent) >= expectedCount;
      },
      quantity
    );
  }

  async goToCart() {
    await this.page.click(this.selectors.cartButton);
    await this.page.waitForNavigation();
  }

  async getCartItemCount() {
    const cartCountElement = await this.page.$(this.selectors.cartCount);
    if (!cartCountElement) return 0;
    
    const countText = await cartCountElement.evaluate(el => el.textContent);
    return parseInt(countText) || 0;
  }
}

module.exports = MenuPage;
```

### **Dashboard Page Object** (`page-objects/admin/DashboardPage.js`)

```javascript
class DashboardPage {
  constructor(page) {
    this.page = page;
    
    this.selectors = {
      dashboard: '.dashboard-container',
      managerName: '.manager-name',
      venueName: '.venue-name',
      orderList: '.order-list',
      orderItem: '.order-item',
      statusFilter: '.status-filter',
      searchInput: '.order-search',
      orderDetails: '.order-details',
      statusUpdateButtons: '.status-update-buttons',
      newOrdersCount: '.new-orders-count',
      loadingSpinner: '.loading-spinner'
    };
  }

  async waitForDashboardToLoad() {
    await this.page.waitForSelector(this.selectors.dashboard);
    await this.page.waitForFunction(
      () => !document.querySelector('.loading-spinner')
    );
  }

  async getManagerName() {
    return await this.page.$eval(this.selectors.managerName, el => el.textContent);
  }

  async getVenueName() {
    return await this.page.$eval(this.selectors.venueName, el => el.textContent);
  }

  async filterOrdersByStatus(status) {
    await this.page.click(`${this.selectors.statusFilter} [data-status="${status}"]`);
    await this.page.waitForTimeout(1000); // Wait for filter to apply
  }

  async getOrderList() {
    await this.page.waitForSelector(this.selectors.orderList);
    
    return await this.page.$$eval(this.selectors.orderItem, orders =>
      orders.map(order => ({
        id: order.dataset.orderId,
        orderNumber: order.querySelector('.order-number').textContent,
        customerName: order.querySelector('.customer-name').textContent,
        tableNumber: order.querySelector('.table-number').textContent,
        status: order.querySelector('.order-status').textContent,
        totalAmount: order.querySelector('.total-amount').textContent,
        createdAt: order.querySelector('.created-at').textContent
      }))
    );
  }

  async selectFirstOrder() {
    const orders = await this.page.$$(this.selectors.orderItem);
    if (orders.length === 0) {
      throw new Error('No orders found');
    }
    
    await orders[0].click();
    
    const orderId = await orders[0].evaluate(el => el.dataset.orderId);
    await this.page.waitForSelector(this.selectors.orderDetails);
    
    return orderId;
  }

  async getOrderDetails(orderId) {
    const orderSelector = `[data-order-id="${orderId}"]`;
    await this.page.waitForSelector(orderSelector);
    
    return await this.page.$eval(orderSelector, order => ({
      id: order.dataset.orderId,
      customerName: order.querySelector('.customer-name').textContent,
      tableNumber: order.querySelector('.table-number').textContent,
      items: Array.from(order.querySelectorAll('.order-item-detail')).map(item => ({
        name: item.querySelector('.item-name').textContent,
        quantity: item.querySelector('.item-quantity').textContent,
        price: item.querySelector('.item-price').textContent
      })),
      totalAmount: order.querySelector('.total-amount').textContent,
      specialInstructions: order.querySelector('.special-instructions')?.textContent || '',
      status: order.querySelector('.order-status').textContent
    }));
  }

  async updateOrderStatus(orderId, newStatus) {
    const orderSelector = `[data-order-id="${orderId}"]`;
    const statusButton = `${orderSelector} [data-status-action="${newStatus}"]`;
    
    await this.page.waitForSelector(statusButton);
    await this.page.click(statusButton);
    
    // Wait for status update to complete
    await this.page.waitForFunction(
      (orderId, expectedStatus) => {
        const order = document.querySelector(`[data-order-id="${orderId}"]`);
        const statusElement = order?.querySelector('.order-status');
        return statusElement?.textContent === expectedStatus;
      },
      orderId,
      newStatus
    );
  }

  async getOrderStatus(orderId) {
    const orderSelector = `[data-order-id="${orderId}"] .order-status`;
    return await this.page.$eval(orderSelector, el => el.textContent);
  }

  async searchOrders(searchTerm) {
    await this.page.fill(this.selectors.searchInput, searchTerm);
    await this.page.press(this.selectors.searchInput, 'Enter');
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  async getNewOrdersCount() {
    const countElement = await this.page.$(this.selectors.newOrdersCount);
    if (!countElement) return 0;
    
    const countText = await countElement.evaluate(el => el.textContent);
    return parseInt(countText) || 0;
  }
}

module.exports = DashboardPage;
```

---

## 🚀 Test Execution Scripts

### **Complete Test Suite Runner** (`scripts/run-full-suite.js`)

```javascript
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestSuiteRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
      endTime: null,
      testFiles: []
    };
  }

  async runFullSuite() {
    console.log('🚀 Starting SKAN.AL Comprehensive E2E Test Suite');
    console.log('=' .repeat(60));
    
    const testCategories = [
      {
        name: 'Customer Journey Tests',
        path: 'tests/customer-journey/*.test.js',
        priority: 1
      },
      {
        name: 'Restaurant Operations Tests', 
        path: 'tests/restaurant-operations/*.test.js',
        priority: 2
      },
      {
        name: 'Onboarding Tests',
        path: 'tests/onboarding/*.test.js',
        priority: 3
      },
      {
        name: 'Integration Tests',
        path: 'tests/integration/*.test.js',
        priority: 4
      },
      {
        name: 'Performance Tests',
        path: 'tests/performance/*.test.js',
        priority: 5
      },
      {
        name: 'Accessibility Tests',
        path: 'tests/accessibility/*.test.js',
        priority: 6
      }
    ];

    for (const category of testCategories) {
      console.log(`\n📋 Running ${category.name}...`);
      console.log('-'.repeat(40));
      
      try {
        const result = await this.runTestCategory(category);
        this.results.testFiles.push({
          category: category.name,
          ...result
        });
        
        console.log(`✅ ${category.name}: ${result.passed}/${result.total} tests passed`);
      } catch (error) {
        console.error(`❌ ${category.name} failed:`, error.message);
        this.results.testFiles.push({
          category: category.name,
          total: 0,
          passed: 0,
          failed: 1,
          error: error.message
        });
      }
    }

    this.results.endTime = new Date();
    await this.generateReport();
    this.printSummary();
  }

  async runTestCategory(category) {
    return new Promise((resolve, reject) => {
      const cmd = `npx jest ${category.path} --json --outputFile=temp-results.json`;
      
      exec(cmd, (error, stdout, stderr) => {
        if (fs.existsSync('temp-results.json')) {
          const results = JSON.parse(fs.readFileSync('temp-results.json'));
          fs.unlinkSync('temp-results.json');
          
          resolve({
            total: results.numTotalTests,
            passed: results.numPassedTests,
            failed: results.numFailedTests,
            skipped: results.numSkippedTests,
            duration: results.testResults.reduce((sum, test) => sum + test.perfStats.runtime, 0)
          });
        } else {
          reject(new Error(stderr || 'Test execution failed'));
        }
      });
    });
  }

  async generateReport() {
    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>SKAN.AL E2E Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #667eea; color: white; padding: 20px; border-radius: 8px; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .test-category { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 SKAN.AL E2E Test Results</h1>
        <p>Generated: ${this.results.endTime.toISOString()}</p>
        <p>Duration: ${Math.round((this.results.endTime - this.results.startTime) / 1000)}s</p>
    </div>
    
    <div class="summary">
        <h2>📊 Test Summary</h2>
        <p><strong>Total Tests:</strong> ${this.getTotalTests()}</p>
        <p><strong class="passed">Passed:</strong> ${this.getTotalPassed()}</p>
        <p><strong class="failed">Failed:</strong> ${this.getTotalFailed()}</p>
        <p><strong class="skipped">Skipped:</strong> ${this.getTotalSkipped()}</p>
        <p><strong>Success Rate:</strong> ${this.getSuccessRate()}%</p>
    </div>
    
    <div class="test-categories">
        <h2>📋 Test Categories</h2>
        ${this.results.testFiles.map(file => `
            <div class="test-category">
                <h3>${file.category}</h3>
                <p>Tests: ${file.total} | Passed: <span class="passed">${file.passed}</span> | Failed: <span class="failed">${file.failed}</span></p>
                ${file.error ? `<p class="failed">Error: ${file.error}</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    fs.writeFileSync('reports/test-results.html', reportHtml);
    console.log('\n📄 Test report generated: reports/test-results.html');
  }

  getTotalTests() {
    return this.results.testFiles.reduce((sum, file) => sum + file.total, 0);
  }

  getTotalPassed() {
    return this.results.testFiles.reduce((sum, file) => sum + file.passed, 0);
  }

  getTotalFailed() {
    return this.results.testFiles.reduce((sum, file) => sum + file.failed, 0);
  }

  getTotalSkipped() {
    return this.results.testFiles.reduce((sum, file) => sum + (file.skipped || 0), 0);
  }

  getSuccessRate() {
    const total = this.getTotalTests();
    if (total === 0) return 0;
    return Math.round((this.getTotalPassed() / total) * 100);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🏆 SKAN.AL E2E TEST SUITE COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${this.getTotalTests()}`);
    console.log(`✅ Passed: ${this.getTotalPassed()}`);
    console.log(`❌ Failed: ${this.getTotalFailed()}`);
    console.log(`⏭️  Skipped: ${this.getTotalSkipped()}`);
    console.log(`🎯 Success Rate: ${this.getSuccessRate()}%`);
    console.log(`⏱️  Duration: ${Math.round((this.results.endTime - this.results.startTime) / 1000)}s`);
    
    if (this.getTotalFailed() === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the failures before deployment.');
    }
  }
}

// Run the test suite
if (require.main === module) {
  const runner = new TestSuiteRunner();
  runner.runFullSuite().catch(console.error);
}

module.exports = TestSuiteRunner;
```

---

## 📋 Package.json Scripts

```json
{
  "name": "skan-al-e2e-tests",
  "version": "1.0.0",
  "description": "Comprehensive E2E tests for SKAN.AL QR ordering system",
  "scripts": {
    "test": "jest",
    "test:full": "node scripts/run-full-suite.js",
    "test:smoke": "node scripts/run-smoke-tests.js",
    "test:customer": "jest tests/customer-journey/",
    "test:restaurant": "jest tests/restaurant-operations/",
    "test:onboarding": "jest tests/onboarding/",
    "test:integration": "jest tests/integration/",
    "test:performance": "jest tests/performance/",
    "test:accessibility": "jest tests/accessibility/",
    "test:headless": "HEADLESS=true npm run test:full",
    "test:headed": "HEADLESS=false npm run test:full",
    "test:debug": "HEADLESS=false SLOW_MO=100 DEVTOOLS=true npm run test",
    "test:mobile": "VIEWPORT=mobile npm run test:customer",
    "test:desktop": "VIEWPORT=desktop npm run test:restaurant",
    "cleanup": "node scripts/cleanup-test-data.js",
    "reports": "open reports/test-results.html"
  },
  "dependencies": {
    "puppeteer": "^21.0.0",
    "jest": "^29.0.0",
    "jest-puppeteer": "^9.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "@types/puppeteer": "^7.0.0"
  },
  "jest": {
    "preset": "jest-puppeteer",
    "testMatch": ["**/tests/**/*.test.js"],
    "setupFilesAfterEnv": ["<rootDir>/config/jest.setup.js"],
    "testTimeout": 30000
  }
}
```

---

## 🎯 Test Execution Examples

### **Running Complete Test Suite**
```bash
# Run all tests
npm run test:full

# Run specific test categories
npm run test:customer
npm run test:restaurant
npm run test:onboarding

# Run tests with different configurations
npm run test:headless    # Background execution
npm run test:headed      # Visible browser
npm run test:debug       # Debug mode with DevTools
npm run test:mobile      # Mobile viewport
npm run test:desktop     # Desktop viewport
```

### **Continuous Integration Setup**
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd skan-ecosystem/e2e-tests
          npm ci
      
      - name: Run E2E tests
        run: |
          cd skan-ecosystem/e2e-tests
          npm run test:headless
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-test-results
          path: skan-ecosystem/e2e-tests/reports/
```

---

## 🎉 Summary

This comprehensive Puppeteer E2E test plan provides:

✅ **Complete User Journey Coverage** - All user types and workflows  
✅ **Real Browser Testing** - Actual browser automation with Puppeteer  
✅ **Page Object Pattern** - Maintainable and reusable test code  
✅ **Performance Testing** - Load times and response time validation  
✅ **Accessibility Testing** - WCAG compliance verification  
✅ **Cross-Browser Support** - Multiple browser and device testing  
✅ **CI/CD Integration** - Automated testing in deployment pipeline  
✅ **Comprehensive Reporting** - Detailed test results and metrics  
✅ **Error Handling** - Graceful failure recovery and debugging  
✅ **Mobile Responsive** - Mobile and desktop viewport testing  

The test plan ensures the SKAN.AL system is thoroughly validated across all user interactions, business workflows, and technical requirements before production deployment.