const puppeteer = require('puppeteer');

async function testOrderToDashboardVisual() {
  console.log('🎬 ORDER → DASHBOARD VISUAL VERIFICATION');
  console.log('📋 This will: 1) Create order via API 2) Login to admin 3) Find same order visually');
  
  let browser;
  let adminPage;
  let orderNumber = null;
  
  try {
    // ========================================
    // STEP 1: CREATE ORDER VIA API
    // ========================================
    console.log('\n🛒 STEP 1: Creating order via API...');
    
    const testOrder = {
      venueId: 'beach-bar-durres',
      tableNumber: 'A1',
      customerName: 'VISUAL TEST Customer',
      items: [
        { id: 'greek-salad', name: 'Greek Salad', price: 900, quantity: 1 },
        { id: 'fried-calamari', name: 'Fried Calamari', price: 1200, quantity: 1 }
      ],
      specialInstructions: '🎯 VISUAL E2E TEST ORDER - Look for me in the dashboard!'
    };
    
    const response = await fetch('http://127.0.0.1:5001/qr-restaurant-api/europe-west1/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder)
    });
    
    const result = await response.json();
    
    if (result.orderNumber) {
      orderNumber = result.orderNumber;
      console.log(`✅ Order created successfully: ${orderNumber}`);
      console.log(`💰 Total amount: ${result.totalAmount} ALL (${testOrder.items[0].price + testOrder.items[1].price})`);
      console.log(`📋 Items: Greek Salad (900 ALL) + Fried Calamari (1200 ALL)`);
      console.log(`🎯 Special instructions: "${testOrder.specialInstructions}"`);
    } else {
      throw new Error(`Failed to create order: ${JSON.stringify(result)}`);
    }
    
    // ========================================
    // STEP 2: VERIFY ORDER IN API
    // ========================================
    console.log('\n🔍 STEP 2: Verifying order exists in API...');
    
    const ordersResponse = await fetch(`http://127.0.0.1:5001/qr-restaurant-api/europe-west1/api/v1/venue/beach-bar-durres/orders?limit=10`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    const ordersData = await ordersResponse.json();
    const foundOrder = ordersData.find(order => order.orderNumber === orderNumber);
    
    if (foundOrder) {
      console.log(`✅ Order confirmed in API: ${foundOrder.orderNumber}`);
      console.log(`📊 Status: ${foundOrder.status}`);
      console.log(`👤 Customer: ${foundOrder.customerName}`);
      console.log(`🍽️ Items: ${foundOrder.items.length} items`);
    } else {
      console.log(`⚠️  Order ${orderNumber} not found in API response`);
      console.log(`📋 Available orders:`, ordersData.map(o => o.orderNumber));
    }
    
    // ========================================
    // STEP 3: LAUNCH BROWSER AND LOGIN
    // ========================================
    console.log('\n🖥️  STEP 3: Launching browser for visual verification...');
    
    browser = await puppeteer.launch({ 
      headless: false,  // Keep visible for demonstration
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });

    adminPage = await browser.newPage();
    
    // Monitor API requests
    adminPage.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/v1/')) {
        console.log(`📡 Admin API Request: ${request.method()} ${request.url()}`);
      }
    });

    adminPage.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/v1/')) {
        console.log(`📡 Admin API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('🔐 Navigating to admin login...');
    await adminPage.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Fill login form
    await adminPage.waitForSelector('input[type="email"]', { timeout: 10000 });
    await adminPage.type('input[type="email"]', 'demo.beachbar@skan.al');
    await adminPage.type('input[type="password"]', 'BeachBarDemo2024');
    
    console.log('🔑 Submitting login credentials...');
    await adminPage.click('button[type="submit"]');
    
    // Wait for login to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = adminPage.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // ========================================
    // STEP 4: SEARCH FOR ORDER IN DASHBOARD
    // ========================================
    console.log(`\n🔍 STEP 4: Searching for order ${orderNumber} in dashboard...`);
    
    // Wait a moment for any dashboard content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get page content and search for our order
    let pageText = await adminPage.evaluate(() => document.body.textContent);
    console.log(`📄 Dashboard content loaded (${pageText.length} characters)`);
    
    // Look for our specific order
    const orderFound = pageText.includes(orderNumber);
    console.log(`🎯 Looking for order: ${orderNumber}`);
    console.log(`📊 Order found in dashboard: ${orderFound ? '✅ YES' : '❌ NO'}`);
    
    if (orderFound) {
      console.log(`🎉 SUCCESS: Order ${orderNumber} is visible in the dashboard!`);
      
      // Try to highlight the order visually
      try {
        await adminPage.evaluate((orderNum) => {
          const allElements = document.querySelectorAll('*');
          for (let element of allElements) {
            if (element.textContent && element.textContent.includes(orderNum)) {
              element.style.backgroundColor = '#ffff00';
              element.style.border = '3px solid #ff0000';
              element.style.padding = '10px';
              element.style.margin = '5px';
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              console.log('🎨 Order highlighted and scrolled into view!');
              break;
            }
          }
        }, orderNumber);
        
        console.log('🎨 Order highlighted with yellow background and red border!');
      } catch (e) {
        console.log('⚠️  Could not highlight order, but it is visible in the page');
      }
      
    } else {
      console.log(`❌ Order ${orderNumber} NOT FOUND in dashboard`);
      
      // Check what orders are actually visible
      const visibleOrders = pageText.match(/SKN-\d{8}-\d{3}/g) || [];
      console.log(`📋 Orders actually visible in dashboard:`, visibleOrders);
      
      if (visibleOrders.length === 0) {
        console.log('⚠️  No orders visible at all - may be a UI loading issue');
        
        // Try refreshing and waiting longer
        console.log('🔄 Refreshing dashboard and waiting longer...');
        await adminPage.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        pageText = await adminPage.evaluate(() => document.body.textContent);
        const refreshOrderFound = pageText.includes(orderNumber);
        console.log(`🎯 Order found after refresh: ${refreshOrderFound ? '✅ YES' : '❌ NO'}`);
        
        const refreshVisibleOrders = pageText.match(/SKN-\d{8}-\d{3}/g) || [];
        console.log(`📋 Orders visible after refresh:`, refreshVisibleOrders);
      }
    }
    
    // Check if we can see the order details
    if (pageText.includes('VISUAL TEST')) {
      console.log('🎯 Found "VISUAL TEST" text - order details are showing!');
    }
    
    if (pageText.includes('Greek Salad') || pageText.includes('Fried Calamari')) {
      console.log('🍽️ Found menu items from our order - detailed view working!');
    }
    
    // Count total orders
    const totalOrdersVisible = (pageText.match(/SKN-\d{8}-\d{3}/g) || []).length;
    console.log(`📊 Total orders visible in dashboard: ${totalOrdersVisible}`);
    
    // ========================================
    // STEP 5: TAKE SCREENSHOTS
    // ========================================
    console.log('\n📸 STEP 5: Taking screenshots for documentation...');
    
    await adminPage.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/visual-test-dashboard.png',
      fullPage: true 
    });
    console.log('📷 Dashboard screenshot saved as: visual-test-dashboard.png');
    
    // ========================================
    // STEP 6: LIVE DEMONSTRATION
    // ========================================
    console.log('\n👀 STEP 6: LIVE VISUAL VERIFICATION');
    console.log('='.repeat(60));
    console.log(`🎯 TARGET ORDER: ${orderNumber}`);
    console.log(`💰 AMOUNT: 2100 ALL (Greek Salad 900 + Fried Calamari 1200)`);
    console.log(`👤 CUSTOMER: VISUAL TEST Customer`);
    console.log(`📝 INSTRUCTIONS: 🎯 VISUAL E2E TEST ORDER - Look for me in the dashboard!`);
    console.log('='.repeat(60));
    console.log('🖥️  Browser will stay open for 45 seconds for manual inspection');
    console.log('📊 Check the admin dashboard for the highlighted order');
    console.log('⚡ The order should be highlighted in yellow with red border');
    
    // Keep browser open for inspection
    for (let i = 45; i > 0; i -= 5) {
      console.log(`⏰ ${i} seconds remaining for visual inspection...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return {
      success: orderFound,
      orderNumber: orderNumber,
      orderFoundInDashboard: orderFound,
      totalOrdersVisible: totalOrdersVisible,
      adminUrl: currentUrl,
      screenshot: 'visual-test-dashboard.png'
    };
    
  } catch (error) {
    console.error('💥 Visual test error:', error.message);
    return { 
      success: false, 
      error: error.message, 
      orderNumber: orderNumber 
    };
    
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
  }
}

// Run the visual demonstration
console.log('🚀 Starting Order → Dashboard Visual Verification...');
console.log('💡 Make sure admin portal (port 3000) is running and API is accessible');

testOrderToDashboardVisual()
  .then(result => {
    console.log('\n🏁 VISUAL VERIFICATION COMPLETE!');
    console.log('📊 Final Result:', result);
    
    if (result.success) {
      console.log('✅ SUCCESS: Order successfully created and found in dashboard!');
      console.log(`🎯 Order ${result.orderNumber} is visible to restaurant staff`);
      console.log('🔄 End-to-end order synchronization is WORKING');
    } else {
      console.log('❌ ISSUE: Order not showing in dashboard as expected');
      console.log('🔧 May need frontend integration work or data refresh');
    }
  })
  .catch(console.error);