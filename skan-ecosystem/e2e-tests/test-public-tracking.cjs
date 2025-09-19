const puppeteer = require('puppeteer');

async function testPublicTracking() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Console error:', msg.text());
      }
    });
    
    // Monitor page errors
    page.on('pageerror', error => {
      console.log('🚨 Page error:', error.message);
    });
    
    console.log('🚀 Testing public order tracking...');
    
    // Test a known order number from the previous test results
    const orderNumber = 'SKN-20250919-019';
    const testUrl = `http://localhost:3000/track/${orderNumber}`;
    
    console.log(`📍 Navigating to: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);
    
    // Check if we're still on the tracking page (not redirected)
    if (currentUrl === testUrl) {
      console.log('✅ URL correctly shows tracking page');
    } else {
      console.log('❌ URL was redirected to:', currentUrl);
    }
    
    // Check page content
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasOrderStatus: !!document.querySelector('h1'),
        hasOrderNumber: document.body.textContent.includes('SKN-20250919-019'),
        hasVenueNotFound: document.body.textContent.includes('Venue not found'),
        hasLoadingSpinner: !!document.querySelector('.animate-spin'),
        hasErrorMessage: !!document.querySelector('.text-red-400'),
        hasOrderTracking: document.body.textContent.includes('Order Status') || document.body.textContent.includes('order_status'),
        bodyText: document.body.textContent.substring(0, 500) // First 500 chars for debugging
      };
    });
    
    console.log('📄 Page content analysis:', pageContent);
    
    // Check if the order tracking is working
    if (pageContent.hasOrderTracking && !pageContent.hasVenueNotFound) {
      console.log('✅ Order tracking page loaded successfully');
      console.log('✅ No "Venue not found" error');
      
      if (pageContent.hasOrderNumber) {
        console.log('✅ Order number is displayed correctly');
      } else {
        console.log('⚠️  Order number not visible (might be loading)');
      }
      
    } else if (pageContent.hasVenueNotFound) {
      console.log('❌ "Venue not found" error still present');
    } else if (pageContent.hasLoadingSpinner) {
      console.log('⏳ Page is still loading...');
    } else {
      console.log('❓ Unknown page state');
    }
    
    console.log('✅ Public tracking test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testPublicTracking();