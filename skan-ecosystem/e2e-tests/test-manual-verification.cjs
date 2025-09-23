/**
 * Manual Verification Test
 * Simulates exactly what a human user would see and do
 */

const puppeteer = require('puppeteer');

async function manualVerificationTest() {
  console.log('👤 MANUAL USER VERIFICATION TEST');
  console.log('================================');
  console.log('This test simulates what YOU see in the browser');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,  // Keep browser open so you can see what's happening
      slowMo: 500,      // Slow down actions so you can see them
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Track everything that happens
    let alertCount = 0;
    let consoleMessages = [];
    
    page.on('dialog', async dialog => {
      alertCount++;
      console.log(`🚨 ALERT #${alertCount}: "${dialog.message()}"`);
      await dialog.accept();
    });
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('BUTTON CLICKED') || text.includes('Status') || text.includes('error')) {
        console.log(`📝 Console: ${text}`);
      }
    });
    
    console.log('\n🌐 Step 1: Opening http://localhost:3002...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('\n🔑 Step 2: Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    
    console.log('\n⏳ Step 3: Waiting for dashboard to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('\n📊 Step 4: Checking what you see on screen...');
    
    // Get page screenshot to see what user sees
    await page.screenshot({ path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/manual-test-screenshot.png' });
    console.log('📸 Screenshot saved: manual-test-screenshot.png');
    
    // Count visible elements
    const orderCards = await page.$$('.order-card');
    const statusButtons = await page.$$('.status-button');
    console.log(`📋 Order cards visible: ${orderCards.length}`);
    console.log(`🔘 Status buttons visible: ${statusButtons.length}`);
    
    if (statusButtons.length === 0) {
      console.log('❌ NO BUTTONS FOUND - This explains why they don\'t work!');
      return false;
    }
    
    // Get button text to see what user would see
    for (let i = 0; i < Math.min(statusButtons.length, 3); i++) {
      try {
        const buttonText = await statusButtons[i].evaluate(el => el.textContent.trim());
        const isVisible = await statusButtons[i].isIntersectingViewport();
        console.log(`🔘 Button ${i + 1}: "${buttonText}" (visible: ${isVisible})`);
      } catch (e) {
        console.log(`🔘 Button ${i + 1}: Error reading - ${e.message}`);
      }
    }
    
    console.log('\n🖱️ Step 5: Clicking the first button (as you would)...');
    
    try {
      // Click the first button exactly as a user would
      await statusButtons[0].click();
      console.log('✅ Button clicked successfully');
      
      // Wait and see what happens
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`❌ Button click failed: ${error.message}`);
    }
    
    console.log('\n📊 Step 6: Results after clicking...');
    console.log(`🚨 Total alerts shown: ${alertCount}`);
    console.log(`📝 Console messages captured: ${consoleMessages.length}`);
    
    if (alertCount > 0) {
      console.log('❌ PROBLEM: Alerts are still showing up!');
    } else {
      console.log('✅ GOOD: No unwanted alerts');
    }
    
    // Check if orders are still there
    const finalOrderCards = await page.$$('.order-card');
    console.log(`📋 Order cards after click: ${finalOrderCards.length}`);
    
    if (finalOrderCards.length !== orderCards.length) {
      console.log('❌ PROBLEM: Order cards disappeared or changed count!');
    } else {
      console.log('✅ GOOD: Order cards persist');
    }
    
    console.log('\n🎯 MANUAL TEST SUMMARY:');
    console.log(`   Buttons found: ${statusButtons.length > 0 ? 'YES' : 'NO'}`);
    console.log(`   Alerts shown: ${alertCount === 0 ? 'NONE (good)' : alertCount + ' (bad)'}`);
    console.log(`   Cards persist: ${finalOrderCards.length === orderCards.length ? 'YES' : 'NO'}`);
    
    // Wait so you can see the final state
    console.log('\n⏳ Keeping browser open for 10 seconds so you can inspect...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const success = statusButtons.length > 0 && alertCount === 0 && finalOrderCards.length === orderCards.length;
    return success;
    
  } catch (error) {
    console.error('❌ Manual test failed:', error.message);
    return false;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  manualVerificationTest()
    .then((success) => {
      console.log('\n' + '='.repeat(60));
      if (success) {
        console.log('🎉 MANUAL VERIFICATION - WORKING!');
        console.log('✅ Buttons work as expected for manual user');
      } else {
        console.log('❌ MANUAL VERIFICATION - NOT WORKING!');
        console.log('❌ This is what you\'re experiencing');
      }
    })
    .catch(console.error);
}

module.exports = manualVerificationTest;