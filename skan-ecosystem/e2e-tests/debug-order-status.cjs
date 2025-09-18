const { chromium } = require('playwright');

async function debugOrderStatus() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Debugging Order Status Data');
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

    console.log('1. Extracting actual order data from React state:');
    
    // Extract the actual orders data from React
    const orderData = await page.evaluate(() => {
      // Try to find the React component instance
      const reactFiber = document.querySelector('#root')._reactInternalInstance || 
                         document.querySelector('#root')._reactInternals;
      
      // Alternative: check if we can access orders from the DOM
      const orderCards = document.querySelectorAll('.order-card');
      const orders = [];
      
      orderCards.forEach((card, index) => {
        const orderNumber = card.querySelector('.order-number')?.textContent;
        const status = card.querySelector('.order-status')?.textContent;
        orders.push({
          index,
          orderNumber,
          status: status?.trim(),
          rawHTML: card.outerHTML.substring(0, 200) + '...'
        });
      });
      
      return orders;
    });

    console.log('   Raw order data:');
    orderData.forEach(order => {
      console.log(`     ${order.orderNumber}: ${order.status}`);
    });

    console.log('\n2. Testing filter behavior:');
    
    const filters = [
      { name: 'Të gjitha', status: 'all' },
      { name: 'Aktive', status: 'active' },
      { name: 'Të reja', status: 'new' },
      { name: 'Duke u përgatitur', status: 'preparing' },
      { name: 'Gati', status: 'ready' },
      { name: 'Shërbyer', status: 'served' }
    ];

    for (const filter of filters) {
      await page.click(`button:has-text("${filter.name}")`);
      await page.waitForTimeout(500);
      
      const orderCards = await page.locator('.order-card').all();
      const ordersInFilter = [];
      
      for (let i = 0; i < orderCards.length; i++) {
        const orderNumber = await orderCards[i].locator('.order-number').textContent();
        const status = await orderCards[i].locator('.order-status').textContent();
        ordersInFilter.push({ orderNumber, status: status?.trim() });
      }
      
      console.log(`   ${filter.name} (${filter.status}): ${ordersInFilter.length} orders`);
      ordersInFilter.forEach(order => {
        console.log(`     ${order.orderNumber}: ${order.status}`);
      });
    }

    console.log('\n3. Testing a status change:');
    
    // Go to "Të reja" tab and change a NEW order
    await page.click('button:has-text("Të reja")');
    await page.waitForTimeout(1000);
    
    const newOrders = await page.locator('.order-card').count();
    if (newOrders > 0) {
      const orderNumber = await page.locator('.order-card').first().locator('.order-number').textContent();
      const initialStatus = await page.locator('.order-card').first().locator('.order-status').textContent();
      
      console.log(`   Changing ${orderNumber} from ${initialStatus?.trim()} to PREPARING...`);
      
      await page.locator('.order-card').first().locator('button.status-button').click();
      await page.waitForTimeout(2000);
      
      // Dismiss undo toast
      if (await page.locator('.undo-toast').count() > 0) {
        await page.click('.dismiss-button');
        await page.waitForTimeout(1000);
      }
      
      console.log('\n4. Status after change:');
      
      // Check all filters again
      for (const filter of filters) {
        await page.click(`button:has-text("${filter.name}")`);
        await page.waitForTimeout(500);
        
        const orderCards = await page.locator('.order-card').all();
        const ordersInFilter = [];
        
        for (let i = 0; i < orderCards.length; i++) {
          const cardOrderNumber = await orderCards[i].locator('.order-number').textContent();
          const cardStatus = await orderCards[i].locator('.order-status').textContent();
          if (cardOrderNumber === orderNumber) {
            ordersInFilter.push({ orderNumber: cardOrderNumber, status: cardStatus?.trim() });
          }
        }
        
        if (ordersInFilter.length > 0) {
          console.log(`   Found ${orderNumber} in ${filter.name}: Status = ${ordersInFilter[0].status}`);
        }
      }
    }

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

debugOrderStatus().catch(console.error);