// Test Auto-Login with Retry Logic
const puppeteer = require('puppeteer');

console.log('🔄 TESTING AUTO-LOGIN WITH RETRY LOGIC');
console.log('======================================');

async function testRetryLogin() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Listen for console logs to see retry messages
    page.on('console', msg => {
      console.log(`🖥️ Browser: ${msg.text()}`);
    });
    
    // Navigate to demo page
    console.log('\n📋 Step 1: Navigate to Demo Page');
    await page.goto('http://localhost:3005/demo-request?success=true', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Demo page loaded');
    
    // Verify credentials are shown
    const hasCredentials = await page.evaluate(() => {
      return document.body.textContent.includes('demo.beachbar@skan.al') && 
             document.body.textContent.includes('BeachBarDemo2024!');
    });
    
    console.log(`✅ Credentials displayed: ${hasCredentials}`);
    
    // Click auto-login button
    console.log('\n🖱️ Step 2: Click Auto-Login (with retry logic)');
    
    const startUrl = page.url();
    console.log(`📍 Start URL: ${startUrl}`);
    
    // Click the auto-login button
    await page.click('button[type="submit"]');
    console.log('✅ Auto-login button clicked');
    
    // Wait longer to allow for retry logic (3 second delay + API calls)
    console.log('⏳ Waiting for retry logic to complete...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const endUrl = page.url();
    console.log(`📍 End URL: ${endUrl}`);
    
    // Check localStorage
    const storageData = await page.evaluate(() => {
      return {
        restaurantAuth: localStorage.getItem('restaurantAuth'),
        hasToken: localStorage.getItem('restaurantAuth') ? JSON.parse(localStorage.getItem('restaurantAuth')).token : null
      };
    });
    
    if (storageData.restaurantAuth) {
      console.log('✅ restaurantAuth is set');
      const authData = JSON.parse(storageData.restaurantAuth);
      console.log(`👤 User: ${authData.user?.email || 'unknown'}`);
      console.log(`🏢 Venue: ${authData.venue?.name || 'unknown'}`);
      console.log(`🔑 Token: ${authData.token ? 'present' : 'missing'}`);
    } else {
      console.log('❌ restaurantAuth is not set');
    }
    
    // Check if we're on dashboard
    if (endUrl.includes('/dashboard')) {
      console.log('🎉 SUCCESS: Auto-login worked! Redirected to dashboard');
      
      // Verify dashboard loads properly
      const dashboardTitle = await page.title();
      console.log(`📄 Dashboard title: ${dashboardTitle}`);
      
    } else if (endUrl.includes('/login')) {
      console.log('❌ ISSUE: Still on login page');
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], .error');
        for (let el of errorElements) {
          if (el.textContent.trim()) {
            return el.textContent.trim();
          }
        }
        return null;
      });
      
      if (errorText) {
        console.log(`🚨 Error message: ${errorText}`);
      }
      
    } else {
      console.log(`⚠️ UNEXPECTED: Redirected to ${endUrl}`);
    }
    
    // Test direct dashboard access
    console.log('\n🎯 Step 3: Test Direct Dashboard Access');
    await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalUrl = page.url();
    console.log(`📍 Direct dashboard access: ${finalUrl}`);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Dashboard is accessible');
    } else {
      console.log('❌ FAIL: Dashboard redirects away');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testRetryLogin();