// Simple Button Test
const puppeteer = require('puppeteer');

console.log('🔘 SIMPLE AUTO-LOGIN BUTTON TEST');
console.log('=================================');

async function simpleButtonTest() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`🚨 Page Error: ${error.message}`);
    });
    
    // Navigate to demo page
    console.log('\n📋 Navigate to Demo Page');
    await page.goto('http://localhost:3005/demo-request?success=true', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if credentials are shown
    const hasCredentials = await page.evaluate(() => {
      return document.body.textContent.includes('demo.beachbar@skan.al') && 
             document.body.textContent.includes('BeachBarDemo2024!');
    });
    
    console.log(`✅ Credentials displayed: ${hasCredentials}`);
    
    // Find all buttons
    const buttons = await page.$$eval('button', buttons => {
      return buttons.map((btn, index) => ({
        index,
        text: btn.textContent.trim(),
        type: btn.type,
        disabled: btn.disabled
      }));
    });
    
    console.log('\n🔘 Available buttons:');
    buttons.forEach(btn => {
      console.log(`  ${btn.index}: "${btn.text}" (${btn.type}, disabled: ${btn.disabled})`);
    });
    
    // Find the auto-login button
    const autoLoginIndex = buttons.findIndex(btn => 
      btn.text.includes('Hyr') || btn.text.includes('Demo')
    );
    
    if (autoLoginIndex === -1) {
      console.log('❌ No auto-login button found');
      return;
    }
    
    console.log(`\n🎯 Found auto-login button at index ${autoLoginIndex}: "${buttons[autoLoginIndex].text}"`);
    
    // Click the button and monitor the result
    console.log('\n🖱️ Clicking auto-login button...');
    
    const startUrl = page.url();
    console.log(`📍 Start URL: ${startUrl}`);
    
    // Use page.click with selector
    const buttonSelector = `button:nth-of-type(${autoLoginIndex + 1})`;
    await page.click(buttonSelector);
    
    console.log('✅ Button clicked');
    
    // Wait and check for changes
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const endUrl = page.url();
    console.log(`📍 End URL: ${endUrl}`);
    
    // Check localStorage
    const storageData = await page.evaluate(() => {
      return {
        restaurantAuth: localStorage.getItem('restaurantAuth'),
        keys: Object.keys(localStorage)
      };
    });
    
    console.log(`💾 LocalStorage keys: ${storageData.keys.join(', ')}`);
    
    if (storageData.restaurantAuth) {
      console.log('✅ restaurantAuth is set');
      try {
        const authData = JSON.parse(storageData.restaurantAuth);
        console.log(`👤 User: ${authData.user?.email || 'unknown'}`);
        console.log(`🔑 Token: ${authData.token ? 'present' : 'missing'}`);
      } catch (e) {
        console.log('⚠️ Could not parse restaurantAuth');
      }
    } else {
      console.log('❌ restaurantAuth is not set');
    }
    
    // Test direct navigation to dashboard
    console.log('\n🎯 Testing direct dashboard access...');
    await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardUrl = page.url();
    console.log(`📍 Dashboard URL: ${dashboardUrl}`);
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Can access dashboard');
    } else {
      console.log('❌ FAIL: Cannot access dashboard');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

simpleButtonTest();