// Debug Button Click Issue
const puppeteer = require('puppeteer');

console.log('🔍 DEBUGGING BUTTON CLICK ISSUE');
console.log('===============================');

async function debugButtonClick() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Enable console and error logging
    page.on('console', (msg) => {
      console.log(`🖥️ Browser: ${msg.text()}`);
    });
    
    page.on('pageerror', (error) => {
      console.log(`🚨 Page Error: ${error.message}`);
    });
    
    // Navigate to demo page
    console.log('\n📋 Step 1: Navigate to Demo Page');
    await page.goto('http://localhost:3005/demo-request?success=true', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Demo page loaded');
    
    // Check page content
    const content = await page.content();
    if (content.includes('demo.beachbar@skan.al')) {
      console.log('✅ Credentials visible');
    } else {
      console.log('❌ Credentials not visible');
    }
    
    // Inject debugging
    console.log('\n🔧 Step 2: Inject Debug Code');
    await page.evaluate(() => {
      console.log('🔧 Injecting debug code...');
      
      // Override fetch to monitor API calls
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        console.log('🌐 API Call:', args[0]);
        try {
          const response = await originalFetch.apply(this, args);
          console.log('📡 API Response:', response.status, response.ok);
          return response;
        } catch (error) {
          console.log('❌ API Error:', error.message);
          throw error;
        }
      };
      
      // Override localStorage
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        console.log('💾 Setting localStorage:', key);
        return originalSetItem.call(this, key, value);
      };
      
      // Override window.location
      const originalLocation = window.location.href;
      Object.defineProperty(window.location, 'href', {
        set: function(url) {
          console.log('🚪 Redirecting to:', url);
          return originalLocation;
        },
        get: function() {
          return originalLocation;
        }
      });
      
      console.log('✅ Debug code injected');
    });
    
    // Get all buttons and their event handlers
    console.log('\n🔘 Step 3: Analyze Buttons');
    
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map((button, index) => ({
        index,
        text: button.textContent.trim(),
        type: button.type,
        onclick: button.onclick ? 'has onclick' : 'no onclick',
        listeners: getEventListeners ? 'checking...' : 'no devtools',
        disabled: button.disabled,
        className: button.className
      }));
    });
    
    console.log('🔘 Found buttons:');
    buttonInfo.forEach(button => {
      console.log(`  ${button.index}: "${button.text}" (${button.type}, ${button.onclick})`);
    });
    
    // Find and click the auto-login button
    console.log('\n🖱️ Step 4: Click Auto-Login Button');
    
    const buttons = await page.$$('button');
    let targetButton = null;
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await page.evaluate(el => el.textContent, buttons[i]);
      if (text && text.includes('Hyr')) {
        targetButton = buttons[i];
        console.log(`🎯 Target button found: "${text.trim()}"`);
        break;
      }
    }
    
    if (targetButton) {
      console.log('🖱️ Clicking button...');
      
      // Wait for any network activity
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('login') || response.url().includes('auth'), 
        { timeout: 10000 }
      ).catch(() => console.log('⏰ No API response detected'));
      
      // Click the button
      await targetButton.click();
      console.log('✅ Button clicked');
      
      // Wait for response or timeout
      await Promise.race([
        responsePromise,
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
      
      // Check what happened
      const newUrl = page.url();
      console.log(`📍 URL after click: ${newUrl}`);
      
      // Check localStorage
      const storage = await page.evaluate(() => {
        return {
          restaurantAuth: localStorage.getItem('restaurantAuth') ? 'set' : 'null',
          total_keys: Object.keys(localStorage).length
        };
      });
      
      console.log(`💾 LocalStorage: ${storage.restaurantAuth} (${storage.total_keys} keys)`);
      
    } else {
      console.log('❌ Auto-login button not found');
    }
    
  } catch (error) {
    console.error(`❌ Debug failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugButtonClick();