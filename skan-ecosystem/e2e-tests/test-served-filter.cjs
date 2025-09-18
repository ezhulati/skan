const { chromium } = require('playwright');

async function testServedFilter() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Served Filter Specifically');
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

    console.log('1. Looking for a READY order to change to SERVED:');
    
    // Check all tabs to find a READY order
    await page.click('button:has-text("Gati")');
    await page.waitForTimeout(1000);
    
    const readyCount = await page.locator('.order-card').count();
    console.log(`   Found ${readyCount} orders in "Gati" tab`);
    
    if (readyCount > 0) {
      const readyOrderNumber = await page.locator('.order-card').first().locator('.order-number').textContent();
      const readyOrderStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
      console.log(`   Order: ${readyOrderNumber} - Status: ${readyOrderStatus?.trim()}`);
      
      console.log('\n2. Changing READY order to SERVED...');
      
      // Click the status button to change READY → SERVED
      await page.locator('.order-card').first().locator('button.status-button').click();
      await page.waitForTimeout(2000);
      
      // Check if undo toast appeared
      const undoToast = await page.locator('.undo-toast').count();
      if (undoToast > 0) {
        console.log('   Undo toast appeared - dismissing...');
        await page.click('.dismiss-button');
        await page.waitForTimeout(1000);
      }
      
      console.log('\n3. Checking "Shërbyer" tab:');
      
      // Switch to Served tab
      await page.click('button:has-text("Shërbyer")');
      await page.waitForTimeout(1500);
      
      const servedCount = await page.locator('.order-card').count();
      console.log(`   "Shërbyer" tab shows: ${servedCount} orders`);
      
      if (servedCount > 0) {
        const servedOrderNumber = await page.locator('.order-card').first().locator('.order-number').textContent();
        const servedOrderStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
        console.log(`   Order: ${servedOrderNumber} - Status: ${servedOrderStatus?.trim()}`);
        
        if (servedOrderNumber === readyOrderNumber && servedOrderStatus?.trim() === 'SERVED') {
          console.log('   ✅ SUCCESS: Order correctly moved to SERVED tab!');
        } else {
          console.log('   ❌ ISSUE: Order not found or wrong status in SERVED tab');
        }
      } else {
        console.log('   ❌ ISSUE: No orders found in SERVED tab');
        
        // Debug: Check if order is still in other tabs
        console.log('\n4. Debug - checking where the order went:');
        
        const tabs = ['Të gjitha', 'Aktive', 'Të reja', 'Duke u përgatitur', 'Gati'];
        for (const tab of tabs) {
          await page.click(`button:has-text("${tab}")`);
          await page.waitForTimeout(500);
          const count = await page.locator('.order-card').count();
          
          if (count > 0) {
            const firstOrderNumber = await page.locator('.order-card').first().locator('.order-number').textContent();
            const firstOrderStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
            if (firstOrderNumber === readyOrderNumber) {
              console.log(`   Found target order in "${tab}" tab - Status: ${firstOrderStatus?.trim()}`);
            }
          }
          console.log(`   ${tab}: ${count} orders`);
        }
      }
    } else {
      console.log('   ❌ No READY orders found to test with');
      
      // Try to create a workflow from NEW to SERVED
      console.log('\n2. Trying full workflow NEW → PREPARING → READY → SERVED:');
      
      await page.click('button:has-text("Të reja")');
      await page.waitForTimeout(1000);
      
      const newCount = await page.locator('.order-card').count();
      if (newCount > 0) {
        const newOrderNumber = await page.locator('.order-card').first().locator('.order-number').textContent();
        console.log(`   Starting with NEW order: ${newOrderNumber}`);
        
        // NEW → PREPARING
        await page.locator('.order-card').first().locator('button.status-button').click();
        await page.waitForTimeout(1500);
        if (await page.locator('.undo-toast').count() > 0) {
          await page.click('.dismiss-button');
          await page.waitForTimeout(1000);
        }
        
        // PREPARING → READY
        await page.click('button:has-text("Duke u përgatitur")');
        await page.waitForTimeout(1000);
        if (await page.locator('.order-card').count() > 0) {
          await page.locator('.order-card').first().locator('button.status-button').click();
          await page.waitForTimeout(1500);
          if (await page.locator('.undo-toast').count() > 0) {
            await page.click('.dismiss-button');
            await page.waitForTimeout(1000);
          }
        }
        
        // READY → SERVED
        await page.click('button:has-text("Gati")');
        await page.waitForTimeout(1000);
        if (await page.locator('.order-card').count() > 0) {
          await page.locator('.order-card').first().locator('button.status-button').click();
          await page.waitForTimeout(1500);
          if (await page.locator('.undo-toast').count() > 0) {
            await page.click('.dismiss-button');
            await page.waitForTimeout(1000);
          }
        }
        
        // Check final result
        await page.click('button:has-text("Shërbyer")');
        await page.waitForTimeout(1500);
        
        const finalServedCount = await page.locator('.order-card').count();
        console.log(`   Final "Shërbyer" tab shows: ${finalServedCount} orders`);
        
        if (finalServedCount > 0) {
          console.log('   ✅ SUCCESS: Full workflow completed!');
        } else {
          console.log('   ❌ ISSUE: Full workflow failed');
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

testServedFilter().catch(console.error);