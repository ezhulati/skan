const puppeteer = require('puppeteer');

async function testTimeDisplay() {
  console.log('🔍 Testing time display discrepancy...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1000,
    args: ['--window-size=1200,800']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('🌐 Navigating to admin portal...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Login to Beach Bar
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Successfully logged in');
    
    // Wait for orders to load
    console.log('⏳ Waiting for orders to load...');
    await page.waitForSelector('.order-card', { timeout: 10000 });
    
    // Find order SKN-20250922-003 and get its time display
    const orderInfo = await page.evaluate(() => {
      const orders = Array.from(document.querySelectorAll('.order-card'));
      const targetOrder = orders.find(order => {
        const orderNumber = order.querySelector('.order-number');
        return orderNumber && orderNumber.textContent.includes('SKN-20250922-003');
      });
      
      if (targetOrder) {
        const orderNumber = targetOrder.querySelector('.order-number').textContent;
        const orderTime = targetOrder.querySelector('.order-time').textContent;
        return { orderNumber, orderTime, found: true };
      }
      
      return { found: false };
    });
    
    if (orderInfo.found) {
      console.log(`📋 Order: ${orderInfo.orderNumber}`);
      console.log(`⏰ Time displayed: ${orderInfo.orderTime}`);
      
      // Now let's get the actual timestamp from the API
      console.log('🔍 Fetching order data from API...');
      
      // Get auth token first
      const loginResponse = await page.evaluate(async () => {
        const response = await fetch('http://localhost:5001/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'demo.beachbar@skan.al',
            password: 'BeachBarDemo2024'
          })
        });
        return response.json();
      });
      
      if (loginResponse.token) {
        // Get orders from API
        const ordersResponse = await page.evaluate(async (token) => {
          const response = await fetch('http://localhost:5001/v1/venue/beach-bar-durres/orders?status=all&limit=50', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          return response.json();
        }, loginResponse.token);
        
        // Find the specific order
        const targetOrder = ordersResponse.find(order => order.orderNumber === 'SKN-20250922-003');
        
        if (targetOrder) {
          console.log('📊 API Data:');
          console.log(`   Order Number: ${targetOrder.orderNumber}`);
          console.log(`   Created At: ${targetOrder.createdAt}`);
          console.log(`   Updated At: ${targetOrder.updatedAt}`);
          
          // Calculate the time difference manually
          const createdDate = new Date(targetOrder.createdAt);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
          
          console.log('🧮 Manual Calculation:');
          console.log(`   Order created: ${createdDate.toLocaleString()}`);
          console.log(`   Current time: ${now.toLocaleString()}`);
          console.log(`   Difference: ${diffMinutes} minutes`);
          
          if (diffMinutes < 60) {
            console.log(`   Expected display: ${diffMinutes}m ago`);
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            const remainingMinutes = diffMinutes % 60;
            console.log(`   Expected display: ${diffHours}h ${remainingMinutes}m ago`);
          }
          
          console.log('🔍 Analysis:');
          console.log(`   Dashboard shows: ${orderInfo.orderTime}`);
          console.log(`   Expected: ${diffMinutes < 60 ? `${diffMinutes}m ago` : `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`}`);
          
          // Check if there's a timezone issue
          console.log('🌍 Timezone Analysis:');
          console.log(`   Local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
          console.log(`   Order timestamp (ISO): ${targetOrder.createdAt}`);
          console.log(`   Order timestamp (parsed): ${createdDate.toISOString()}`);
          console.log(`   Current time (ISO): ${now.toISOString()}`);
          
        } else {
          console.log('❌ Order SKN-20250922-003 not found in API response');
        }
      } else {
        console.log('❌ Failed to get auth token');
      }
      
    } else {
      console.log('❌ Order SKN-20250922-003 not found in dashboard');
      
      // List all visible orders
      const allOrders = await page.evaluate(() => {
        const orders = Array.from(document.querySelectorAll('.order-card'));
        return orders.map(order => {
          const orderNumber = order.querySelector('.order-number')?.textContent;
          const orderTime = order.querySelector('.order-time')?.textContent;
          return { orderNumber, orderTime };
        });
      });
      
      console.log('📋 All visible orders:');
      allOrders.forEach(order => {
        console.log(`   ${order.orderNumber}: ${order.orderTime}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    // Keep browser open for inspection
    // await browser.close();
  }
}

testTimeDisplay();