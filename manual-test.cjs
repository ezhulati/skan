// Manual test script to validate the optimized frontend
const { chromium } = require('playwright-core');

async function runTests() {
  console.log('🧪 Starting Skan.al Frontend Tests...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Test 1: QR Landing Page Performance
    console.log('📱 Test 1: QR Landing Page Performance');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/order/beach-bar-durres/a1');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`   ✅ Page loaded in ${loadTime}ms`);
    
    // Check elements are visible
    const venueTitle = await page.locator('h1').textContent();
    const tableNumber = await page.locator('.table-number').textContent();
    
    console.log(`   ✅ Venue: ${venueTitle}`);
    console.log(`   ✅ Table: ${tableNumber}\n`);
    
    // Test 2: Mobile Responsiveness
    console.log('📱 Test 2: Mobile Responsiveness');
    await page.setViewportSize({ width: 375, height: 667 });
    
    const continueButton = page.locator('.continue-button');
    const buttonBox = await continueButton.boundingBox();
    
    console.log(`   ✅ Button size: ${buttonBox.width}x${buttonBox.height}px`);
    console.log(`   ✅ Touch-friendly: ${buttonBox.height >= 44 ? 'Yes' : 'No'}\n`);
    
    // Test 3: Navigation Flow
    console.log('🍽️ Test 3: Navigation to Menu');
    await continueButton.click();
    await page.waitForLoadState('domcontentloaded');
    
    const currentUrl = page.url();
    const menuVisible = await page.locator('.menu-content').isVisible();
    
    console.log(`   ✅ URL: ${currentUrl}`);
    console.log(`   ✅ Menu visible: ${menuVisible}\n`);
    
    // Test 4: Cart Functionality
    console.log('🛒 Test 4: Cart Functionality');
    
    // Reset to desktop view for better interaction
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const addButtons = page.locator('.add-button');
    const addButtonCount = await addButtons.count();
    
    if (addButtonCount > 0) {
      await addButtons.first().click();
      
      const cartSummary = await page.locator('.cart-summary').isVisible();
      const cartText = await page.locator('.cart-info').textContent();
      
      console.log(`   ✅ Add buttons available: ${addButtonCount}`);
      console.log(`   ✅ Cart summary visible: ${cartSummary}`);
      console.log(`   ✅ Cart content: ${cartText}\n`);
    }
    
    // Test 5: Performance Metrics
    console.log('⚡ Test 5: Performance Analysis');
    
    // Measure paint timing
    const paintTiming = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('paint'));
    });
    
    console.log(`   ✅ Paint timing: ${paintTiming}\n`);
    
    // Test 6: Error Handling
    console.log('❌ Test 6: Error Handling');
    await page.goto('http://localhost:3000/order/invalid-venue/a1');
    await page.waitForLoadState('domcontentloaded');
    
    const errorVisible = await page.locator('.error-container').isVisible();
    const errorText = await page.locator('h2').textContent();
    
    console.log(`   ✅ Error page visible: ${errorVisible}`);
    console.log(`   ✅ Error message: ${errorText}\n`);
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if servers are running
async function checkServers() {
  const http = require('http');
  
  const checkServer = (port, name) => {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        console.log(`✅ ${name} is running on port ${port}`);
        resolve(true);
      });
      
      req.on('error', () => {
        console.log(`❌ ${name} is not running on port ${port}`);
        resolve(false);
      });
      
      req.setTimeout(2000, () => {
        console.log(`⏰ ${name} connection timeout on port ${port}`);
        req.destroy();
        resolve(false);
      });
    });
  };
  
  console.log('🔍 Checking servers...');
  const apiRunning = await checkServer(5000, 'API Server');
  const frontendRunning = await checkServer(3000, 'Frontend');
  const dashboardRunning = await checkServer(3001, 'Dashboard');
  
  if (apiRunning && frontendRunning) {
    console.log('✅ All required servers are running\n');
    return true;
  } else {
    console.log('❌ Some servers are not running. Please start them first.\n');
    return false;
  }
}

// Main execution
(async () => {
  const serversOk = await checkServers();
  if (serversOk) {
    await runTests();
  } else {
    console.log('Please run:');
    console.log('1. node local-api-server.cjs  (starts on port 5000)');
    console.log('2. cd customer-frontend && npm start  (starts on port 3000)');
    console.log('3. cd restaurant-dashboard && PORT=3001 npm start  (starts on port 3001)');
  }
})();