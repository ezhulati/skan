/**
 * Robust Final Button Test
 * Tests buttons with DOM change handling
 */

const puppeteer = require('puppeteer');

async function robustButtonTest() {
  console.log('🎯 ROBUST BUTTON FUNCTIONALITY TEST');
  console.log('===================================');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Track alerts and console logs
    let alertTriggered = false;
    let buttonClicked = false;
    let statusUpdated = false;
    
    page.on('dialog', async dialog => {
      alertTriggered = true;
      console.log(`❌ UNEXPECTED ALERT: ${dialog.message()}`);
      await dialog.accept();
    });
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔥 BUTTON CLICKED!')) {
        buttonClicked = true;
        console.log(`✅ BUTTON CLICK DETECTED: ${text}`);
      }
      if (text.includes('Order status updated')) {
        statusUpdated = true;
        console.log(`✅ STATUS UPDATE DETECTED: ${text}`);
      }
    });
    
    // Navigate and login
    console.log('🌐 Navigating to admin portal...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('🔑 Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check initial state
    console.log('📊 Checking dashboard state...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const orderCards = await page.$$('.order-card');
    console.log(`Found ${orderCards.length} order cards`);
    
    if (orderCards.length === 0) {
      console.log('❌ No order cards found - cannot test buttons');
      return false;
    }
    
    // Test button click using CSS selector (avoids DOM detachment)
    console.log('🖱️ Testing button click with CSS selector...');
    
    try {
      // Use page.click with CSS selector to avoid element detachment
      await page.click('.status-button');
      console.log('✅ Button click executed');
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.log(`⚠️ Direct click failed: ${error.message}`);
      
      // Fallback: try clicking first available button
      try {
        await page.evaluate(() => {
          const button = document.querySelector('.status-button');
          if (button) {
            button.click();
            return true;
          }
          return false;
        });
        console.log('✅ Fallback button click executed');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (fallbackError) {
        console.log(`❌ Fallback click also failed: ${fallbackError.message}`);
      }
    }
    
    // Check final state
    console.log('📊 Checking final state...');
    const finalOrderCards = await page.$$('.order-card');
    console.log(`Found ${finalOrderCards.length} order cards after click`);
    
    // Test results
    console.log('\n🎯 TEST RESULTS:');
    console.log(`✅ Order Cards Found: ${orderCards.length > 0 ? 'YES' : 'NO'} (${orderCards.length})`);
    console.log(`✅ Button Click Detected: ${buttonClicked ? 'YES' : 'NO'}`);
    console.log(`✅ No Alert Popups: ${!alertTriggered ? 'YES' : 'NO'}`);
    console.log(`✅ Status Update Detected: ${statusUpdated ? 'YES' : 'NO'}`);
    console.log(`✅ Cards Still Present: ${finalOrderCards.length > 0 ? 'YES' : 'NO'} (${finalOrderCards.length})`);
    
    // Check for visual changes by counting different status sections
    const statusCounts = await page.evaluate(() => {
      const sections = document.querySelectorAll('.orders-container > div');
      return sections.length;
    });
    console.log(`✅ Status Sections: ${statusCounts}`);
    
    const success = orderCards.length > 0 && buttonClicked && !alertTriggered;
    
    console.log(`\n🎯 OVERALL: ${success ? '✅ SUCCESS!' : '❌ FAILED!'}`);
    
    if (success) {
      console.log('🎉 Core button functionality is working:');
      console.log('   • Buttons are clickable');
      console.log('   • No unwanted alert popups');
      console.log('   • Click events are being processed');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  robustButtonTest()
    .then((success) => {
      console.log('\n' + '='.repeat(60));
      if (success) {
        console.log('🎉 ROBUST BUTTON TEST - SUCCESS!');
        console.log('✅ Button functionality verified');
        console.log('✅ No unwanted popups');
        console.log('✅ Core requirements met');
      } else {
        console.log('⚠️ ROBUST BUTTON TEST - NEEDS WORK');
        console.log('❌ Some functionality still broken');
      }
    })
    .catch(console.error);
}

module.exports = robustButtonTest;