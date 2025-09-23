/**
 * Final Button Verification Test
 * Tests that buttons work without popups and update order status correctly
 */

const puppeteer = require('puppeteer');

async function finalButtonTest() {
  console.log('🎯 FINAL BUTTON VERIFICATION TEST');
  console.log('=================================');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Listen for alerts (should NOT happen now)
    let alertTriggered = false;
    page.on('dialog', async dialog => {
      alertTriggered = true;
      console.log(`❌ UNEXPECTED ALERT: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Listen for console logs to debug
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔥 BUTTON CLICKED!') || 
          text.includes('Order status updated') || 
          text.includes('handleStatusUpdate') ||
          text.includes('ERROR') ||
          text.includes('error')) {
        console.log(`🔍 CONSOLE: ${text}`);
      }
    });
    
    // Step 1: Navigate to admin portal
    console.log('🌐 Navigating to admin portal...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Step 2: Login
    console.log('🔑 Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 3: Check for orders and buttons
    console.log('📊 Checking dashboard...');
    const orderCards = await page.$$('.order-card');
    console.log(`Found ${orderCards.length} order cards`);
    
    const statusButtons = await page.$$('.status-button');
    console.log(`Found ${statusButtons.length} status buttons`);
    
    if (statusButtons.length === 0) {
      console.log('❌ No status buttons found - test failed');
      return false;
    }
    
    // Step 4: Test button click
    console.log('🖱️ Testing button click...');
    
    // Get initial order count by status
    const initialState = await page.evaluate(() => {
      const cards = document.querySelectorAll('.order-card');
      const status = {};
      cards.forEach(card => {
        const statusElement = card.querySelector('.order-status');
        if (statusElement) {
          const text = statusElement.textContent.trim();
          status[text] = (status[text] || 0) + 1;
        }
      });
      return status;
    });
    
    console.log('📊 Initial status distribution:', initialState);
    
    // Click first button
    await statusButtons[0].click();
    
    // Wait for UI update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if status changed
    const finalState = await page.evaluate(() => {
      const cards = document.querySelectorAll('.order-card');
      const status = {};
      cards.forEach(card => {
        const statusElement = card.querySelector('.order-status');
        if (statusElement) {
          const text = statusElement.textContent.trim();
          status[text] = (status[text] || 0) + 1;
        }
      });
      return status;
    });
    
    console.log('📊 Final status distribution:', finalState);
    
    // Verify results
    const statusChanged = JSON.stringify(initialState) !== JSON.stringify(finalState);
    const noAlertsTriggered = !alertTriggered;
    
    console.log('\n🎯 TEST RESULTS:');
    console.log(`✅ Status Updated: ${statusChanged ? 'YES' : 'NO'}`);
    console.log(`✅ No Alert Popups: ${noAlertsTriggered ? 'YES' : 'NO'}`);
    console.log(`✅ Buttons Found: ${statusButtons.length > 0 ? 'YES' : 'NO'}`);
    
    const success = statusChanged && noAlertsTriggered && statusButtons.length > 0;
    
    console.log(`\n🎯 OVERALL: ${success ? '✅ SUCCESS!' : '❌ FAILED!'}`);
    
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
  finalButtonTest()
    .then((success) => {
      console.log('\n' + '='.repeat(50));
      if (success) {
        console.log('🎉 FINAL VERIFICATION - SUCCESS!');
        console.log('✅ Buttons work without popups');
        console.log('✅ Order status updates correctly');
        console.log('✅ UI responds immediately');
      } else {
        console.log('⚠️ FINAL VERIFICATION - NEEDS WORK');
        console.log('❌ Some functionality still broken');
      }
    })
    .catch(console.error);
}

module.exports = finalButtonTest;