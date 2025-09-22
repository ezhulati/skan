const puppeteer = require('puppeteer');

async function testAdminLoginEnhanced() {
  console.log('🧪 Enhanced Beach Bar Admin Portal Login Test...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    });

    const page = await browser.newPage();
    
    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/v1/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          time: new Date().toISOString()
        });
        console.log(`📡 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/v1/')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });

    // Monitor console logs from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Error: ${msg.text()}`);
      }
    });
    
    console.log('📱 Navigating to admin portal login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Wait for login form to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    console.log('✅ Login form loaded successfully');
    
    // Fill in Beach Bar credentials
    console.log('🔑 Entering Beach Bar credentials...');
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024');
    
    // Submit login form
    console.log('🚀 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait longer for the login to complete and check for various success indicators
    console.log('⏳ Waiting for login to complete...');
    
    try {
      // Wait up to 15 seconds for any of these success indicators
      await Promise.race([
        // Dashboard or admin content
        page.waitForSelector('.dashboard', { timeout: 15000 }).then(() => 'dashboard'),
        page.waitForSelector('[data-testid="dashboard"]', { timeout: 15000 }).then(() => 'dashboard-testid'),
        page.waitForSelector('h1', { timeout: 15000 }).then(() => 'h1-content'),
        // URL change away from login
        page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 }).then(() => 'url-change'),
        // Any content that indicates successful login
        page.waitForFunction(() => 
          document.body.textContent.includes('Beach Bar') || 
          document.body.textContent.includes('Dashboard') ||
          document.body.textContent.includes('Orders') ||
          document.body.textContent.includes('Porosia'), 
          { timeout: 15000 }
        ).then(() => 'content-match')
      ]);
      
      console.log('✅ Login appears to have completed, checking result...');
      
    } catch (waitError) {
      console.log('⏰ Timeout waiting for login completion, checking current state...');
    }
    
    // Check current state
    const currentUrl = page.url();
    const pageTitle = await page.title();
    const bodyText = await page.evaluate(() => document.body.textContent);
    
    console.log('📍 Current URL:', currentUrl);
    console.log('📋 Page Title:', pageTitle);
    console.log('📄 Page content (first 300 chars):', bodyText.substring(0, 300));
    console.log('📊 Network Requests Made:', networkRequests.length);
    
    // Print network requests for debugging
    if (networkRequests.length > 0) {
      console.log('\n📡 API Requests Made:');
      networkRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url} at ${req.time}`);
      });
    } else {
      console.log('⚠️  No API requests detected - this might indicate a frontend issue');
    }
    
    // Check for specific success indicators
    if (!currentUrl.includes('/login')) {
      console.log('✅ SUCCESS: Redirected away from login page!');
      
      // Look for order content specifically
      if (bodyText.includes('SKN-') || bodyText.includes('ORD-') || bodyText.toLowerCase().includes('order')) {
        console.log('🎯 SUCCESS: Orders detected in dashboard!');
        
        // Try to find and count orders
        const orderElements = await page.evaluate(() => {
          const text = document.body.textContent;
          const sknMatches = text.match(/SKN-\d{8}-\d{3}/g) || [];
          const ordMatches = text.match(/ORD-\d{3}/g) || [];
          return {
            sknOrders: sknMatches,
            ordOrders: ordMatches,
            totalText: text.includes('total') || text.includes('Total')
          };
        });
        
        console.log('📋 Orders found:', {
          'SKN orders': orderElements.sknOrders.length,
          'ORD orders': orderElements.ordOrders.length,
          'Contains total': orderElements.totalText
        });
        
        if (orderElements.sknOrders.length > 0) {
          console.log('🎯 SKN orders detected:', orderElements.sknOrders);
        }
        
        return { 
          success: true, 
          url: currentUrl, 
          title: pageTitle,
          ordersFound: orderElements.sknOrders.length + orderElements.ordOrders.length
        };
        
      } else {
        console.log('⚠️  Logged in but no order content detected');
        return { 
          success: true, 
          url: currentUrl, 
          title: pageTitle,
          ordersFound: 0,
          note: 'Login successful but no orders visible'
        };
      }
      
    } else if (bodyText.includes('Login failed') || bodyText.includes('error') || bodyText.includes('Error')) {
      console.log('❌ LOGIN FAILED - Error message detected');
      return { success: false, error: 'Login failed error detected' };
      
    } else if (bodyText.includes('Duke u futur') || bodyText.includes('Logging in')) {
      console.log('⏰ LOGIN STILL IN PROGRESS - May be stuck');
      return { success: false, error: 'Login appears stuck in progress state' };
      
    } else {
      console.log('❓ UNCLEAR RESULT - Still on login page without clear error');
      return { success: false, error: 'Unclear login result - still on login page' };
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
    return { success: false, error: error.message };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the enhanced test
testAdminLoginEnhanced()
  .then(result => {
    console.log('\n🏁 ENHANCED TEST RESULT:');
    if (result.success) {
      console.log('✅ Beach Bar admin login is WORKING!');
      if (result.ordersFound) {
        console.log(`📊 Found ${result.ordersFound} orders in the dashboard`);
      }
    } else {
      console.log('❌ Beach Bar admin login FAILED:', result.error);
    }
    console.log('Full result:', result);
  })
  .catch(console.error);