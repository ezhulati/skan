const { chromium } = require('playwright');

async function testStatusFilteringWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console messages
  page.on('console', msg => {
    if (msg.text().includes('status') || msg.text().includes('Mock') || msg.text().includes('Error')) {
      console.log(`Browser [${msg.type()}]: ${msg.text()}`);
    }
  });

  try {
    console.log('🔍 Testing Complete Status Filtering Workflow');
    console.log('='.repeat(60));

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

    // Function to count orders by filter
    async function countOrdersByFilter(filterName) {
      await page.click(`button:has-text("${filterName}")`);
      await page.waitForTimeout(1000);
      const count = await page.locator('.order-card').count();
      return count;
    }

    // Function to get order statuses in current view
    async function getOrderStatuses() {
      const statusElements = await page.locator('.order-status').all();
      const statuses = [];
      for (const el of statusElements) {
        const status = await el.textContent();
        statuses.push(status?.trim());
      }
      return statuses;
    }

    console.log('1. Initial state analysis:');
    
    // Test all filter tabs
    const filters = ['Të gjitha', 'Aktive', 'Të reja', 'Duke u përgatitur', 'Gati', 'Shërbyer'];
    const initialCounts = {};
    
    for (const filter of filters) {
      const count = await countOrdersByFilter(filter);
      initialCounts[filter] = count;
      const statuses = await getOrderStatuses();
      console.log(`   ${filter}: ${count} orders (${statuses.join(', ')})`);
    }

    // Go back to "Të gjitha" to start test
    await page.click('button:has-text("Të gjitha")');
    await page.waitForTimeout(1000);

    console.log('\n2. Testing status change workflow:');

    // Find an order with "NEW" status
    const orderCards = await page.locator('.order-card').all();
    let testOrder = null;
    let testOrderIndex = -1;

    for (let i = 0; i < orderCards.length; i++) {
      const statusEl = orderCards[i].locator('.order-status');
      const status = await statusEl.textContent();
      if (status?.trim() === 'NEW') {
        testOrder = orderCards[i];
        testOrderIndex = i;
        break;
      }
    }

    if (testOrder) {
      const orderNumber = await testOrder.locator('.order-number').textContent();
      console.log(`   Found NEW order: ${orderNumber}`);

      // Step 1: Change NEW → PREPARING
      console.log('\n3. Step 1: NEW → PREPARING');
      const acceptButton = testOrder.locator('button.status-button');
      const buttonText = await acceptButton.textContent();
      console.log(`   Clicking: "${buttonText?.trim()}"`);
      
      await acceptButton.click();
      await page.waitForTimeout(2000);

      // Check if status changed in current view
      const newStatus = await testOrder.locator('.order-status').textContent();
      console.log(`   Status after click: ${newStatus?.trim()}`);

      // Dismiss undo toast if it appears
      const undoToast = await page.locator('.undo-toast').count();
      if (undoToast > 0) {
        console.log('   Dismissing undo toast...');
        await page.click('.dismiss-button');
        await page.waitForTimeout(1000);
      }

      // Test filter behavior
      console.log('\n4. Testing filter behavior after status change:');
      
      // Check "Të reja" filter (should have one less NEW order)
      const newCount = await countOrdersByFilter('Të reja');
      console.log(`   "Të reja" now has: ${newCount} orders (was ${initialCounts['Të reja']})`);
      
      // Check "Duke u përgatitur" filter (should have the moved order)
      const preparingCount = await countOrdersByFilter('Duke u përgatitur');
      const preparingStatuses = await getOrderStatuses();
      console.log(`   "Duke u përgatitur" now has: ${preparingCount} orders (${preparingStatuses.join(', ')})`);

      // Find the same order in preparing view
      const preparingCards = await page.locator('.order-card').all();
      let foundInPreparing = false;
      for (const card of preparingCards) {
        const cardOrderNumber = await card.locator('.order-number').textContent();
        if (cardOrderNumber === orderNumber) {
          foundInPreparing = true;
          console.log(`   ✅ Order ${orderNumber} found in "Duke u përgatitur" tab`);
          break;
        }
      }
      
      if (!foundInPreparing) {
        console.log(`   ❌ Order ${orderNumber} NOT found in "Duke u përgatitur" tab`);
      }

      // Continue workflow: PREPARING → READY
      if (foundInPreparing && preparingCards.length > 0) {
        console.log('\n5. Step 2: PREPARING → READY');
        const preparingCard = preparingCards[0]; // Use first card for simplicity
        const readyButton = preparingCard.locator('button.status-button');
        
        if (await readyButton.count() > 0) {
          await readyButton.click();
          await page.waitForTimeout(2000);
          
          // Dismiss undo toast
          const undoToast2 = await page.locator('.undo-toast').count();
          if (undoToast2 > 0) {
            await page.click('.dismiss-button');
            await page.waitForTimeout(1000);
          }

          // Check "Gati" filter
          const readyCount = await countOrdersByFilter('Gati');
          const readyStatuses = await getOrderStatuses();
          console.log(`   "Gati" now has: ${readyCount} orders (${readyStatuses.join(', ')})`);

          // Continue workflow: READY → SERVED
          const readyCards = await page.locator('.order-card').all();
          if (readyCards.length > 0) {
            console.log('\n6. Step 3: READY → SERVED');
            const readyCard = readyCards[0];
            const servedButton = readyCard.locator('button.status-button');
            
            if (await servedButton.count() > 0) {
              await servedButton.click();
              await page.waitForTimeout(2000);
              
              // Dismiss undo toast
              const undoToast3 = await page.locator('.undo-toast').count();
              if (undoToast3 > 0) {
                await page.click('.dismiss-button');
                await page.waitForTimeout(1000);
              }

              // Check "Shërbyer" filter
              const servedCount = await countOrdersByFilter('Shërbyer');
              const servedStatuses = await getOrderStatuses();
              console.log(`   "Shërbyer" now has: ${servedCount} orders (${servedStatuses.join(', ')})`);
            }
          }
        }
      }

      console.log('\n7. Final filter counts:');
      for (const filter of filters) {
        const finalCount = await countOrdersByFilter(filter);
        const change = finalCount - initialCounts[filter];
        const changeStr = change > 0 ? `+${change}` : change < 0 ? `${change}` : '±0';
        console.log(`   ${filter}: ${finalCount} (${changeStr})`);
      }
    } else {
      console.log('   ❌ No NEW orders found for testing');
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/status-workflow-final.png', fullPage: true });

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testStatusFilteringWorkflow().catch(console.error);