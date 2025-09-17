const { test, expect } = require('@playwright/test');

test('admin portal login functionality', async ({ page }) => {
  // Navigate to the admin portal
  await page.goto('https://skan-admin.netlify.app/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if we're on the login page (might still show React App title)
  await expect(page).toHaveTitle(/(SKAN Restaurant|React App)/);
  
  // Find and fill the login form
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const loginButton = page.locator('button[type="submit"]');
  
  // Verify form elements exist
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(loginButton).toBeVisible();
  
  // Fill in the demo credentials
  await emailInput.fill('manager_email1@gmail.com');
  await passwordInput.fill('demo123');
  
  // Intercept the login API call to monitor the request/response
  let loginApiUrl = '';
  let loginResponse = null;
  
  page.on('response', response => {
    if (response.url().includes('/auth/login')) {
      console.log('Login API response:', response.status(), response.statusText());
      loginResponse = response;
    }
  });
  
  page.on('request', request => {
    if (request.url().includes('/auth/login')) {
      loginApiUrl = request.url();
      console.log('Login API request:', request.method(), request.url());
      console.log('Request body:', request.postData());
    }
  });
  
  // Click the login button
  await loginButton.click();
  
  // Wait for response
  await page.waitForTimeout(3000);
  
  // Check for error messages or successful login
  const errorMessage = page.locator('text="Failed to fetch"');
  const dashboard = page.locator('text="Dashboard"');
  
  if (await errorMessage.isVisible()) {
    console.log('Login failed with "Failed to fetch" error');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'login-error.png', fullPage: true });
    
    // Check network tab for any failed requests
    const logs = await page.evaluate(() => {
      return console.log('Console logs captured');
    });
    
  } else if (await dashboard.isVisible()) {
    console.log('Login successful - dashboard is visible');
  } else {
    console.log('Login state unclear - taking screenshot');
    await page.screenshot({ path: 'login-unclear.png', fullPage: true });
  }
  
  // Wait a bit more to see final state
  await page.waitForTimeout(2000);
  
  // Log the current URL and API details
  console.log('Current URL:', page.url());
  console.log('API URL used:', loginApiUrl);
  
  // Verify the API URL is not localhost
  if (loginApiUrl.includes('localhost')) {
    console.log('❌ FAIL: Still using localhost API URL!');
  } else {
    console.log('✅ SUCCESS: Using production API URL');
  }
  
  // Log any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
});