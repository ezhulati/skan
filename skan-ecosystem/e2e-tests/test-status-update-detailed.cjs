const { chromium } = require('playwright');

async function testStatusUpdateDetailed() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track all API requests and responses
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api') || request.url().includes('/v1')) {
      apiCalls.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api') || response.url().includes('/v1')) {
      let responseData = null;
      try {
        responseData = await response.text();
      } catch (e) {
        responseData = 'Could not read response';
      }
      
      apiCalls.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        data: responseData,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Track console messages
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]: ${msg.text()}`);
  });

  try {
    console.log('🔍 Detailed Status Update Test');
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

    console.log('1. Orders loaded, looking for status buttons...');
    
    const statusButtons = await page.locator('button.status-button').all();
    console.log(`Found ${statusButtons.length} status buttons`);

    if (statusButtons.length > 0) {
      const button = statusButtons[0];
      const buttonText = await button.textContent();
      console.log(`2. Testing button: "${buttonText?.trim()}"`);

      // Clear previous API calls
      apiCalls.length = 0;
      
      console.log('3. Clicking button...');
      await button.click();
      
      // Wait for API calls
      await page.waitForTimeout(3000);
      
      console.log('4. API calls made:');
      apiCalls.forEach((call, i) => {
        if (call.type === 'request') {
          console.log(`   ${i + 1}. REQUEST: ${call.method} ${call.url}`);
          if (call.postData) {
            console.log(`      Data: ${call.postData}`);
          }
          if (call.headers && call.headers.authorization) {
            console.log(`      Auth: ${call.headers.authorization.substring(0, 20)}...`);
          }
        } else {
          console.log(`   ${i + 1}. RESPONSE: ${call.status} ${call.statusText}`);
          if (call.status >= 400) {
            console.log(`      Error data: ${call.data.substring(0, 200)}`);
          }
        }
      });

      // Check if there were any alerts or error messages
      const errorMessages = await page.locator('.error, .alert, [class*="error"]').count();
      console.log(`5. Error messages on page: ${errorMessages}`);

    } else {
      console.log('❌ No status buttons found');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testStatusUpdateDetailed().catch(console.error);