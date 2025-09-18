const { chromium } = require('playwright');

async function testOrderStatusUpdates() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      postData: request.postData(),
      timestamp: new Date().toISOString()
    });
    console.log(`Request: ${request.method()} ${request.url()}`);
  });

  // Track responses
  page.on('response', response => {
    if (response.url().includes('/api') || response.url().includes('/v1')) {
      console.log(`Response: ${response.status()} ${response.url()}`);
    }
  });

  // Track console messages and errors
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', error => {
    console.error('Page error:', error);
  });

  try {
    console.log('🔍 Testing Order Status Update Buttons');
    console.log('='.repeat(60));

    // Navigate to login page and inject mock auth
    console.log('1. Setting up mock authentication...');
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
        token: "mock-token-for-testing"
      };
      localStorage.setItem('restaurantAuth', JSON.stringify(mockAuth));
    });

    // Navigate to dashboard
    console.log('2. Loading dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/order-status-before.png', fullPage: true });
    console.log('📷 Before screenshot saved');

    // Wait for any API calls to complete
    await page.waitForTimeout(2000);

    // Look for actual order cards with status buttons
    console.log('3. Analyzing order cards and status buttons...');
    
    const orderCards = await page.locator('.order-card, [class*="order"], .card').all();
    console.log(`Found ${orderCards.length} potential order cards`);

    // Find the actual status update buttons (not filter buttons)
    const statusUpdateButtons = await page.locator('button.status-button, button[class*="status"], button[onclick*="status"], button:has-text("Prano"), button:has-text("Gati"), button:has-text("Shërbyer")').all();
    
    console.log(`Found ${statusUpdateButtons.length} potential status update buttons`);

    let actualOrderButtons = [];
    for (let i = 0; i < statusUpdateButtons.length; i++) {
      const button = statusUpdateButtons[i];
      const text = await button.textContent();
      const classes = await button.getAttribute('class');
      const parentCard = await button.locator('..').closest('.order-card, [class*="order"], .card');
      
      console.log(`Status Button ${i + 1}:`);
      console.log(`  Text: "${text?.trim()}"`);
      console.log(`  Classes: ${classes}`);
      console.log(`  Has parent order card: ${parentCard ? 'Yes' : 'No'}`);
      
      // Only include buttons that are actual order status update buttons
      if (text && (text.includes('Prano') || text.includes('Gati') || text.includes('Shërbyer')) && 
          !classes?.includes('filter-button')) {
        actualOrderButtons.push({ 
          element: button, 
          text: text.trim(),
          classes: classes,
          index: i + 1 
        });
      }
    }

    console.log(`4. Found ${actualOrderButtons.length} actual order status update buttons:`);
    actualOrderButtons.forEach((btn, i) => {
      console.log(`   - ${btn.text} (classes: ${btn.classes})`);
    });

    if (actualOrderButtons.length > 0) {
      console.log('5. Testing order status update...');
      
      // Test the first actual status update button
      const testButton = actualOrderButtons[0];
      console.log(`Testing button: "${testButton.text}" (Button ${testButton.index})`);
      
      // Get the parent order card to track changes
      const parentCard = await testButton.element.locator('..').closest('.order-card, [class*="order"], .card');
      let initialOrderText = '';
      if (parentCard) {
        initialOrderText = await parentCard.textContent();
        console.log(`Initial order card content: "${initialOrderText?.substring(0, 200)}..."`);
      }

      // Check if button is enabled and visible
      const isEnabled = await testButton.element.isEnabled();
      const isVisible = await testButton.element.isVisible();
      console.log(`Button enabled: ${isEnabled}, visible: ${isVisible}`);

      if (isEnabled && isVisible) {
        // Count requests before click
        const requestsBefore = requests.length;
        
        // Click the button
        console.log('🖱️ Clicking order status update button...');
        await testButton.element.click();
        
        // Wait for potential API calls and UI updates
        await page.waitForTimeout(3000);
        
        // Check if any new requests were made
        const requestsAfter = requests.length;
        const newRequests = requests.slice(requestsBefore);
        
        console.log(`New requests after button click: ${newRequests.length}`);
        newRequests.forEach(req => {
          console.log(`  - ${req.method} ${req.url}`);
          if (req.postData) {
            console.log(`    Data: ${req.postData}`);
          }
        });

        // Check for visual changes in the order card
        if (parentCard) {
          const updatedOrderText = await parentCard.textContent();
          console.log(`Updated order card content: "${updatedOrderText?.substring(0, 200)}..."`);
          
          if (initialOrderText !== updatedOrderText) {
            console.log('✅ Order card content changed after button click!');
          } else {
            console.log('⚠️ Order card content appears unchanged');
          }
        }

        // Take after screenshot
        await page.screenshot({ path: 'test-results/order-status-after.png', fullPage: true });
        console.log('📷 After screenshot saved');

        // Check if any status badges changed
        const statusBadges = await page.locator('.status-badge, [class*="status"], [class*="badge"]').all();
        console.log(`Found ${statusBadges.length} status indicators after click`);
        for (let i = 0; i < Math.min(statusBadges.length, 5); i++) {
          const badgeText = await statusBadges[i].textContent();
          console.log(`  Status ${i + 1}: "${badgeText?.trim()}"`);
        }

      } else {
        console.log('❌ Button is not enabled or visible');
      }

    } else {
      console.log('❌ No actual order status update buttons found');
      
      // Debug information
      console.log('Available buttons (for debugging):');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
        const text = await allButtons[i].textContent();
        const classes = await allButtons[i].getAttribute('class');
        console.log(`  Button ${i + 1}: "${text?.trim()}" (${classes})`);
      }
    }

    console.log('6. Test completed successfully! 🎉');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Keep browser open for a moment to see results
    console.log('Keeping browser open for 5 seconds to review results...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testOrderStatusUpdates().catch(console.error);