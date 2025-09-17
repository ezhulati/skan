const { test, expect } = require('@playwright/test');

test('login form UI styling', async ({ browser }) => {
  // Create a new incognito context
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to login page
  await page.goto('https://skan-admin.netlify.app');
  
  // Wait for the login form to load
  await page.waitForSelector('input[type="email"]');
  
  // Take screenshot of login form
  await page.screenshot({ path: 'login-form-fixed.png', fullPage: true });
  
  console.log('Login form screenshot saved as login-form-fixed.png');
  
  await context.close();
});