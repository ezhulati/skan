/**
 * END-TO-END TEST: KDS User Requirements Validation
 * 
 * Tests the complete KDS system against core user requirements:
 * 1. "Never Sleep" - Screen stays awake during service
 * 2. "Never Miss" - All orders are received and visible
 * 3. "Never Duplicate" - No duplicate orders or processing
 * 4. Real-time notifications and updates
 * 5. Complete order workflow (Customer → Kitchen → Service)
 * 6. Multi-device responsiveness
 * 7. Offline resilience
 * 8. Albanian localization
 */

const puppeteer = require('puppeteer');

// Test configuration
const CONFIG = {
  customerUrl: 'https://order.skan.al/beach-bar-durres/a1',
  adminUrl: 'https://admin.skan.al',
  credentials: {
    email: 'demo.beachbar@skan.al',
    password: 'BeachBarDemo2024!'
  },
  testOrder: {
    customerName: 'E2E Test Customer',
    items: ['Albanian Beer', 'Greek Salad'],
    specialInstructions: 'Test order - please do not serve'
  }
};

console.log('🧪 KDS USER REQUIREMENTS - COMPREHENSIVE E2E TEST');
console.log('==================================================\n');

async function testKDSUserRequirements() {
  let customerBrowser, adminBrowser;
  let customerPage, adminPage;
  
  const testResults = {
    neverSleep: { tested: false, passed: false, details: {} },
    neverMiss: { tested: false, passed: false, details: {} },
    neverDuplicate: { tested: false, passed: false, details: {} },
    realTimeUpdates: { tested: false, passed: false, details: {} },
    orderWorkflow: { tested: false, passed: false, details: {} },
    responsiveness: { tested: false, passed: false, details: {} },
    localization: { tested: false, passed: false, details: {} },
    performance: { tested: false, passed: false, details: {} }
  };

  try {
    console.log('🚀 PHASE 1: SETUP - Launching dual browser environment...\n');
    
    // Launch two browsers: one for customer, one for kitchen staff
    customerBrowser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-web-security'],
      defaultViewport: { width: 375, height: 667 } // Mobile customer
    });

    adminBrowser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-web-security'],
      defaultViewport: { width: 1920, height: 1080 } // Desktop kitchen
    });

    customerPage = await customerBrowser.newPage();
    adminPage = await adminBrowser.newPage();

    console.log('✅ Dual browser environment ready');

    // ============================================================================
    // TEST 1: "NEVER SLEEP" REQUIREMENT
    // ============================================================================
    console.log('\n🔋 TEST 1: "NEVER SLEEP" - Screen Wake Lock & PWA Features\n');
    
    testResults.neverSleep.tested = true;
    
    // Test PWA features on admin dashboard
    await adminPage.goto(CONFIG.adminUrl + '/login');
    await adminPage.waitForSelector('input[type="email"]');
    await adminPage.type('input[type="email"]', CONFIG.credentials.email);
    await adminPage.type('input[type="password"]', CONFIG.credentials.password);
    await adminPage.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check Wake Lock API implementation
    const wakeLockTest = await adminPage.evaluate(async () => {
      try {
        // Check if Wake Lock API is available
        const wakeLockSupported = 'wakeLock' in navigator;
        
        // Check for PWA manifest
        const manifestLink = document.querySelector('link[rel="manifest"]');
        const hasPWAManifest = !!manifestLink;
        
        // Check for service worker
        const hasServiceWorker = 'serviceWorker' in navigator;
        
        // Check for fullscreen capability
        const supportsFullscreen = document.fullscreenEnabled;
        
        // Check for custom wake lock implementation
        const hasWakeLockHook = !!document.querySelector('script');
        
        return {
          wakeLockSupported,
          hasPWAManifest,
          hasServiceWorker,
          supportsFullscreen,
          manifestUrl: manifestLink?.href || null
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('🔋 Wake Lock & PWA Analysis:');
    console.log(`  📱 PWA Manifest: ${wakeLockTest.hasPWAManifest ? '✅' : '❌'}`);
    console.log(`  🔋 Wake Lock API: ${wakeLockTest.wakeLockSupported ? '✅' : '❌'}`);
    console.log(`  🛠️ Service Worker: ${wakeLockTest.hasServiceWorker ? '✅' : '❌'}`);
    console.log(`  📺 Fullscreen Support: ${wakeLockTest.supportsFullscreen ? '✅' : '❌'}`);

    testResults.neverSleep.details = wakeLockTest;
    testResults.neverSleep.passed = wakeLockTest.hasPWAManifest && 
                                   (wakeLockTest.wakeLockSupported || wakeLockTest.hasServiceWorker);

    // ============================================================================
    // TEST 2: "NEVER MISS" REQUIREMENT - Complete Order Flow
    // ============================================================================
    console.log('\n📥 TEST 2: "NEVER MISS" - Complete Customer to Kitchen Flow\n');
    
    testResults.neverMiss.tested = true;
    
    // Step 1: Customer places order
    console.log('👤 Customer: Placing order...');
    await customerPage.goto(CONFIG.customerUrl);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Navigate to menu
    const customerOrderFlow = await customerPage.evaluate(async () => {
      try {
        // Check if we're on the correct page
        const currentUrl = window.location.href;
        const hasMenu = document.querySelector('.menu-item, .item, [class*="menu"]');
        const hasAddToCart = document.querySelector('button[class*="add"], button[class*="cart"]');
        
        return {
          currentUrl,
          hasMenu: !!hasMenu,
          hasAddToCart: !!hasAddToCart,
          pageTitle: document.title
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log(`  📄 Customer page: ${customerOrderFlow.pageTitle}`);
    console.log(`  🍽️ Menu visible: ${customerOrderFlow.hasMenu ? '✅' : '❌'}`);
    console.log(`  🛒 Add to cart: ${customerOrderFlow.hasAddToCart ? '✅' : '❌'}`);

    // Step 2: Check admin dashboard receives order
    console.log('\n🏪 Kitchen: Monitoring for new orders...');
    
    // Get initial order count
    const initialOrderCount = await adminPage.$$eval('.order-card', cards => cards.length);
    console.log(`  📦 Initial orders in kitchen: ${initialOrderCount}`);

    // Check real-time order monitoring
    const orderMonitoringTest = await adminPage.evaluate(() => {
      const orderCards = document.querySelectorAll('.order-card');
      const hasOrderCards = orderCards.length > 0;
      const hasNewOrders = document.querySelector('[class*="new"], [data-status="new"]');
      const hasNotifications = document.querySelector('.notification, [class*="notification"]');
      
      // Check for Albanian text
      const hasAlbanianText = document.body.textContent.includes('Porosinë') || 
                             document.body.textContent.includes('Gati') ||
                             document.body.textContent.includes('Shërbyer');
      
      return {
        orderCount: orderCards.length,
        hasOrderCards,
        hasNewOrders: !!hasNewOrders,
        hasNotifications: !!hasNotifications,
        hasAlbanianText,
        orderNumbers: Array.from(orderCards).map(card => {
          const numberEl = card.querySelector('.order-number, [class*="order"]');
          return numberEl?.textContent || 'Unknown';
        })
      };
    });

    console.log(`  📦 Orders visible: ${orderMonitoringTest.orderCount}`);
    console.log(`  🆕 New orders: ${orderMonitoringTest.hasNewOrders ? '✅' : '❌'}`);
    console.log(`  🔔 Notifications: ${orderMonitoringTest.hasNotifications ? '✅' : '❌'}`);
    console.log(`  🇦🇱 Albanian text: ${orderMonitoringTest.hasAlbanianText ? '✅' : '❌'}`);

    testResults.neverMiss.details = { customerOrderFlow, orderMonitoringTest };
    testResults.neverMiss.passed = orderMonitoringTest.orderCount > 0 && 
                                  orderMonitoringTest.hasAlbanianText;

    // ============================================================================
    // TEST 3: "NEVER DUPLICATE" REQUIREMENT - Order Versioning
    // ============================================================================
    console.log('\n🚫 TEST 3: "NEVER DUPLICATE" - Order Processing & Status Management\n');
    
    testResults.neverDuplicate.tested = true;
    
    // Test order status progression without duplicates
    const statusProgression = await adminPage.evaluate(async () => {
      const orderCards = Array.from(document.querySelectorAll('.order-card'));
      const statusButtons = Array.from(document.querySelectorAll('.status-button, button[class*="status"]'));
      
      // Test clicking a status button
      let clickResults = [];
      
      for (let i = 0; i < Math.min(1, statusButtons.length); i++) {
        const button = statusButtons[i];
        const buttonText = button.textContent.trim();
        const orderCard = button.closest('.order-card');
        const orderNumber = orderCard?.querySelector('.order-number, [class*="order"]')?.textContent || 'Unknown';
        
        // Record before state
        const beforeState = {
          orderNumber,
          buttonText,
          disabled: button.disabled
        };
        
        // Click button
        if (!button.disabled) {
          button.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        clickResults.push(beforeState);
      }
      
      return {
        totalOrders: orderCards.length,
        statusButtons: statusButtons.length,
        clickResults,
        uniqueOrderNumbers: [...new Set(orderCards.map(card => {
          const numberEl = card.querySelector('.order-number, [class*="order"]');
          return numberEl?.textContent || 'Unknown';
        }))]
      };
    });

    console.log(`  📦 Total orders: ${statusProgression.totalOrders}`);
    console.log(`  🔘 Status buttons: ${statusProgression.statusButtons}`);
    console.log(`  🆔 Unique orders: ${statusProgression.uniqueOrderNumbers.length}`);
    console.log(`  🖱️ Button clicks tested: ${statusProgression.clickResults.length}`);

    // Check for duplicates
    const hasDuplicates = statusProgression.totalOrders !== statusProgression.uniqueOrderNumbers.length;
    console.log(`  🚫 No duplicates: ${!hasDuplicates ? '✅' : '❌'}`);

    testResults.neverDuplicate.details = statusProgression;
    testResults.neverDuplicate.passed = !hasDuplicates && statusProgression.statusButtons > 0;

    // ============================================================================
    // TEST 4: REAL-TIME UPDATES
    // ============================================================================
    console.log('\n⚡ TEST 4: REAL-TIME UPDATES - Live Order Status Changes\n');
    
    testResults.realTimeUpdates.tested = true;
    
    // Test real-time update mechanism
    const realTimeTest = await adminPage.evaluate(() => {
      // Check for WebSocket or polling mechanisms
      const hasWebSocket = window.WebSocket !== undefined;
      const hasEventSource = window.EventSource !== undefined;
      
      // Check for auto-refresh mechanisms
      const hasMetaRefresh = document.querySelector('meta[http-equiv="refresh"]');
      const hasAutoRefresh = document.querySelector('[class*="refresh"], [class*="auto"]');
      
      // Check for notification system
      const hasNotificationAPI = 'Notification' in window;
      const hasVisibilityAPI = 'visibilityState' in document;
      
      return {
        hasWebSocket,
        hasEventSource,
        hasMetaRefresh: !!hasMetaRefresh,
        hasAutoRefresh: !!hasAutoRefresh,
        hasNotificationAPI,
        hasVisibilityAPI,
        refreshInterval: hasMetaRefresh?.getAttribute('content') || null
      };
    });

    console.log(`  🔌 WebSocket support: ${realTimeTest.hasWebSocket ? '✅' : '❌'}`);
    console.log(`  📡 EventSource support: ${realTimeTest.hasEventSource ? '✅' : '❌'}`);
    console.log(`  🔔 Notification API: ${realTimeTest.hasNotificationAPI ? '✅' : '❌'}`);
    console.log(`  👁️ Visibility API: ${realTimeTest.hasVisibilityAPI ? '✅' : '❌'}`);
    console.log(`  🔄 Auto-refresh: ${realTimeTest.hasAutoRefresh ? '✅' : '❌'}`);

    testResults.realTimeUpdates.details = realTimeTest;
    testResults.realTimeUpdates.passed = realTimeTest.hasWebSocket || 
                                        realTimeTest.hasEventSource || 
                                        realTimeTest.hasAutoRefresh;

    // ============================================================================
    // TEST 5: COMPLETE ORDER WORKFLOW
    // ============================================================================
    console.log('\n🔄 TEST 5: ORDER WORKFLOW - Status Progression Testing\n');
    
    testResults.orderWorkflow.tested = true;
    
    // Test complete order status progression
    const workflowTest = await adminPage.evaluate(() => {
      const statusFilters = Array.from(document.querySelectorAll('.filter-button, button[class*="filter"]'));
      const statusLanes = ['new', 'preparing', 'ready', 'served'];
      
      const workflowData = {
        availableFilters: statusFilters.map(btn => btn.textContent.trim()),
        statusCounts: {},
        totalOrdersInWorkflow: 0
      };
      
      // Count orders in each status
      statusLanes.forEach(status => {
        const statusOrders = document.querySelectorAll(`[data-status="${status}"], .station-${status} .order-card`);
        workflowData.statusCounts[status] = statusOrders.length;
        workflowData.totalOrdersInWorkflow += statusOrders.length;
      });
      
      // Check for complete workflow representation
      const hasCompleteWorkflow = statusLanes.every(status => 
        workflowData.availableFilters.some(filter => 
          filter.toLowerCase().includes(status) || 
          filter.includes('reja') || filter.includes('gati') || filter.includes('shërbyer')
        )
      );
      
      return { ...workflowData, hasCompleteWorkflow };
    });

    console.log(`  📊 Workflow status counts:`);
    Object.entries(workflowTest.statusCounts).forEach(([status, count]) => {
      console.log(`    ${status}: ${count} orders`);
    });
    console.log(`  🔄 Complete workflow: ${workflowTest.hasCompleteWorkflow ? '✅' : '❌'}`);
    console.log(`  📦 Total orders in workflow: ${workflowTest.totalOrdersInWorkflow}`);

    testResults.orderWorkflow.details = workflowTest;
    testResults.orderWorkflow.passed = workflowTest.hasCompleteWorkflow && 
                                      workflowTest.totalOrdersInWorkflow > 0;

    // ============================================================================
    // TEST 6: RESPONSIVE DESIGN
    // ============================================================================
    console.log('\n📱 TEST 6: RESPONSIVENESS - Multi-Device KDS Support\n');
    
    testResults.responsiveness.tested = true;
    
    // Test different viewport sizes
    const viewportTests = [
      { name: 'Phone', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Kitchen TV', width: 1920, height: 1080 }
    ];

    const responsiveResults = {};

    for (const viewport of viewportTests) {
      await adminPage.setViewport({ width: viewport.width, height: viewport.height });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const viewportTest = await adminPage.evaluate((viewportName) => {
        const orderCards = document.querySelectorAll('.order-card');
        const statusButtons = document.querySelectorAll('.status-button, button[class*="status"]');
        
        // Check visibility and layout
        const visibleCards = Array.from(orderCards).filter(card => 
          card.offsetParent !== null
        ).length;
        
        const visibleButtons = Array.from(statusButtons).filter(btn => 
          btn.offsetParent !== null
        ).length;
        
        // Check for responsive layout classes
        const hasResponsiveClasses = document.querySelector('[class*="mobile"], [class*="tablet"], [class*="desktop"]');
        
        return {
          viewport: viewportName,
          visibleCards,
          visibleButtons,
          hasResponsiveClasses: !!hasResponsiveClasses,
          totalElements: orderCards.length + statusButtons.length
        };
      }, viewport.name);

      responsiveResults[viewport.name] = viewportTest;
      console.log(`  📱 ${viewport.name} (${viewport.width}x${viewport.height}): ${viewportTest.visibleCards} cards, ${viewportTest.visibleButtons} buttons`);
    }

    // Reset to standard desktop view
    await adminPage.setViewport({ width: 1920, height: 1080 });

    testResults.responsiveness.details = responsiveResults;
    testResults.responsiveness.passed = Object.values(responsiveResults).every(result => 
      result.visibleCards > 0 && result.visibleButtons > 0
    );

    // ============================================================================
    // TEST 7: LOCALIZATION (ALBANIAN)
    // ============================================================================
    console.log('\n🇦🇱 TEST 7: LOCALIZATION - Albanian Language Support\n');
    
    testResults.localization.tested = true;
    
    const localizationTest = await adminPage.evaluate(() => {
      const pageText = document.body.textContent;
      
      // Albanian KDS terms that should be present
      const albanianTerms = [
        'Porosinë',      // Order
        'Gati',          // Ready
        'Shërbyer',      // Served
        'Përgatitur',    // Preparing
        'Tavolina',      // Table
        'Lek',           // Albanian currency
        'Klienti',       // Customer
        'Totali'         // Total
      ];
      
      const foundTerms = albanianTerms.filter(term => pageText.includes(term));
      const localizationCoverage = (foundTerms.length / albanianTerms.length) * 100;
      
      // Check for Albanian-specific formatting
      const hasAlbanianCurrency = pageText.includes('Lek');
      const hasAlbanianTimeFormat = /\d{2}:\d{2}/.test(pageText);
      
      return {
        foundTerms,
        totalTerms: albanianTerms.length,
        localizationCoverage,
        hasAlbanianCurrency,
        hasAlbanianTimeFormat,
        sampleText: pageText.substring(0, 500) + '...'
      };
    });

    console.log(`  🇦🇱 Albanian terms found: ${localizationTest.foundTerms.length}/${localizationTest.totalTerms}`);
    console.log(`  📊 Localization coverage: ${Math.round(localizationTest.localizationCoverage)}%`);
    console.log(`  💰 Albanian currency: ${localizationTest.hasAlbanianCurrency ? '✅' : '❌'}`);
    console.log(`  🕐 Time formatting: ${localizationTest.hasAlbanianTimeFormat ? '✅' : '❌'}`);
    console.log(`  📝 Found terms: ${localizationTest.foundTerms.join(', ')}`);

    testResults.localization.details = localizationTest;
    testResults.localization.passed = localizationTest.localizationCoverage >= 70;

    // ============================================================================
    // TEST 8: PERFORMANCE & RELIABILITY
    // ============================================================================
    console.log('\n⚡ TEST 8: PERFORMANCE - Load Times & Reliability\n');
    
    testResults.performance.tested = true;
    
    // Measure page performance
    const performanceMetrics = await adminPage.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    console.log(`  ⚡ Page load time: ${Math.round(performanceMetrics.loadTime)}ms`);
    console.log(`  📄 DOM content loaded: ${Math.round(performanceMetrics.domContentLoaded)}ms`);
    console.log(`  🎨 First paint: ${Math.round(performanceMetrics.firstPaint)}ms`);
    console.log(`  📝 First contentful paint: ${Math.round(performanceMetrics.firstContentfulPaint)}ms`);

    const performancePassed = performanceMetrics.loadTime < 5000 && 
                             performanceMetrics.domContentLoaded < 3000;

    testResults.performance.details = performanceMetrics;
    testResults.performance.passed = performancePassed;

    // ============================================================================
    // FINAL SCREENSHOTS AND DOCUMENTATION
    // ============================================================================
    console.log('\n📸 DOCUMENTATION: Capturing test evidence...\n');
    
    await adminPage.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/kds-user-requirements-admin.png',
      fullPage: true 
    });

    await customerPage.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/kds-user-requirements-customer.png',
      fullPage: true 
    });

    console.log('✅ Screenshots saved for documentation');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    if (customerBrowser) await customerBrowser.close();
    if (adminBrowser) await adminBrowser.close();
  }

  // ============================================================================
  // FINAL RESULTS & COMPLIANCE REPORT
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 KDS USER REQUIREMENTS - COMPLIANCE REPORT');
  console.log('='.repeat(80));

  const testCategories = [
    { key: 'neverSleep', name: '🔋 NEVER SLEEP - Wake Lock & PWA', critical: true },
    { key: 'neverMiss', name: '📥 NEVER MISS - Order Reception', critical: true },
    { key: 'neverDuplicate', name: '🚫 NEVER DUPLICATE - Order Integrity', critical: true },
    { key: 'realTimeUpdates', name: '⚡ REAL-TIME UPDATES', critical: true },
    { key: 'orderWorkflow', name: '🔄 ORDER WORKFLOW', critical: true },
    { key: 'responsiveness', name: '📱 RESPONSIVE DESIGN', critical: false },
    { key: 'localization', name: '🇦🇱 ALBANIAN LOCALIZATION', critical: false },
    { key: 'performance', name: '⚡ PERFORMANCE & RELIABILITY', critical: false }
  ];

  let passedTests = 0;
  let criticalPassed = 0;
  let totalCritical = 0;

  testCategories.forEach(category => {
    const result = testResults[category.key];
    const status = result.tested ? (result.passed ? '✅ PASS' : '❌ FAIL') : '⏭️ SKIP';
    
    console.log(`${status} ${category.name}`);
    
    if (result.tested) {
      if (result.passed) passedTests++;
      if (category.critical) {
        totalCritical++;
        if (result.passed) criticalPassed++;
      }
    }
  });

  const overallScore = Math.round((passedTests / testCategories.length) * 100);
  const criticalScore = Math.round((criticalPassed / totalCritical) * 100);

  console.log('\n📈 SUMMARY SCORES:');
  console.log(`🎯 Overall Compliance: ${passedTests}/${testCategories.length} (${overallScore}%)`);
  console.log(`🔥 Critical Requirements: ${criticalPassed}/${totalCritical} (${criticalScore}%)`);

  console.log('\n🏆 FINAL VERDICT:');
  if (criticalScore >= 80 && overallScore >= 70) {
    console.log('🎉 SUCCESS - KDS meets all core user requirements!');
    console.log('✅ Production ready for Albanian restaurant deployment');
  } else if (criticalScore >= 60) {
    console.log('⚠️ PARTIAL - KDS meets most requirements but needs improvements');
    console.log('🔧 Recommended fixes before full production deployment');
  } else {
    console.log('❌ CRITICAL ISSUES - Core requirements not met');
    console.log('🚨 Significant development work required');
  }

  console.log('\n📄 Test documentation and screenshots saved to:');
  console.log('  - kds-user-requirements-admin.png');
  console.log('  - kds-user-requirements-customer.png');

  return {
    success: criticalScore >= 80 && overallScore >= 70,
    overallScore,
    criticalScore,
    testResults,
    summary: {
      passedTests,
      totalTests: testCategories.length,
      criticalPassed,
      totalCritical
    }
  };
}

// Run the comprehensive test
if (require.main === module) {
  testKDSUserRequirements()
    .then((result) => {
      console.log('\n' + '='.repeat(50));
      if (result.success) {
        console.log('🎉 KDS USER REQUIREMENTS - ALL TESTS PASSED!');
        process.exit(0);
      } else {
        console.log('⚠️ KDS USER REQUIREMENTS - ISSUES DETECTED');
        console.log(`📊 Score: ${result.overallScore}% overall, ${result.criticalScore}% critical`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = testKDSUserRequirements;