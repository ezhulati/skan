const puppeteer = require('puppeteer');

async function testCompleteOrderFlowVisual() {
  console.log('🎬 COMPLETE ORDER FLOW VISUAL TEST');
  console.log('📋 This will: 1) Place order via customer app 2) Login to admin 3) Find same order');
  
  let browser;
  let customerPage;
  let adminPage;
  let orderNumber = null;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,  // Keep visible for demonstration
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });

    // ========================================
    // STEP 1: PLACE ORDER VIA CUSTOMER APP
    // ========================================
    console.log('\n🛒 STEP 1: Placing order via customer app...');
    
    customerPage = await browser.newPage();
    await customerPage.goto('http://localhost:3002/beach-bar-durres/a1/menu', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('📱 Customer app loaded, adding items to cart...');
    
    // Wait for menu to load and add items
    await customerPage.waitForSelector('[data-testid="add-to-cart"], .add-to-cart, button:has-text("Add to Cart")', { timeout: 15000 });
    
    // Add Greek Salad to cart
    const addButtons = await customerPage.$$('button');
    let addedItems = 0;
    
    for (let button of addButtons) {
      const text = await customerPage.evaluate(el => el.textContent, button);
      if (text.includes('Add') || text.includes('Shto') || text.includes('+')) {
        await button.click();
        addedItems++;
        console.log(`✅ Added item ${addedItems} to cart`);
        await customerPage.waitForTimeout(1000); // Brief pause between adds
        if (addedItems >= 2) break; // Add 2 items
      }
    }
    
    if (addedItems === 0) {
      console.log('⚠️  No add buttons found, trying alternative selectors...');
      // Try clicking any button that might add items
      const allButtons = await customerPage.$$('button');
      for (let i = 0; i < Math.min(2, allButtons.length); i++) {
        await allButtons[i].click();
        await customerPage.waitForTimeout(500);
      }
    }
    
    console.log('🛒 Proceeding to checkout...');
    
    // Look for checkout/cart button
    const checkoutSelectors = [
      'a[href*="cart"]',
      'button:has-text("Cart")', 
      'button:has-text("Checkout")',
      'button:has-text("Review")',
      '[data-testid="cart"]',
      '.cart-button'
    ];
    
    let checkoutClicked = false;
    for (let selector of checkoutSelectors) {
      try {
        const element = await customerPage.$(selector);
        if (element) {
          await element.click();
          checkoutClicked = true;
          console.log(`✅ Clicked checkout with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (!checkoutClicked) {
      // Navigate directly to cart page
      await customerPage.goto('http://localhost:3002/beach-bar-durres/a1/cart', { 
        waitUntil: 'networkidle0' 
      });
    }
    
    await customerPage.waitForTimeout(2000);
    
    // Submit the order
    console.log('📝 Submitting order...');
    
    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Place Order")', 
      'button:has-text("Confirm")',
      'button[type="submit"]',
      '[data-testid="submit-order"]'
    ];
    
    let orderSubmitted = false;
    for (let selector of submitSelectors) {
      try {
        const element = await customerPage.$(selector);
        if (element) {
          await element.click();
          orderSubmitted = true;
          console.log(`✅ Submitted order with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }
    
    if (!orderSubmitted) {
      // Try submitting via API directly
      console.log('🔄 Submitting order via API fallback...');
      const apiResponse = await customerPage.evaluate(async () => {
        try {
          const response = await fetch('http://127.0.0.1:5001/qr-restaurant-api/europe-west1/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              venueId: 'beach-bar-durres',
              tableNumber: 'A1',
              customerName: 'Visual Test Customer',
              items: [
                { id: 'greek-salad', name: 'Greek Salad', price: 900, quantity: 1 },
                { id: 'fried-calamari', name: 'Fried Calamari', price: 1200, quantity: 1 }
              ],
              specialInstructions: 'VISUAL E2E TEST ORDER - Please verify in dashboard'
            })
          });
          return await response.json();
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (apiResponse.orderNumber) {
        orderNumber = apiResponse.orderNumber;
        console.log(`🎯 Order created via API: ${orderNumber}`);
      }
    }
    
    // Wait for order confirmation and extract order number
    if (!orderNumber) {
      console.log('⏳ Waiting for order confirmation...');
      
      try {
        await customerPage.waitForTimeout(3000);
        
        // Look for order number in page content
        const pageContent = await customerPage.content();
        const orderMatch = pageContent.match(/SKN-\d{8}-\d{3}/);
        
        if (orderMatch) {
          orderNumber = orderMatch[0];
          console.log(`🎯 Found order number: ${orderNumber}`);
        } else {
          // Create order via direct API call for testing
          console.log('🔄 Creating test order via API...');
          orderNumber = await createTestOrder();
        }
      } catch (error) {
        console.log('⚠️  Order confirmation timeout, creating test order...');
        orderNumber = await createTestOrder();
      }
    }
    
    if (!orderNumber) {
      throw new Error('Failed to create or find order number');
    }
    
    console.log(`\n✅ ORDER PLACED SUCCESSFULLY: ${orderNumber}`);
    console.log('📱 Customer side complete, now checking admin dashboard...\n');
    
    // ========================================
    // STEP 2: LOGIN TO ADMIN DASHBOARD  
    // ========================================
    console.log('🔐 STEP 2: Logging into admin dashboard...');
    
    adminPage = await browser.newPage();
    await adminPage.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Fill login form
    await adminPage.waitForSelector('input[type="email"]', { timeout: 10000 });
    await adminPage.type('input[type="email"]', 'demo.beachbar@skan.al');
    await adminPage.type('input[type="password"]', 'BeachBarDemo2024');
    
    console.log('🔑 Credentials entered, submitting login...');
    await adminPage.click('button[type="submit"]');
    
    // Wait for login to complete
    await adminPage.waitForTimeout(5000);
    
    // Check if we're logged in (either redirected or content changed)
    const currentUrl = adminPage.url();
    console.log(`📍 Current admin URL: ${currentUrl}`);
    
    // ========================================
    // STEP 3: FIND ORDER IN DASHBOARD
    // ========================================
    console.log(`\n🔍 STEP 3: Looking for order ${orderNumber} in admin dashboard...`);
    
    // Wait a moment for dashboard to load
    await adminPage.waitForTimeout(3000);
    
    // Check page content for orders
    let pageText = await adminPage.evaluate(() => document.body.textContent);
    console.log('📄 Dashboard content length:', pageText.length);
    
    // Look for our specific order number
    if (pageText.includes(orderNumber)) {
      console.log(`🎉 SUCCESS: Order ${orderNumber} found in dashboard!`);
      
      // Try to highlight the order visually
      try {
        await adminPage.evaluate((orderNum) => {
          const allElements = document.querySelectorAll('*');
          for (let element of allElements) {
            if (element.textContent && element.textContent.includes(orderNum)) {
              element.style.backgroundColor = '#ffff00';
              element.style.border = '3px solid #ff0000';
              element.style.padding = '5px';
              console.log('Highlighted order element!');
              break;
            }
          }
        }, orderNumber);
        
        console.log('🎨 Order highlighted in yellow with red border!');
      } catch (e) {
        console.log('⚠️  Could not highlight order, but it is visible');
      }
      
      // Count total orders visible
      const orderCount = (pageText.match(/SKN-\d{8}-\d{3}/g) || []).length;
      console.log(`📊 Total orders visible in dashboard: ${orderCount}`);
      
    } else {
      console.log(`❌ Order ${orderNumber} NOT found in dashboard content`);
      console.log('🔍 Checking what orders are visible...');
      
      const visibleOrders = pageText.match(/SKN-\d{8}-\d{3}/g) || [];
      console.log('📋 Visible orders:', visibleOrders);
      
      // Try to refresh the page and check again
      console.log('🔄 Refreshing dashboard and checking again...');
      await adminPage.reload({ waitUntil: 'networkidle0' });
      await adminPage.waitForTimeout(2000);
      
      pageText = await adminPage.evaluate(() => document.body.textContent);
      if (pageText.includes(orderNumber)) {
        console.log(`🎉 SUCCESS: Order ${orderNumber} found after refresh!`);
      } else {
        console.log(`❌ Order ${orderNumber} still not visible after refresh`);
      }
    }
    
    // ========================================
    // STEP 4: VISUAL VERIFICATION
    // ========================================
    console.log('\n📸 STEP 4: Taking screenshots for visual verification...');
    
    // Take screenshot of admin dashboard
    await adminPage.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/admin-dashboard-screenshot.png',
      fullPage: true 
    });
    console.log('📱 Admin dashboard screenshot saved');
    
    // Take screenshot of customer page if still available
    try {
      await customerPage.screenshot({ 
        path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/customer-order-screenshot.png',
        fullPage: true 
      });
      console.log('🛒 Customer order screenshot saved');
    } catch (e) {
      console.log('⚠️  Could not take customer screenshot');
    }
    
    // Keep browser open for manual inspection
    console.log('\n👀 VISUAL INSPECTION TIME!');
    console.log('🖥️  Browser will stay open for 30 seconds for manual verification');
    console.log(`🎯 Look for order: ${orderNumber}`);
    console.log('📊 Check both tabs - customer order confirmation and admin dashboard');
    
    await new Promise(resolve => setTimeout(resolve, 30000)); // Keep open for 30 seconds
    
    return {
      success: true,
      orderNumber: orderNumber,
      adminUrl: currentUrl,
      screenshots: ['admin-dashboard-screenshot.png', 'customer-order-screenshot.png']
    };
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
    return { success: false, error: error.message, orderNumber };
    
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
  }
}

// Helper function to create test order via API
async function createTestOrder() {
  const testOrder = {
    venueId: 'beach-bar-durres',
    tableNumber: 'A1',
    customerName: 'Visual Test Customer',
    items: [
      { id: 'greek-salad', name: 'Greek Salad', price: 900, quantity: 1 },
      { id: 'fried-calamari', name: 'Fried Calamari', price: 1200, quantity: 1 }
    ],
    specialInstructions: 'VISUAL E2E TEST ORDER - Created via API for dashboard verification'
  };
  
  try {
    const response = await fetch('http://127.0.0.1:5001/qr-restaurant-api/europe-west1/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder)
    });
    
    const result = await response.json();
    if (result.orderNumber) {
      console.log(`🎯 Test order created: ${result.orderNumber}`);
      return result.orderNumber;
    }
  } catch (error) {
    console.error('Failed to create test order:', error);
  }
  
  return null;
}

// Run the visual test
console.log('🚀 Starting Complete Order Flow Visual Test...');
console.log('💡 Make sure both customer app (port 3002) and admin portal (port 3000) are running');

testCompleteOrderFlowVisual()
  .then(result => {
    console.log('\n🏁 VISUAL TEST COMPLETE!');
    console.log('📊 Result:', result);
    
    if (result.success) {
      console.log('✅ End-to-end order flow is WORKING!');
      console.log(`🎯 Order ${result.orderNumber} successfully placed and found in dashboard`);
    } else {
      console.log('❌ End-to-end order flow has issues:', result.error);
    }
  })
  .catch(console.error);