const { chromium } = require('playwright');

async function testButtonIndex() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Filter Buttons by Index');
    console.log('='.repeat(50));

    // Setup auth and navigate
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const mockAuth = {
        user: {
          id: "demo-user-1",
          email: "manager_email1@gmail.com",
          fullName: "Demo Manager",
          role: "manager",
          venueId: "demo-venue-1"
        },
        venue: {
          id: "demo-venue-1",
          name: "Demo Restaurant",
          slug: "demo-restaurant"
        },
        token: "valid-demo-token-123"
      };
      localStorage.setItem('restaurantAuth', JSON.stringify(mockAuth));
    });

    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(4000);

    console.log('1. Testing buttons by index:');
    
    const expectedFilters = [
      { index: 0, name: 'Të gjitha', status: 'all' },
      { index: 1, name: 'Aktive', status: 'active' },
      { index: 2, name: 'Të reja', status: 'new' },
      { index: 3, name: 'Duke u përgatitur', status: 'preparing' },
      { index: 4, name: 'Gati', status: 'ready' },
      { index: 5, name: 'Shërbyer', status: 'served' }
    ];

    for (const filter of expectedFilters) {
      console.log(`\n   Testing button ${filter.index}: ${filter.name} (${filter.status})`);
      
      // Click by index instead of text
      await page.locator('.filter-button').nth(filter.index).click();
      await page.waitForTimeout(1000);
      
      // Check which button is now active
      const activeButton = await page.locator('.filter-button.active').textContent();
      const orderCount = await page.locator('.order-card').count();
      
      console.log(`     Active button: "${activeButton}"`);
      console.log(`     Orders shown: ${orderCount}`);
      
      // Get statuses of visible orders
      if (orderCount > 0) {
        const orderStatuses = [];
        for (let i = 0; i < Math.min(orderCount, 3); i++) {
          const orderNum = await page.locator('.order-card').nth(i).locator('.order-number').textContent();
          const status = await page.locator('.order-card').nth(i).locator('.order-status').textContent();
          orderStatuses.push(`${orderNum}:${status?.trim()}`);
        }
        console.log(`     Orders: ${orderStatuses.join(', ')}`);
      }
      
      // Validate results
      if (activeButton === filter.name) {
        console.log(`     ✅ Button click worked correctly`);
      } else {
        console.log(`     ❌ Button click failed - expected "${filter.name}", got "${activeButton}"`);
      }
    }

    console.log('\n2. Testing specific scenario - READY status:');
    
    // Click the Gati button by index (should be index 4)
    await page.locator('.filter-button').nth(4).click();
    await page.waitForTimeout(1000);
    
    const readyCount = await page.locator('.order-card').count();
    console.log(`   Clicking "Gati" (index 4) shows ${readyCount} orders`);
    
    if (readyCount > 0) {
      const readyOrder = await page.locator('.order-card').first().locator('.order-number').textContent();
      const readyStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
      console.log(`   Order: ${readyOrder} - Status: ${readyStatus?.trim()}`);
      
      if (readyStatus?.trim() === 'READY') {
        console.log('   ✅ READY filter working correctly!');
      } else {
        console.log(`   ❌ READY filter broken - showing ${readyStatus?.trim()} instead of READY`);
      }
    } else {
      console.log('   ❌ No orders shown in READY filter');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testButtonIndex().catch(console.error);