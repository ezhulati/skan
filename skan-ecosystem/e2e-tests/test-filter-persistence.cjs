const { chromium } = require('playwright');

async function testFilterPersistence() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console messages for debugging
  page.on('console', msg => {
    if (msg.text().includes('loadOrders') || msg.text().includes('Mock') || msg.text().includes('status')) {
      console.log(`Browser [${msg.type()}]: ${msg.text()}`);
    }
  });

  try {
    console.log('🔍 Testing Filter Persistence Issue');
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

    console.log('1. Initial state:');
    const initialOrders = await page.locator('.order-card').count();
    console.log(`   Total orders: ${initialOrders}`);

    // Get initial order status
    if (initialOrders > 0) {
      const firstOrderStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
      const firstOrderNumber = await page.locator('.order-card').first().locator('.order-number').textContent();
      console.log(`   First order: ${firstOrderNumber} - Status: ${firstOrderStatus?.trim()}`);

      if (firstOrderStatus?.trim() === 'NEW') {
        console.log('\n2. Changing NEW order to PREPARING...');
        
        // Click status button
        await page.locator('.order-card').first().locator('button.status-button').click();
        await page.waitForTimeout(2000);

        // Check if status changed
        const newStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
        console.log(`   Status after change: ${newStatus?.trim()}`);

        // Dismiss undo toast
        const undoToast = await page.locator('.undo-toast').count();
        if (undoToast > 0) {
          console.log('   Dismissing undo toast...');
          await page.click('.dismiss-button');
          await page.waitForTimeout(1000);
        }

        console.log('\n3. Testing filter persistence:');
        
        // Test switching to "Duke u përgatitur" tab
        await page.click('button:has-text("Duke u përgatitur")');
        await page.waitForTimeout(1500);
        
        const preparingCount = await page.locator('.order-card').count();
        console.log(`   "Duke u përgatitur" tab shows: ${preparingCount} orders`);
        
        if (preparingCount > 0) {
          const orderInPreparing = await page.locator('.order-card').first().locator('.order-number').textContent();
          const statusInPreparing = await page.locator('.order-card').first().locator('.order-status').textContent();
          console.log(`   First order in tab: ${orderInPreparing} - Status: ${statusInPreparing?.trim()}`);
          
          if (orderInPreparing === firstOrderNumber) {
            console.log('   ✅ Order correctly moved to PREPARING tab');
            
            // Now test switching back and forth
            console.log('\n4. Testing filter switches:');
            
            await page.click('button:has-text("Të gjitha")');
            await page.waitForTimeout(1000);
            const allCount = await page.locator('.order-card').count();
            console.log(`   "Të gjitha" shows: ${allCount} orders`);
            
            await page.click('button:has-text("Duke u përgatitur")');
            await page.waitForTimeout(1000);
            const preparingCount2 = await page.locator('.order-card').count();
            console.log(`   "Duke u përgatitur" shows: ${preparingCount2} orders`);
            
            if (preparingCount2 === preparingCount) {
              console.log('   ✅ Filter persistence working correctly');
            } else {
              console.log('   ❌ Filter persistence broken - count changed');
            }
          } else {
            console.log('   ❌ Wrong order in PREPARING tab');
          }
        } else {
          console.log('   ❌ No orders found in PREPARING tab');
        }
      } else {
        console.log('   ❌ First order is not NEW, cannot test workflow');
      }
    } else {
      console.log('   ❌ No orders found');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testFilterPersistence().catch(console.error);