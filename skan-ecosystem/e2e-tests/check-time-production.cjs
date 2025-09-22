const puppeteer = require('puppeteer');

async function checkTimeProduction() {
  console.log('🔍 Investigating time display for SKN-20250922-003...');
  console.log('📅 Current time:', new Date().toISOString());
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 500,
    args: ['--window-size=1200,800']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('🌐 Going to production admin portal...');
    await page.goto('https://admin.skan.al', { waitUntil: 'networkidle0' });
    
    // Login
    console.log('🔐 Logging in with demo credentials...');
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Successfully logged in');
    
    // Wait for orders to load
    console.log('⏳ Waiting for orders to load...');
    await page.waitForSelector('.order-card', { timeout: 15000 });
    
    // Find order SKN-20250922-003 and capture its details
    const orderAnalysis = await page.evaluate(() => {
      const orders = Array.from(document.querySelectorAll('.order-card'));
      const targetOrder = orders.find(order => {
        const orderNumber = order.querySelector('.order-number');
        return orderNumber && orderNumber.textContent.includes('SKN-20250922-003');
      });
      
      if (targetOrder) {
        const orderNumber = targetOrder.querySelector('.order-number').textContent;
        const orderTime = targetOrder.querySelector('.order-time').textContent;
        return { 
          found: true, 
          orderNumber, 
          orderTime,
          timestamp: new Date().toISOString()
        };
      }
      
      // If not found, get all order numbers for debugging
      const allOrders = orders.map(order => {
        const orderNumber = order.querySelector('.order-number')?.textContent || 'No number';
        const orderTime = order.querySelector('.order-time')?.textContent || 'No time';
        return { orderNumber, orderTime };
      }).slice(0, 10); // First 10 orders
      
      return { found: false, allOrders, timestamp: new Date().toISOString() };
    });
    
    if (orderAnalysis.found) {
      console.log('✅ Found target order!');
      console.log(`📋 Order: ${orderAnalysis.orderNumber}`);
      console.log(`⏰ Time displayed: ${orderAnalysis.orderTime}`);
      console.log(`📅 Browser time when captured: ${orderAnalysis.timestamp}`);
      
      // Now get the actual order data from API
      console.log('🔍 Fetching order details from production API...');
      
      const apiAnalysis = await page.evaluate(async () => {
        try {
          // Login to API
          const loginResponse = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'demo.beachbar@skan.al',
              password: 'BeachBarDemo2024!'
            })
          });
          
          if (!loginResponse.ok) {
            return { error: 'Login failed', status: loginResponse.status };
          }
          
          const loginData = await loginResponse.json();
          
          if (!loginData.token) {
            return { error: 'No token received' };
          }
          
          // Get orders
          const ordersResponse = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/orders?status=all&limit=50', {
            headers: { 
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!ordersResponse.ok) {
            return { error: 'Orders fetch failed', status: ordersResponse.status };
          }
          
          const orders = await ordersResponse.json();
          const targetOrder = orders.find(order => order.orderNumber === 'SKN-20250922-003');
          
          if (targetOrder) {
            // Calculate time difference like the UI does
            const createdDate = new Date(targetOrder.createdAt);
            const now = new Date();
            const diffMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
            
            let expectedDisplay;
            if (diffMinutes < 60) {
              expectedDisplay = `${diffMinutes}m ago`;
            } else {
              const diffHours = Math.floor(diffMinutes / 60);
              const remainingMinutes = diffMinutes % 60;
              expectedDisplay = `${diffHours}h ${remainingMinutes}m ago`;
            }
            
            return {
              success: true,
              orderData: {
                orderNumber: targetOrder.orderNumber,
                createdAt: targetOrder.createdAt,
                updatedAt: targetOrder.updatedAt
              },
              calculation: {
                createdTimestamp: createdDate.getTime(),
                currentTimestamp: now.getTime(),
                diffMilliseconds: now.getTime() - createdDate.getTime(),
                diffMinutes: diffMinutes,
                expectedDisplay: expectedDisplay,
                createdISO: createdDate.toISOString(),
                currentISO: now.toISOString()
              }
            };
          } else {
            return { error: 'Order not found in API response' };
          }
          
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (apiAnalysis.success) {
        console.log('📊 API Analysis:');
        console.log(`   Order created: ${apiAnalysis.orderData.createdAt}`);
        console.log(`   Order updated: ${apiAnalysis.orderData.updatedAt}`);
        console.log('');
        console.log('🧮 Time Calculation:');
        console.log(`   Created: ${apiAnalysis.calculation.createdISO}`);
        console.log(`   Current: ${apiAnalysis.calculation.currentISO}`);
        console.log(`   Difference: ${apiAnalysis.calculation.diffMinutes} minutes`);
        console.log(`   Expected: ${apiAnalysis.calculation.expectedDisplay}`);
        console.log('');
        console.log('🔍 Comparison:');
        console.log(`   Dashboard shows: "${orderAnalysis.orderTime}"`);
        console.log(`   Expected shows:  "${apiAnalysis.calculation.expectedDisplay}"`);
        console.log(`   Match: ${orderAnalysis.orderTime === apiAnalysis.calculation.expectedDisplay ? '✅ YES' : '❌ NO'}`);
        
        if (orderAnalysis.orderTime !== apiAnalysis.calculation.expectedDisplay) {
          console.log('');
          console.log('🚨 TIME DISCREPANCY FOUND!');
          console.log(`   The dashboard shows "${orderAnalysis.orderTime}"`);
          console.log(`   But it should show "${apiAnalysis.calculation.expectedDisplay}"`);
          console.log('');
          console.log('🔍 Debugging information:');
          console.log(`   Raw timestamp from API: ${apiAnalysis.orderData.createdAt}`);
          console.log(`   Parsed as Date: ${apiAnalysis.calculation.createdISO}`);
          console.log(`   Milliseconds difference: ${apiAnalysis.calculation.diffMilliseconds}`);
          console.log(`   Minutes difference: ${apiAnalysis.calculation.diffMinutes}`);
          
          // Analysis of potential causes
          console.log('');
          console.log('🔧 Potential causes:');
          console.log('   1. Timezone issue - API timestamps vs browser timezone');
          console.log('   2. Cached data - dashboard showing old calculation');
          console.log('   3. Different time source - browser vs API time mismatch');
          console.log('   4. Timestamp format parsing issue');
        } else {
          console.log('✅ Time display is accurate!');
        }
        
      } else {
        console.log('❌ API Error:', apiAnalysis.error);
      }
      
    } else {
      console.log('❌ Order SKN-20250922-003 not found in dashboard');
      console.log('');
      console.log('📋 Available orders (first 10):');
      orderAnalysis.allOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.orderNumber} - ${order.orderTime}`);
      });
    }
    
    console.log('');
    console.log('👀 Browser left open for manual inspection...');
    console.log('   You can check the time display and refresh to see changes.');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  }
  
  // Keep browser open for manual inspection
  // await browser.close();
}

checkTimeProduction().catch(console.error);