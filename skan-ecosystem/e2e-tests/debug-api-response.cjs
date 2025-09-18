const { chromium } = require('playwright');

async function debugApiResponse() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept API responses to see what data is actually returned
  const apiResponses = [];
  page.on('response', async response => {
    if (response.url().includes('/orders') && response.url().includes('demo-venue-1')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
      try {
        const responseData = await response.json();
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        apiResponses.push(responseData);
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    }
  });

  try {
    console.log('🔍 Debugging API Response Data');
    console.log('='.repeat(60));

    // Navigate to login and inject mock auth
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
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(4000); // Wait for API calls

    console.log('API responses captured:', apiResponses.length);
    
    // Check what's displayed on the page
    const orderCards = await page.locator('.order-card').count();
    console.log(`Order cards displayed: ${orderCards}`);

    if (orderCards > 0) {
      // Get order details from the page
      for (let i = 0; i < Math.min(orderCards, 3); i++) {
        const orderCard = page.locator('.order-card').nth(i);
        const orderNumber = await orderCard.locator('.order-number').textContent();
        const orderStatus = await orderCard.locator('.order-status').textContent();
        console.log(`Order ${i + 1}: ${orderNumber} - Status: ${orderStatus}`);
      }
    }

    // Check console logs for debug info
    page.on('console', msg => {
      if (msg.text().includes('Mock') || msg.text().includes('API') || msg.text().includes('Error')) {
        console.log(`Browser log: ${msg.text()}`);
      }
    });

    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

debugApiResponse().catch(console.error);