import { test, expect } from '@playwright/test';

test.describe('Complete Demo Flow Verification', () => {
  test('verify complete demo request to dashboard login flow', async ({ page }) => {
    console.log('🔍 Testing complete demo flow: form → success → login → dashboard...');
    
    // Step 1: Go to demo request page
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForSelector('form[name="demo-request"]', { timeout: 10000 });
    console.log('✅ Demo request page loaded');
    
    // Step 2: Fill and submit form
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Test User');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Demo Test');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'test@example.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Test Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    console.log('✅ Form submitted');
    
    // Step 3: Wait for success page to appear
    await page.waitForTimeout(3000);
    
    // Step 4: Verify success page shows credentials
    const hasCredentials = await page.locator('text=manager_email1@gmail.com').isVisible().catch(() => false);
    const hasPassword = await page.locator('text=demo123').isVisible().catch(() => false);
    const hasLoginButton = await page.locator('button:has-text("Hyr në Demo")').isVisible().catch(() => false);
    
    console.log('📧 Email credentials visible:', hasCredentials);
    console.log('🔑 Password credentials visible:', hasPassword);
    console.log('🔘 Login button visible:', hasLoginButton);
    
    expect(hasCredentials).toBe(true);
    expect(hasPassword).toBe(true);
    expect(hasLoginButton).toBe(true);
    
    // Take screenshot of success page
    await page.screenshot({ path: 'test-results/success-page-with-credentials.png', fullPage: true });
    
    // Step 5: Click the "Hyr në Demo" button
    console.log('🖱️ Clicking "Hyr në Demo" button...');
    await page.click('button:has-text("Hyr në Demo")');
    
    // Wait for state change
    await page.waitForTimeout(2000);
    
    // Step 6: Verify login form appears with pre-filled credentials
    const emailField = page.locator('input[name="email"]');
    const passwordField = page.locator('input[name="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await expect(emailField).toBeVisible({ timeout: 5000 });
    await expect(passwordField).toBeVisible({ timeout: 5000 });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Login form is visible');
    
    // Step 7: Verify credentials are pre-filled
    const emailValue = await emailField.inputValue();
    const passwordValue = await passwordField.inputValue();
    
    console.log('📧 Pre-filled email:', emailValue);
    console.log('🔑 Pre-filled password:', passwordValue);
    
    expect(emailValue).toBe('manager_email1@gmail.com');
    expect(passwordValue).toBe('demo123');
    
    // Take screenshot of login form
    await page.screenshot({ path: 'test-results/login-form-prefilled.png', fullPage: true });
    
    // Step 8: Attempt to log in
    console.log('🔐 Attempting to log in with pre-filled credentials...');
    await loginButton.click();
    
    // Wait for login to complete
    await page.waitForTimeout(5000);
    
    // Step 9: Verify successful login to dashboard
    const currentUrl = page.url();
    console.log('🌐 Current URL after login:', currentUrl);
    
    // Check for dashboard elements that indicate successful login
    const isDashboard = currentUrl.includes('/dashboard') || 
                       await page.locator('text=Panel i Restorantit, text=Dashboard, text=Porositë').isVisible().catch(() => false) ||
                       await page.locator('.dashboard, [data-testid="dashboard"]').isVisible().catch(() => false);
    
    console.log('📊 Successfully reached dashboard:', isDashboard);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/final-dashboard-state.png', fullPage: true });
    
    if (isDashboard) {
      console.log('🎉 SUCCESS: Complete demo flow working end-to-end!');
    } else {
      console.log('❌ ISSUE: Login succeeded but dashboard not reached');
      console.log('Current page content preview:', await page.textContent('body'));
    }
    
    // Final verification
    expect(isDashboard).toBe(true);
  });
});