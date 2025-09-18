const { chromium } = require('playwright');

async function testFullWorkflowFixed() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Full Status Workflow (Fixed)');
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

    const filterIndices = {
      'all': 0,
      'active': 1, 
      'new': 2,
      'preparing': 3,
      'ready': 4,
      'served': 5
    };

    console.log('1. Initial state:');
    await page.locator('.filter-button').nth(filterIndices.all).click();
    await page.waitForTimeout(1000);
    
    const allCount = await page.locator('.order-card').count();
    console.log(`   Total orders: ${allCount}`);
    
    for (let i = 0; i < allCount; i++) {
      const orderNum = await page.locator('.order-card').nth(i).locator('.order-number').textContent();
      const status = await page.locator('.order-card').nth(i).locator('.order-status').textContent();
      console.log(`   ${orderNum}: ${status?.trim()}`);
    }

    console.log('\n2. Testing READY → SERVED workflow:');
    
    // Go to READY orders
    await page.locator('.filter-button').nth(filterIndices.ready).click();
    await page.waitForTimeout(1000);
    
    const readyCount = await page.locator('.order-card').count();
    console.log(`   READY orders found: ${readyCount}`);
    
    if (readyCount > 0) {
      const readyOrderNum = await page.locator('.order-card').first().locator('.order-number').textContent();
      const readyOrderStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
      console.log(`   Changing ${readyOrderNum} from ${readyOrderStatus?.trim()} to SERVED...`);
      
      // Click the status button (READY → SERVED)
      await page.locator('.order-card').first().locator('button.status-button').click();
      await page.waitForTimeout(2000);
      
      // Dismiss undo toast
      if (await page.locator('.undo-toast').count() > 0) {
        console.log('   Dismissing undo toast...');
        await page.click('.dismiss-button');
        await page.waitForTimeout(1000);
      }
      
      console.log('\n3. Checking SERVED filter:');
      
      // Go to SERVED tab using index
      await page.locator('.filter-button').nth(filterIndices.served).click();
      await page.waitForTimeout(1500);
      
      const servedCount = await page.locator('.order-card').count();
      console.log(`   SERVED tab shows: ${servedCount} orders`);
      
      if (servedCount > 0) {
        const servedOrderNum = await page.locator('.order-card').first().locator('.order-number').textContent();
        const servedOrderStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
        console.log(`   Order: ${servedOrderNum} - Status: ${servedOrderStatus?.trim()}`);
        
        if (servedOrderNum === readyOrderNum && servedOrderStatus?.trim() === 'SERVED') {
          console.log('   🎉 SUCCESS: READY → SERVED workflow works perfectly!');
        } else {
          console.log('   ❌ Issue with SERVED workflow');
        }
      } else {
        console.log('   ❌ No orders found in SERVED tab');
        
        // Debug: check all tabs
        console.log('\n4. Debug - checking all tabs:');
        const tabs = ['all', 'active', 'new', 'preparing', 'ready', 'served'];
        for (const tab of tabs) {
          await page.locator('.filter-button').nth(filterIndices[tab]).click();
          await page.waitForTimeout(500);
          const count = await page.locator('.order-card').count();
          console.log(`   ${tab}: ${count} orders`);
          
          if (count > 0) {
            for (let i = 0; i < Math.min(count, 2); i++) {
              const orderNum = await page.locator('.order-card').nth(i).locator('.order-number').textContent();
              const status = await page.locator('.order-card').nth(i).locator('.order-status').textContent();
              if (orderNum === readyOrderNum) {
                console.log(`     Found ${readyOrderNum} here with status: ${status?.trim()}`);
              }
            }
          }
        }
      }
    } else {
      console.log('   ❌ No READY orders to test with');
    }

    console.log('\n5. Final test - complete NEW → SERVED workflow:');
    
    // Start fresh with a NEW order
    await page.locator('.filter-button').nth(filterIndices.new).click();
    await page.waitForTimeout(1000);
    
    const newCount = await page.locator('.order-card').count();
    if (newCount > 0) {
      const testOrderNum = await page.locator('.order-card').first().locator('.order-number').textContent();
      console.log(`   Starting complete workflow with ${testOrderNum}`);
      
      // NEW → PREPARING
      await page.locator('.order-card').first().locator('button.status-button').click();
      await page.waitForTimeout(1500);
      if (await page.locator('.undo-toast').count() > 0) {
        await page.click('.dismiss-button');
        await page.waitForTimeout(1000);
      }
      console.log(`   ${testOrderNum}: NEW → PREPARING ✅`);
      
      // PREPARING → READY
      await page.locator('.filter-button').nth(filterIndices.preparing).click();
      await page.waitForTimeout(1000);
      if (await page.locator('.order-card').count() > 0) {
        await page.locator('.order-card').first().locator('button.status-button').click();
        await page.waitForTimeout(1500);
        if (await page.locator('.undo-toast').count() > 0) {
          await page.click('.dismiss-button');
          await page.waitForTimeout(1000);
        }
        console.log(`   ${testOrderNum}: PREPARING → READY ✅`);
        
        // READY → SERVED
        await page.locator('.filter-button').nth(filterIndices.ready).click();
        await page.waitForTimeout(1000);
        if (await page.locator('.order-card').count() > 0) {
          await page.locator('.order-card').first().locator('button.status-button').click();
          await page.waitForTimeout(1500);
          if (await page.locator('.undo-toast').count() > 0) {
            await page.click('.dismiss-button');
            await page.waitForTimeout(1000);
          }
          console.log(`   ${testOrderNum}: READY → SERVED ✅`);
          
          // Check final result
          await page.locator('.filter-button').nth(filterIndices.served).click();
          await page.waitForTimeout(1500);
          
          const finalServedCount = await page.locator('.order-card').count();
          if (finalServedCount > 0) {
            const finalOrderNum = await page.locator('.order-card').first().locator('.order-number').textContent();
            if (finalOrderNum === testOrderNum) {
              console.log('   🎉🎉🎉 COMPLETE WORKFLOW SUCCESS! 🎉🎉🎉');
            } else {
              console.log('   ❌ Wrong order in SERVED tab');
            }
          } else {
            console.log('   ❌ No orders in final SERVED tab');
          }
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testFullWorkflowFixed().catch(console.error);