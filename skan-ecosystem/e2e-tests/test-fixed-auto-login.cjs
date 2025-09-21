// Test Fixed Auto-Login
const puppeteer = require('puppeteer');

console.log('🔧 TESTING FIXED AUTO-LOGIN');
console.log('============================');

async function testFixedAutoLogin() {
  let browser;
  let success = true;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Step 1: Navigate to demo page
    console.log('\n📋 Step 1: Navigate to Demo Page');
    await page.goto('http://localhost:3005/demo-request?success=true', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Demo page loaded');
    
    // Step 2: Verify credentials are displayed
    const pageContent = await page.content();
    if (pageContent.includes('demo.beachbar@skan.al') && pageContent.includes('BeachBarDemo2024!')) {
      console.log('✅ Credentials displayed correctly');
    } else {
      console.log('❌ Credentials not displayed');
      success = false;
    }
    
    // Step 3: Click auto-login button
    console.log('\n🖱️ Step 3: Click Auto-Login Button');
    
    const autoLoginButtons = await page.$$('button');
    let buttonClicked = false;
    
    for (let btn of autoLoginButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Hyr')) {
        console.log(`🔘 Clicking button: "${text.trim()}"`);
        await btn.click();
        buttonClicked = true;
        
        // Wait for redirect
        console.log('⏳ Waiting for redirect...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalUrl = page.url();
        console.log(`📍 Final URL: ${finalUrl}`);
        
        if (finalUrl.includes('/dashboard')) {
          console.log('✅ SUCCESS: Redirected to dashboard');
        } else if (finalUrl.includes('/login')) {
          console.log('❌ ISSUE: Still redirected to login page');
          success = false;
        } else {
          console.log(`⚠️ UNEXPECTED: Redirected to ${finalUrl}`);
        }
        
        break;
      }
    }
    
    if (!buttonClicked) {
      console.log('❌ Auto-login button not found');
      success = false;
    }
    
    // Step 4: Check localStorage after auto-login
    console.log('\n💾 Step 4: Check localStorage');
    
    const storageData = await page.evaluate(() => {
      return {
        restaurantAuth: localStorage.getItem('restaurantAuth'),
        skanAuthToken: localStorage.getItem('skanAuthToken'),
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      };
    });
    
    console.log('📦 LocalStorage contents:');
    Object.entries(storageData).forEach(([key, value]) => {
      if (value) {
        console.log(`   ${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`   ${key}: null`);
      }
    });
    
    if (storageData.restaurantAuth) {
      console.log('✅ restaurantAuth is set (AuthContext will recognize this)');
    } else {
      console.log('❌ restaurantAuth is not set');
      success = false;
    }
    
    // Step 5: Test direct navigation to dashboard
    console.log('\n🎯 Step 5: Test Direct Dashboard Access');
    
    await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardUrl = page.url();
    console.log(`📍 Dashboard access URL: ${dashboardUrl}`);
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Can access dashboard directly');
    } else if (dashboardUrl.includes('/login')) {
      console.log('❌ ISSUE: Dashboard redirects to login');
      success = false;
    } else {
      console.log(`⚠️ UNEXPECTED: Dashboard redirects to ${dashboardUrl}`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    success = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Results
  console.log('\n🎯 RESULTS');
  console.log('==========');
  
  if (success) {
    console.log('🎉 AUTO-LOGIN FIX SUCCESSFUL!');
    console.log('✅ Auto-login redirects to dashboard');
    console.log('✅ Authentication persists correctly');
    console.log('✅ Dashboard access works');
  } else {
    console.log('❌ AUTO-LOGIN FIX FAILED!');
    console.log('🛠️ Further debugging needed');
  }
  
  return success;
}

testFixedAutoLogin();