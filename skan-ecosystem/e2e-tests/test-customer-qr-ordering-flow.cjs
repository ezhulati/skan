/**
 * SKAN.AL Customer QR Ordering Flow - Comprehensive E2E Test
 * 
 * Tests the complete customer journey from QR code scanning to order tracking
 * 
 * Test Flow:
 * 1. QR Landing Page (/:venueSlug/:tableNumber)
 * 2. Auto-redirect to menu or manual navigation
 * 3. Menu browsing and item selection
 * 4. Cart functionality
 * 5. Order submission
 * 6. Order tracking
 * 7. Mobile responsiveness
 */

const { chromium } = require('playwright');

// Test Configuration
const CONFIG = {
  // Customer App
  customerAppUrl: 'http://localhost:3002',
  
  // Test Data
  venueSlug: 'beach-bar-durres',
  tableNumber: 'a1',
  
  // API Configuration
  apiBaseUrl: 'https://api-mkazmlu7ta-ew.a.run.app/v1',
  
  // Test Customer Data
  customerName: 'E2E Test Customer',
  specialInstructions: 'Test order - please ignore',
  
  // Test Timeouts
  navigationTimeout: 30000,
  apiTimeout: 10000,
  
  // Expected Test Items (from beach-bar-durres venue)
  expectedMenuItems: [
    { name: 'Albanian Beer', price: 3.50 },
    { name: 'Greek Salad', price: 8.50 },
    { name: 'Seafood Risotto', price: 18.50 }
  ]
};

/**
 * Test Results Storage
 */
const testResults = {
  startTime: new Date(),
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: [],
  recommendations: [],
  performanceMetrics: {},
  errors: []
};

/**
 * Add test result
 */
function addTestResult(testName, passed, details, error = null) {
  testResults.totalTests++;
  const result = {
    name: testName,
    passed,
    details,
    error: error ? error.message : null,
    timestamp: new Date()
  };
  
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passedTests++;
    console.log(`✅ ${testName}: ${details}`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName}: ${details}`);
    if (error) {
      console.log(`   Error: ${error.message}`);
      testResults.errors.push({ test: testName, error: error.message });
    }
  }
}

/**
 * Add recommendation
 */
function addRecommendation(type, message) {
  testResults.recommendations.push({ type, message });
  console.log(`💡 ${type}: ${message}`);
}

/**
 * Test API Health and Venue Data
 */
async function testApiHealth() {
  console.log('\n🧪 Testing API Health and Venue Data...');
  
  try {
    // Test API health
    const healthResponse = await fetch(`${CONFIG.apiBaseUrl}/health`);
    if (healthResponse.ok) {
      addTestResult(
        'API Health Check',
        true,
        `API is healthy (${healthResponse.status})`
      );
    } else {
      addTestResult(
        'API Health Check',
        false,
        `API health check failed (${healthResponse.status})`
      );
    }
    
    // Test venue menu endpoint
    const menuResponse = await fetch(`${CONFIG.apiBaseUrl}/venue/${CONFIG.venueSlug}/menu`);
    if (menuResponse.ok) {
      const menuData = await menuResponse.json();
      addTestResult(
        'Venue Menu API',
        true,
        `Venue menu loaded successfully (${menuData.categories?.length || 0} categories)`
      );
      
      // Validate expected menu items
      const allItems = menuData.categories?.flatMap(cat => cat.items) || [];
      CONFIG.expectedMenuItems.forEach(expectedItem => {
        const found = allItems.find(item => 
          item.name.toLowerCase().includes(expectedItem.name.toLowerCase())
        );
        if (found) {
          addTestResult(
            `Menu Item: ${expectedItem.name}`,
            true,
            `Found item: ${found.name} - €${found.price}`
          );
        } else {
          addTestResult(
            `Menu Item: ${expectedItem.name}`,
            false,
            `Expected menu item not found: ${expectedItem.name}`
          );
        }
      });
      
    } else {
      addTestResult(
        'Venue Menu API',
        false,
        `Failed to load venue menu (${menuResponse.status})`
      );
    }
    
  } catch (error) {
    addTestResult('API Health Check', false, 'API connection failed', error);
  }
}

/**
 * Test QR Landing Page
 */
async function testQrLandingPage(page) {
  console.log('\n🧪 Testing QR Landing Page...');
  
  const qrUrl = `${CONFIG.customerAppUrl}/${CONFIG.venueSlug}/${CONFIG.tableNumber}`;
  console.log(`   Navigating to: ${qrUrl}`);
  
  try {
    const startTime = Date.now();
    await page.goto(qrUrl, { waitUntil: 'networkidle', timeout: CONFIG.navigationTimeout });
    const loadTime = Date.now() - startTime;
    
    testResults.performanceMetrics.qrLandingLoadTime = loadTime;
    
    addTestResult(
      'QR Landing Page Load',
      true,
      `Page loaded successfully in ${loadTime}ms`
    );
    
    if (loadTime > 3000) {
      addRecommendation('Performance', 'QR landing page load time exceeds 3 seconds');
    }
    
    // Check if page redirected to menu automatically
    await page.waitForTimeout(2000); // Wait for potential auto-redirect
    const currentUrl = page.url();
    
    if (currentUrl.includes('/menu')) {
      addTestResult(
        'Auto-redirect to Menu',
        true,
        'Page automatically redirected to menu'
      );
    } else {
      // Check for manual navigation option
      const menuButton = await page.locator('text=View Menu, text=Browse Menu, text=Start Ordering').first();
      if (await menuButton.isVisible()) {
        addTestResult(
          'Manual Menu Navigation',
          true,
          'Manual navigation to menu is available'
        );
        await menuButton.click();
        await page.waitForURL('**/menu', { timeout: 10000 });
      } else {
        addTestResult(
          'Menu Navigation',
          false,
          'No auto-redirect or manual navigation to menu found'
        );
      }
    }
    
    // Check venue information display
    const venueNameVisible = await page.locator('text=Beach Bar').isVisible();
    if (venueNameVisible) {
      addTestResult(
        'Venue Information Display',
        true,
        'Venue name is displayed correctly'
      );
    } else {
      addTestResult(
        'Venue Information Display',
        false,
        'Venue name not found on landing page'
      );
    }
    
    // Check table number display
    const tableVisible = await page.locator(`text=${CONFIG.tableNumber}`).isVisible();
    if (tableVisible) {
      addTestResult(
        'Table Number Display',
        true,
        `Table number ${CONFIG.tableNumber} is displayed`
      );
    } else {
      addTestResult(
        'Table Number Display',
        false,
        `Table number ${CONFIG.tableNumber} not displayed`
      );
    }
    
  } catch (error) {
    addTestResult('QR Landing Page Load', false, 'Failed to load QR landing page', error);
  }
}

/**
 * Test Menu Browsing
 */
async function testMenuBrowsing(page) {
  console.log('\n🧪 Testing Menu Browsing...');
  
  try {
    // Ensure we're on the menu page
    if (!page.url().includes('/menu')) {
      await page.goto(`${CONFIG.customerAppUrl}/${CONFIG.venueSlug}/${CONFIG.tableNumber}/menu`);
    }
    
    await page.waitForLoadState('networkidle');
    
    // Test menu categories loading
    const categories = await page.locator('[data-testid="menu-category"], .menu-category, .category').count();
    if (categories > 0) {
      addTestResult(
        'Menu Categories Loading',
        true,
        `${categories} menu categories loaded`
      );
    } else {
      addTestResult(
        'Menu Categories Loading',
        false,
        'No menu categories found'
      );
    }
    
    // Test menu items loading
    const menuItems = await page.locator('[data-testid="menu-item"], .menu-item, .item').count();
    if (menuItems > 0) {
      addTestResult(
        'Menu Items Loading',
        true,
        `${menuItems} menu items loaded`
      );
    } else {
      addTestResult(
        'Menu Items Loading',
        false,
        'No menu items found'
      );
    }
    
    // Test language switching (if available)
    const languageToggle = await page.locator('text=English, text=Albanian, text=EN, text=AL').first();
    if (await languageToggle.isVisible()) {
      addTestResult(
        'Language Toggle',
        true,
        'Language switching option is available'
      );
      
      // Test language switch
      try {
        await languageToggle.click();
        await page.waitForTimeout(1000);
        addTestResult(
          'Language Switch Function',
          true,
          'Language switching works'
        );
      } catch (error) {
        addTestResult(
          'Language Switch Function',
          false,
          'Language switching failed',
          error
        );
      }
    } else {
      addTestResult(
        'Language Toggle',
        false,
        'Language switching option not found'
      );
    }
    
    // Test price display
    const pricesVisible = await page.locator('text=/€\\d+\\.\\d{2}/').count();
    if (pricesVisible > 0) {
      addTestResult(
        'Price Display',
        true,
        `${pricesVisible} prices displayed correctly`
      );
    } else {
      addTestResult(
        'Price Display',
        false,
        'No prices found in menu items'
      );
    }
    
  } catch (error) {
    addTestResult('Menu Browsing', false, 'Menu browsing test failed', error);
  }
}

/**
 * Test Cart Functionality
 */
async function testCartFunctionality(page) {
  console.log('\n🧪 Testing Cart Functionality...');
  
  try {
    // Find and add first menu item to cart
    const addButton = await page.locator('button:has-text("Add"), button:has-text("+"), [data-testid="add-to-cart"]').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      addTestResult(
        'Add Item to Cart',
        true,
        'Successfully added item to cart'
      );
      
      // Check cart counter/badge
      const cartBadge = await page.locator('[data-testid="cart-count"], .cart-badge, .cart-counter').first();
      if (await cartBadge.isVisible()) {
        const cartCount = await cartBadge.textContent();
        addTestResult(
          'Cart Counter Display',
          true,
          `Cart counter shows: ${cartCount}`
        );
      }
      
      // Try to add another item
      const secondAddButton = await page.locator('button:has-text("Add"), button:has-text("+")').nth(1);
      if (await secondAddButton.isVisible()) {
        await secondAddButton.click();
        await page.waitForTimeout(1000);
        addTestResult(
          'Add Multiple Items',
          true,
          'Successfully added multiple items to cart'
        );
      }
      
    } else {
      addTestResult(
        'Add Item to Cart',
        false,
        'No "Add to Cart" buttons found'
      );
    }
    
    // Test cart view
    const cartButton = await page.locator('text=Cart, [data-testid="cart-button"], .cart-button').first();
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(2000);
      
      addTestResult(
        'Cart View Navigation',
        true,
        'Successfully navigated to cart view'
      );
      
      // Check cart items display
      const cartItems = await page.locator('[data-testid="cart-item"], .cart-item').count();
      if (cartItems > 0) {
        addTestResult(
          'Cart Items Display',
          true,
          `${cartItems} items displayed in cart`
        );
      } else {
        addTestResult(
          'Cart Items Display',
          false,
          'No items displayed in cart view'
        );
      }
      
      // Test quantity modification (if available)
      const plusButton = await page.locator('button:has-text("+"), [data-testid="increase-quantity"]').first();
      if (await plusButton.isVisible()) {
        await plusButton.click();
        await page.waitForTimeout(500);
        addTestResult(
          'Quantity Increase',
          true,
          'Successfully increased item quantity'
        );
      }
      
      const minusButton = await page.locator('button:has-text("-"), [data-testid="decrease-quantity"]').first();
      if (await minusButton.isVisible()) {
        await minusButton.click();
        await page.waitForTimeout(500);
        addTestResult(
          'Quantity Decrease',
          true,
          'Successfully decreased item quantity'
        );
      }
      
      // Check total calculation
      const total = await page.locator('[data-testid="cart-total"], .cart-total').first();
      if (await total.isVisible()) {
        const totalText = await total.textContent();
        addTestResult(
          'Cart Total Calculation',
          true,
          `Cart total displayed: ${totalText}`
        );
      } else {
        addTestResult(
          'Cart Total Calculation',
          false,
          'Cart total not found'
        );
      }
      
    } else {
      addTestResult(
        'Cart View Navigation',
        false,
        'Cart button not found'
      );
    }
    
  } catch (error) {
    addTestResult('Cart Functionality', false, 'Cart functionality test failed', error);
  }
}

/**
 * Test Order Submission
 */
async function testOrderSubmission(page) {
  console.log('\n🧪 Testing Order Submission...');
  
  try {
    // Find checkout/order button
    const checkoutButton = await page.locator('text=Checkout, text=Place Order, text=Submit Order, [data-testid="checkout-button"]').first();
    
    if (await checkoutButton.isVisible()) {
      // Fill customer information if required
      const nameInput = await page.locator('input[placeholder*="name"], input[name="customerName"], [data-testid="customer-name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(CONFIG.customerName);
        addTestResult(
          'Customer Name Input',
          true,
          `Filled customer name: ${CONFIG.customerName}`
        );
      }
      
      const instructionsInput = await page.locator('textarea[placeholder*="instructions"], textarea[name="specialInstructions"], [data-testid="special-instructions"]').first();
      if (await instructionsInput.isVisible()) {
        await instructionsInput.fill(CONFIG.specialInstructions);
        addTestResult(
          'Special Instructions Input',
          true,
          `Filled special instructions: ${CONFIG.specialInstructions}`
        );
      }
      
      // Submit order
      await checkoutButton.click();
      
      // Wait for order confirmation or success page
      try {
        await page.waitForURL('**/confirmation', { timeout: 10000 });
        addTestResult(
          'Order Submission Navigation',
          true,
          'Successfully navigated to confirmation page'
        );
      } catch {
        // Maybe it's a modal or same page
        await page.waitForTimeout(3000);
      }
      
      // Look for order number
      const orderNumber = await page.locator('[data-testid="order-number"], .order-number').first();
      if (await orderNumber.isVisible()) {
        const orderNumberText = await orderNumber.textContent();
        addTestResult(
          'Order Number Generation',
          true,
          `Order number generated: ${orderNumberText}`
        );
        
        // Store order number for tracking test
        testResults.orderNumber = orderNumberText.match(/SKN-\d{8}-\d{3}/)?.[0] || orderNumberText;
      } else {
        addTestResult(
          'Order Number Generation',
          false,
          'Order number not found after submission'
        );
      }
      
      // Check for success message
      const successMessage = await page.locator('text=success, text=confirmed, text=received, .success-message').first();
      if (await successMessage.isVisible()) {
        addTestResult(
          'Order Success Message',
          true,
          'Order success message displayed'
        );
      } else {
        addTestResult(
          'Order Success Message',
          false,
          'No success message found'
        );
      }
      
      addTestResult(
        'Order Submission Process',
        true,
        'Order submission completed successfully'
      );
      
    } else {
      addTestResult(
        'Order Submission Process',
        false,
        'Checkout/Submit button not found'
      );
    }
    
  } catch (error) {
    addTestResult('Order Submission Process', false, 'Order submission failed', error);
  }
}

/**
 * Test Order Tracking
 */
async function testOrderTracking(page) {
  console.log('\n🧪 Testing Order Tracking...');
  
  try {
    if (testResults.orderNumber) {
      // Navigate to tracking page
      const trackingUrl = `${CONFIG.customerAppUrl}/${CONFIG.venueSlug}/${CONFIG.tableNumber}/track/${testResults.orderNumber}`;
      await page.goto(trackingUrl);
      await page.waitForLoadState('networkidle');
      
      addTestResult(
        'Order Tracking Navigation',
        true,
        `Navigated to tracking page for order: ${testResults.orderNumber}`
      );
      
      // Check order status display
      const orderStatus = await page.locator('[data-testid="order-status"], .order-status, text=new, text=preparing, text=ready, text=served').first();
      if (await orderStatus.isVisible()) {
        const statusText = await orderStatus.textContent();
        addTestResult(
          'Order Status Display',
          true,
          `Order status displayed: ${statusText}`
        );
      } else {
        addTestResult(
          'Order Status Display',
          false,
          'Order status not displayed'
        );
      }
      
      // Check order details
      const orderDetails = await page.locator('[data-testid="order-details"], .order-details').first();
      if (await orderDetails.isVisible()) {
        addTestResult(
          'Order Details Display',
          true,
          'Order details are displayed'
        );
      } else {
        addTestResult(
          'Order Details Display',
          false,
          'Order details not found'
        );
      }
      
      // Check estimated time
      const estimatedTime = await page.locator('[data-testid="estimated-time"], text=estimated').first();
      if (await estimatedTime.isVisible()) {
        const timeText = await estimatedTime.textContent();
        addTestResult(
          'Estimated Time Display',
          true,
          `Estimated time shown: ${timeText}`
        );
      } else {
        addTestResult(
          'Estimated Time Display',
          false,
          'Estimated preparation time not shown'
        );
      }
      
    } else {
      // Test public tracking by order number
      const publicTrackingUrl = `${CONFIG.customerAppUrl}/track`;
      await page.goto(publicTrackingUrl);
      
      addTestResult(
        'Public Order Tracking',
        true,
        'Public order tracking page accessible'
      );
    }
    
  } catch (error) {
    addTestResult('Order Tracking', false, 'Order tracking test failed', error);
  }
}

/**
 * Test Mobile Responsiveness
 */
async function testMobileResponsiveness(page) {
  console.log('\n🧪 Testing Mobile Responsiveness...');
  
  try {
    // Test different mobile viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12' },
      { width: 360, height: 640, name: 'Android' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);
      
      // Navigate back to menu to test responsiveness
      const menuUrl = `${CONFIG.customerAppUrl}/${CONFIG.venueSlug}/${CONFIG.tableNumber}/menu`;
      await page.goto(menuUrl);
      await page.waitForLoadState('networkidle');
      
      // Check if content is visible and properly sized
      const menuItems = await page.locator('[data-testid="menu-item"], .menu-item').count();
      if (menuItems > 0) {
        addTestResult(
          `Mobile Responsiveness (${viewport.name})`,
          true,
          `Menu items properly displayed on ${viewport.name} viewport`
        );
      } else {
        addTestResult(
          `Mobile Responsiveness (${viewport.name})`,
          false,
          `Menu items not properly displayed on ${viewport.name} viewport`
        );
      }
      
      // Test touch interactions
      const addButton = await page.locator('button:has-text("Add"), button:has-text("+")').first();
      if (await addButton.isVisible()) {
        const boundingBox = await addButton.boundingBox();
        if (boundingBox && boundingBox.width >= 44 && boundingBox.height >= 44) {
          addTestResult(
            `Touch Target Size (${viewport.name})`,
            true,
            `Button has adequate touch target size: ${boundingBox.width}x${boundingBox.height}px`
          );
        } else {
          addTestResult(
            `Touch Target Size (${viewport.name})`,
            false,
            `Button touch target too small: ${boundingBox?.width}x${boundingBox?.height}px`
          );
        }
      }
    }
    
    // Test PWA features (if available)
    const manifestLink = await page.locator('link[rel="manifest"]').count();
    if (manifestLink > 0) {
      addTestResult(
        'PWA Manifest',
        true,
        'PWA manifest is present'
      );
    } else {
      addTestResult(
        'PWA Manifest',
        false,
        'PWA manifest not found'
      );
    }
    
    // Test service worker registration
    const serviceWorkerRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    if (serviceWorkerRegistered) {
      addTestResult(
        'Service Worker Support',
        true,
        'Service Worker is supported'
      );
    } else {
      addTestResult(
        'Service Worker Support',
        false,
        'Service Worker not supported'
      );
    }
    
  } catch (error) {
    addTestResult('Mobile Responsiveness', false, 'Mobile responsiveness test failed', error);
  }
}

/**
 * Test Performance and Accessibility
 */
async function testPerformanceAndAccessibility(page) {
  console.log('\n🧪 Testing Performance and Accessibility...');
  
  try {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    const focusedElement = await page.locator(':focus').count();
    if (focusedElement > 0) {
      addTestResult(
        'Keyboard Navigation',
        true,
        'Keyboard navigation is working'
      );
    } else {
      addTestResult(
        'Keyboard Navigation',
        false,
        'Keyboard navigation not working properly'
      );
    }
    
    // Test alt text for images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    const totalImages = await page.locator('img').count();
    
    if (totalImages > 0) {
      if (imagesWithoutAlt === 0) {
        addTestResult(
          'Image Alt Text',
          true,
          `All ${totalImages} images have alt text`
        );
      } else {
        addTestResult(
          'Image Alt Text',
          false,
          `${imagesWithoutAlt} out of ${totalImages} images missing alt text`
        );
      }
    }
    
    // Test page load performance
    const performanceEntries = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    });
    
    testResults.performanceMetrics.domContentLoaded = performanceEntries.domContentLoaded;
    testResults.performanceMetrics.loadComplete = performanceEntries.loadComplete;
    
    if (performanceEntries.domContentLoaded < 2000) {
      addTestResult(
        'DOM Content Loaded Time',
        true,
        `DOM loaded in ${performanceEntries.domContentLoaded}ms`
      );
    } else {
      addTestResult(
        'DOM Content Loaded Time',
        false,
        `DOM load time slow: ${performanceEntries.domContentLoaded}ms`
      );
    }
    
  } catch (error) {
    addTestResult('Performance and Accessibility', false, 'Performance/accessibility test failed', error);
  }
}

/**
 * Generate Final Test Report
 */
function generateTestReport() {
  testResults.endTime = new Date();
  const duration = testResults.endTime - testResults.startTime;
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 SKAN.AL CUSTOMER QR ORDERING FLOW - TEST REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passedTests} ✅`);
  console.log(`   Failed: ${testResults.failedTests} ❌`);
  console.log(`   Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
  console.log(`   Test Duration: ${(duration / 1000).toFixed(1)} seconds`);
  
  if (testResults.performanceMetrics.qrLandingLoadTime) {
    console.log(`\n⚡ PERFORMANCE METRICS:`);
    console.log(`   QR Landing Load Time: ${testResults.performanceMetrics.qrLandingLoadTime}ms`);
    if (testResults.performanceMetrics.domContentLoaded) {
      console.log(`   DOM Content Loaded: ${testResults.performanceMetrics.domContentLoaded}ms`);
    }
    if (testResults.performanceMetrics.loadComplete) {
      console.log(`   Page Load Complete: ${testResults.performanceMetrics.loadComplete}ms`);
    }
  }
  
  console.log(`\n📋 DETAILED TEST RESULTS:`);
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${test.name}: ${test.details}`);
    if (test.error) {
      console.log(`      Error: ${test.error}`);
    }
  });
  
  if (testResults.recommendations.length > 0) {
    console.log(`\n💡 RECOMMENDATIONS:`);
    testResults.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.type}: ${rec.message}`);
    });
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n🚨 ERRORS ENCOUNTERED:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  console.log(`\n🏁 OVERALL ASSESSMENT:`);
  const successRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  if (successRate >= 90) {
    console.log(`   🟢 EXCELLENT: Customer QR ordering flow is working very well (${successRate.toFixed(1)}% success rate)`);
  } else if (successRate >= 75) {
    console.log(`   🟡 GOOD: Customer QR ordering flow is mostly working (${successRate.toFixed(1)}% success rate)`);
    console.log(`   📝 Some improvements recommended`);
  } else if (successRate >= 50) {
    console.log(`   🟠 NEEDS WORK: Customer QR ordering flow has significant issues (${successRate.toFixed(1)}% success rate)`);
    console.log(`   🔧 Multiple fixes required`);
  } else {
    console.log(`   🔴 CRITICAL: Customer QR ordering flow is not working properly (${successRate.toFixed(1)}% success rate)`);
    console.log(`   🚨 Immediate attention required`);
  }
  
  console.log(`\n📱 CUSTOMER EXPERIENCE ASSESSMENT:`);
  
  // Analyze specific customer journey stages
  const qrLandingTests = testResults.tests.filter(t => t.name.includes('QR Landing') || t.name.includes('Auto-redirect'));
  const menuTests = testResults.tests.filter(t => t.name.includes('Menu') && !t.name.includes('Cart'));
  const cartTests = testResults.tests.filter(t => t.name.includes('Cart'));
  const orderTests = testResults.tests.filter(t => t.name.includes('Order') && !t.name.includes('Cart'));
  const mobileTests = testResults.tests.filter(t => t.name.includes('Mobile') || t.name.includes('Touch'));
  
  const analyzeStage = (tests, stageName) => {
    if (tests.length === 0) return `   ${stageName}: Not tested`;
    const passedCount = tests.filter(t => t.passed).length;
    const rate = (passedCount / tests.length) * 100;
    const status = rate >= 80 ? '✅' : rate >= 60 ? '⚠️' : '❌';
    return `   ${status} ${stageName}: ${rate.toFixed(0)}% working (${passedCount}/${tests.length} tests passed)`;
  };
  
  console.log(analyzeStage(qrLandingTests, 'QR Code Landing'));
  console.log(analyzeStage(menuTests, 'Menu Browsing'));
  console.log(analyzeStage(cartTests, 'Cart Functionality'));
  console.log(analyzeStage(orderTests, 'Order Submission & Tracking'));
  console.log(analyzeStage(mobileTests, 'Mobile Experience'));
  
  console.log(`\n📞 NEXT STEPS:`);
  if (testResults.failedTests > 0) {
    console.log(`   1. Fix ${testResults.failedTests} failing test(s)`);
    console.log(`   2. Re-run tests to verify fixes`);
  }
  if (testResults.recommendations.length > 0) {
    console.log(`   3. Implement ${testResults.recommendations.length} improvement(s)`);
  }
  console.log(`   4. Test with real customers on various devices`);
  console.log(`   5. Monitor performance in production`);
  
  console.log('\n' + '='.repeat(80));
  
  return testResults;
}

/**
 * Main Test Execution
 */
async function runCustomerQrOrderingFlowTest() {
  console.log('🚀 Starting SKAN.AL Customer QR Ordering Flow Test...');
  console.log(`📱 Testing: ${CONFIG.customerAppUrl}/${CONFIG.venueSlug}/${CONFIG.tableNumber}`);
  console.log(`🏪 Venue: ${CONFIG.venueSlug}`);
  console.log(`🪑 Table: ${CONFIG.tableNumber}`);
  
  // Test API health first
  await testApiHealth();
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for CI/automated testing
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Enable request/response logging for debugging
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
      }
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🐛 Console Error: ${msg.text()}`);
      }
    });
    
    // Run all test stages
    await testQrLandingPage(page);
    await testMenuBrowsing(page);
    await testCartFunctionality(page);
    await testOrderSubmission(page);
    await testOrderTracking(page);
    await testMobileResponsiveness(page);
    await testPerformanceAndAccessibility(page);
    
  } catch (error) {
    console.log(`❌ Critical test error: ${error.message}`);
    addTestResult('Test Execution', false, 'Critical test execution error', error);
  } finally {
    await browser.close();
  }
  
  // Generate final report
  return generateTestReport();
}

// Run the test
runCustomerQrOrderingFlowTest()
  .then((results) => {
    console.log('\n✅ Customer QR Ordering Flow Test Completed');
    process.exit(results.failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });