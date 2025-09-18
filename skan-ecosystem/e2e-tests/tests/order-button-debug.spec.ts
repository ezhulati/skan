import { test, expect } from '@playwright/test';

test('Debug Order Status Buttons', async ({ page }) => {
  console.log('🔍 Testing Order Status Buttons on Admin Dashboard');
  console.log('='.repeat(60));

  // Track network requests
  const requests: any[] = [];
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

  // Navigate to localhost:3001
  console.log('1. Navigating to localhost:3001...');
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);

  // Check if we're redirected to login
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  if (currentUrl.includes('/login') || currentUrl.includes('login')) {
    console.log('2. On login page, attempting to login...');
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[name="password"], input[type="password"]', 'demo123');
    
    // Click login button
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Hyr")');
    await loginButton.click();
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    console.log(`After login URL: ${page.url()}`);
  }

  // Navigate to dashboard if not already there
  if (!page.url().includes('/dashboard')) {
    console.log('3. Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(2000);
  }

  console.log('4. Dashboard loaded, analyzing page content...');
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/dashboard-debug.png', fullPage: true });
  console.log('📷 Screenshot saved as dashboard-debug.png');

  // Check for orders
  const orderCards = await page.locator('.order-card, [class*="order"], [class*="card"]').count();
  console.log(`Found ${orderCards} potential order cards`);

  // Look for all buttons
  const allButtons = await page.locator('button').all();
  console.log(`Found ${allButtons.length} total buttons on page`);

  // Analyze each button
  let statusButtons: any[] = [];
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
                 text.includes('preparing') || text.includes('ready') || text.includes('served'))) {
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
      await page.screenshot({ path: 'test-results/dashboard-after-click.png', fullPage: true });
      console.log('📷 After-click screenshot saved');
    } else {
      console.log('❌ Button is not enabled or visible');
    }
  } else {
    console.log('❌ No status action buttons found');
    
    // Debug: Look for potential containers that might have orders
    const containers = await page.locator('[class*="order"], [class*="card"], [class*="item"]').all();
    console.log(`Found ${containers.length} potential order containers`);
    
    for (let i = 0; i < Math.min(containers.length, 5); i++) {
      const text = await containers[i].textContent();
      console.log(`Container ${i + 1}: "${text?.substring(0, 100) || 'No text'}..."`);
    }
  }

  console.log('7. Test completed');
});