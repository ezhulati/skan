const { chromium } = require('playwright');

async function testSimpleStatusFilter() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Simple Status Filter Fix');
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

    console.log('1. Checking initial orders on "Të gjitha" tab:');
    const allOrdersCount = await page.locator('.order-card').count();
    console.log(`   Total orders: ${allOrdersCount}`);

    if (allOrdersCount > 0) {
      // Get status of each order
      const orderStatuses = [];
      for (let i = 0; i < allOrdersCount; i++) {
        const orderCard = page.locator('.order-card').nth(i);
        const orderNumber = await orderCard.locator('.order-number').textContent();
        const status = await orderCard.locator('.order-status').textContent();
        orderStatuses.push({ orderNumber: orderNumber?.trim(), status: status?.trim() });
      }
      
      console.log('   Order statuses:');
      orderStatuses.forEach(order => {
        console.log(`     ${order.orderNumber}: ${order.status}`);
      });

      // Test changing a status
      console.log('\n2. Testing status change:');
      const firstStatusButton = page.locator('button.status-button').first();
      const buttonVisible = await firstStatusButton.isVisible();
      
      if (buttonVisible) {
        const buttonText = await firstStatusButton.textContent();
        console.log(`   Clicking: "${buttonText?.trim()}"`);
        
        await firstStatusButton.click();
        await page.waitForTimeout(2000);
        
        // Dismiss undo toast if present
        const undoToast = await page.locator('.undo-toast').count();
        if (undoToast > 0) {
          await page.click('.dismiss-button');
          await page.waitForTimeout(1000);
        }
        
        console.log('   Status change completed');
        
        // Check updated statuses
        console.log('\n3. Updated order statuses:');
        const updatedStatuses = [];
        for (let i = 0; i < allOrdersCount; i++) {
          const orderCard = page.locator('.order-card').nth(i);
          const orderNumber = await orderCard.locator('.order-number').textContent();
          const status = await orderCard.locator('.order-status').textContent();
          updatedStatuses.push({ orderNumber: orderNumber?.trim(), status: status?.trim() });
        }
        
        updatedStatuses.forEach(order => {
          console.log(`     ${order.orderNumber}: ${order.status}`);
        });
        
        // Test filtering - click "Shërbyer" tab
        console.log('\n4. Testing "Shërbyer" filter:');
        await page.click('button:has-text("Shërbyer")');
        await page.waitForTimeout(1500);
        
        const servedOrdersCount = await page.locator('.order-card').count();
        console.log(`   Orders in "Shërbyer" tab: ${servedOrdersCount}`);
        
        if (servedOrdersCount > 0) {
          console.log('   ✅ Served orders found in filter!');
          for (let i = 0; i < servedOrdersCount; i++) {
            const orderCard = page.locator('.order-card').nth(i);
            const orderNumber = await orderCard.locator('.order-number').textContent();
            const status = await orderCard.locator('.order-status').textContent();
            console.log(`     ${orderNumber?.trim()}: ${status?.trim()}`);
          }
        } else {
          console.log('   ❌ No served orders found in filter');
        }
        
        // Test other filters
        console.log('\n5. Testing other filters:');
        const filters = ['Të gjitha', 'Aktive', 'Të reja', 'Duke u përgatitur', 'Gati'];
        
        for (const filter of filters) {
          await page.click(`button:has-text("${filter}")`);
          await page.waitForTimeout(500);
          const count = await page.locator('.order-card').count();
          console.log(`   ${filter}: ${count} orders`);
        }
        
      } else {
        console.log('   ❌ No status buttons visible');
      }
    } else {
      console.log('   ❌ No orders found');
    }

    console.log('\n6. ✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testSimpleStatusFilter().catch(console.error);