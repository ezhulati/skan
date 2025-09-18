const { chromium } = require('playwright');

async function testStatusButtonsSimple() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track network requests for status updates
  const statusUpdateRequests = [];
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    
    // Track PUT/PATCH requests that might be status updates
    if ((method === 'PUT' || method === 'PATCH') && url.includes('/orders/')) {
      statusUpdateRequests.push({
        url,
        method,
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
      console.log(`🔄 Status update request: ${method} ${url}`);
    }
    
    // Log all requests for debugging
    console.log(`Request: ${method} ${url}`);
  });

  // Track responses
  page.on('response', response => {
    if (response.url().includes('/api') || response.url().includes('/v1')) {
      console.log(`Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('🔍 Testing Order Status Update Buttons (Simple Test)');
    console.log('='.repeat(60));

    // Navigate to login and inject mock auth
    console.log('1. Setting up authentication...');
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

    // Navigate to dashboard
    console.log('2. Loading dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(4000); // Wait longer for API calls

    // Take before screenshot
    await page.screenshot({ path: 'test-results/status-test-before.png', fullPage: true });
    console.log('📷 Before screenshot saved');

    // Find all buttons with Albanian text for status updates
    console.log('3. Finding order status buttons...');
    
    const statusButtons = await page.locator('button').all();
    const orderStatusButtons = [];
    
    for (let i = 0; i < statusButtons.length; i++) {
      const button = statusButtons[i];
      const text = await button.textContent();
      const classes = await button.getAttribute('class');
      
      console.log(`Button ${i + 1}: "${text?.trim()}" (${classes})`);
      
      // Look for actual order action buttons (not filters)
      if (text && (
          text.includes('Prano Porosinë') || 
          text.includes('Shëno si Gati') || 
          text.includes('Shëno si Shërbyer') ||
          text.includes('Accept Order') ||
          text.includes('Mark Ready') ||
          text.includes('Mark Served')
        ) && !classes?.includes('filter-button')) {
        
        orderStatusButtons.push({
          element: button,
          text: text.trim(),
          classes: classes,
          index: i + 1
        });
      }
    }

    console.log(`4. Found ${orderStatusButtons.length} order status action buttons:`);
    orderStatusButtons.forEach((btn, i) => {
      console.log(`   ✅ ${btn.text} (${btn.classes})`);
    });

    if (orderStatusButtons.length > 0) {
      console.log('5. Testing first status button...');
      
      const testButton = orderStatusButtons[0];
      console.log(`Testing: "${testButton.text}"`);
      
      // Check button state
      const isEnabled = await testButton.element.isEnabled();
      const isVisible = await testButton.element.isVisible();
      console.log(`Button enabled: ${isEnabled}, visible: ${isVisible}`);

      if (isEnabled && isVisible) {
        // Clear previous requests
        statusUpdateRequests.length = 0;
        
        console.log('🖱️ Clicking button...');
        await testButton.element.click();
        
        // Wait for any API calls
        await page.waitForTimeout(3000);
        
        console.log(`Status update requests captured: ${statusUpdateRequests.length}`);
        statusUpdateRequests.forEach((req, i) => {
          console.log(`  ${i + 1}. ${req.method} ${req.url}`);
          if (req.postData) {
            console.log(`     Data: ${req.postData}`);
          }
        });

        // Take after screenshot
        await page.screenshot({ path: 'test-results/status-test-after.png', fullPage: true });
        console.log('📷 After screenshot saved');

        // Summary
        if (statusUpdateRequests.length > 0) {
          console.log('✅ SUCCESS: Status update button triggered API call!');
        } else {
          console.log('⚠️ WARNING: No status update API calls detected');
        }

      } else {
        console.log('❌ Button not clickable');
      }

    } else {
      console.log('❌ No order status action buttons found');
      console.log('This might indicate:');
      console.log('  - No orders are loaded (API issues)');
      console.log('  - Buttons have different text/structure than expected');
      console.log('  - UI might be in a different state');
    }

    console.log('6. ✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('Keeping browser open for review...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testStatusButtonsSimple().catch(console.error);