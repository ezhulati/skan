// Debug Auto-Login Issue
const puppeteer = require('puppeteer');

console.log('🔍 DEBUGGING AUTO-LOGIN ISSUE');
console.log('==============================');

async function debugAutoLogin() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`🖥️ Browser Console: ${msg.text()}`);
    });
    
    // Enable error logging
    page.on('pageerror', (error) => {
      console.log(`🚨 Page Error: ${error.message}`);
    });
    
    // Navigate to demo success page
    console.log('\n📋 Step 1: Navigate to Demo Page');
    await page.goto('http://localhost:3005/demo-request?success=true', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Demo page loaded');
    
    // Inject debugging into the auto-login function
    console.log('\n🔧 Step 2: Inject Debug Code');
    await page.evaluate(() => {
      // Override fetch to log the request/response
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        console.log('🌐 API Request:', args[0], args[1]);
        
        try {
          const response = await originalFetch.apply(this, args);
          const responseClone = response.clone();
          const responseText = await responseClone.text();
          
          console.log('📡 API Response Status:', response.status);
          console.log('📡 API Response OK:', response.ok);
          console.log('📡 API Response Text:', responseText.substring(0, 200));
          
          return response;
        } catch (error) {
          console.log('❌ API Error:', error.message);
          throw error;
        }
      };
      
      // Override localStorage to log token storage
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        console.log('💾 LocalStorage Set:', key, value ? value.substring(0, 50) + '...' : 'null');
        return originalSetItem.call(this, key, value);
      };
      
      console.log('🔧 Debug code injected');
    });
    
    // Find and click auto-login button
    console.log('\n🖱️ Step 3: Click Auto-Login Button');
    
    const autoLoginButtons = await page.$$('button');
    let buttonClicked = false;
    
    for (let btn of autoLoginButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Hyr')) {
        console.log(`🔘 Found button: "${text.trim()}"`);
        
        // Click and monitor network activity
        console.log('🖱️ Clicking auto-login button...');
        await btn.click();
        buttonClicked = true;
        
        // Wait longer to see all logs
        console.log('⏳ Waiting for auto-login process...');
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        const finalUrl = page.url();
        console.log(`📍 Final URL: ${finalUrl}`);
        
        // Check if we're on dashboard
        if (finalUrl.includes('/dashboard')) {
          console.log('✅ SUCCESS: Redirected to dashboard');
        } else if (finalUrl.includes('/login')) {
          console.log('❌ ISSUE: Redirected to login page');
          
          // Check for error messages
          const errorText = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('[class*="error"], .error-message, [style*="color: red"]');
            for (let el of errorElements) {
              if (el.textContent.trim()) {
                return el.textContent.trim();
              }
            }
            return null;
          });
          
          if (errorText) {
            console.log(`🚨 Error message found: ${errorText}`);
          }
          
        } else {
          console.log('⚠️ UNCLEAR: Unexpected URL');
        }
        
        break;
      }
    }
    
    if (!buttonClicked) {
      console.log('❌ No auto-login button found');
    }
    
    // Test API directly to verify credentials
    console.log('\n🧪 Step 4: Direct API Test');
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'demo.beachbar@skan.al',
            password: 'BeachBarDemo2024!'
          }),
        });
        
        const text = await response.text();
        return {
          status: response.status,
          ok: response.ok,
          text: text.substring(0, 300),
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('📡 Direct API Test Results:');
    console.log(`   Status: ${apiResult.status}`);
    console.log(`   OK: ${apiResult.ok}`);
    console.log(`   Response: ${apiResult.text || apiResult.error}`);
    
  } catch (error) {
    console.error(`❌ Debug failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugAutoLogin();