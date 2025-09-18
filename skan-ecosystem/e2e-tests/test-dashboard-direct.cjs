const { chromium } = require('playwright');

async function testDashboardWithMockAuth() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      postData: request.postData()
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
    console.log('🔍 Testing Dashboard with Mock Authentication');
    console.log('='.repeat(60));

    // First navigate to login page to initialize the app
    console.log('1. Navigating to localhost:3001...');
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(2000);

    // Inject mock authentication data
    console.log('2. Injecting mock authentication...');
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
      console.log('Mock auth injected:', mockAuth);
    });

    // Now navigate to dashboard
    console.log('3. Navigating to dashboard with mock auth...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(3000);

    console.log('4. Dashboard loaded, analyzing page content...');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/dashboard-with-mock-auth.png', fullPage: true });
    console.log('📷 Screenshot saved as dashboard-with-mock-auth.png');

    // Check for orders
    const orderCards = await page.locator('.order-card, [class*="order"], [class*="card"]').count();
    console.log(`Found ${orderCards} potential order cards`);

    // Look for all buttons
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} total buttons on page`);

    // Analyze each button
    let statusButtons = [];
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const classes = await button.getAttribute('class');
      const onclick = await button.getAttribute('onclick');
      
      console.log(`Button ${i + 1}:`);
      console.log(`  Text: "${text?.trim() || 'No text'}"`);
      console.log(`  Classes: ${classes || 'None'}`);
      console.log(`  OnClick: ${onclick || 'None'}`);
      
      if (text && (text.includes('Prano') || text.includes('Gati') || text.includes('Shërbyer') || 
                   text.includes('preparing') || text.includes('ready') || text.includes('served') ||
                   text.includes('Accept') || text.includes('Ready') || text.includes('Complete'))) {
        statusButtons.push({ element: button, text: text.trim() });
      }
    }

    console.log(`5. Found ${statusButtons.length} status action buttons:`);
    statusButtons.forEach((btn, i) => {
      console.log(`   - Button ${i + 1}: "${btn.text}"`);
    });

    if (statusButtons.length > 0) {
      console.log('6. Testing button clicks...');
      
      // Test the first button
      const testButton = statusButtons[0];
      console.log(`Testing button: "${testButton.text}"`);
      
      // Check if button is enabled and visible
      const isEnabled = await testButton.element.isEnabled();
      const isVisible = await testButton.element.isVisible();
      console.log(`Button enabled: ${isEnabled}, visible: ${isVisible}`);

      if (isEnabled && isVisible) {
        // Count requests before click
        const requestsBefore = requests.length;
        
        // Click the button
        console.log('Clicking button...');
        await testButton.element.click();
        
        // Wait a moment for potential API calls
        await page.waitForTimeout(2000);
        
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

        // Check for visual changes
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/dashboard-after-button-click.png', fullPage: true });
        console.log('📷 After-click screenshot saved');
      } else {
        console.log('❌ Button is not enabled or visible');
      }
    } else {
      console.log('❌ No status action buttons found');
      
      // Debug: Look for any content
      const bodyText = await page.textContent('body');
      console.log('Page content preview:');
      console.log(bodyText?.substring(0, 500) + '...');
      
      // Look for any order-related elements
      const orderElements = await page.locator('[class*="order"], [class*="card"], [class*="item"], h1, h2, h3').all();
      console.log(`Found ${orderElements.length} potential content elements:`);
      
      for (let i = 0; i < Math.min(orderElements.length, 10); i++) {
        const text = await orderElements[i].textContent();
        const tagName = await orderElements[i].evaluate(el => el.tagName);
        console.log(`${tagName}: "${text?.substring(0, 100) || 'No text'}..."`);
      }
    }

    console.log('7. Test completed');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testDashboardWithMockAuth().catch(console.error);