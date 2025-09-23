/**
 * Status Mapping Test - Check console logs for status updates
 */

const puppeteer = require('puppeteer');

async function testStatusMapping() {
  console.log('🎯 STATUS MAPPING TEST');
  console.log('=======================');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Collect console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('🔥 BUTTON CLICKED!')) {
        console.log(`🖱️ ${text}`);
      }
    });
    
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type=\"password\"]', 'BeachBarDemo2024!');
    await page.click('button[type=\"submit\"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click button and watch console
    console.log('🖱️ Clicking status button...');
    await page.click('.status-button');
    
    // Wait for logs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for specific status update logs
    const statusLogs = logs.filter(log => log.includes('🔥 BUTTON CLICKED!'));
    
    console.log('\n📋 RESULTS:');
    console.log(`✅ Status Update Logs Found: ${statusLogs.length}`);
    
    statusLogs.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log}`);
    });
    
    if (statusLogs.length > 0) {
      console.log('🎉 SUCCESS: Status mapping is working!');
      return true;
    } else {
      console.log('❌ FAILED: No status updates detected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
    
  } finally {
    if (browser) {
      setTimeout(() => browser.close(), 3000); // Keep open briefly
    }
  }
}

// Run the test
if (require.main === module) {
  testStatusMapping()
    .then((success) => {
      console.log('\n' + '='.repeat(50));
      if (success) {
        console.log('🎉 STATUS MAPPING - WORKING!');
      } else {
        console.log('❌ STATUS MAPPING - NOT WORKING');
      }
    })
    .catch(console.error);
}

module.exports = testStatusMapping;