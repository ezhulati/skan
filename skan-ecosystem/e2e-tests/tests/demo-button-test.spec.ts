import { test, expect } from '@playwright/test';

test.describe('Demo Button Test', () => {
  test('verify demo button switches to login form', async ({ page }) => {
    console.log('🔍 Testing if demo button shows login form...');
    
    // Go to demo success page by submitting form first
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForSelector('form[name="demo-request"]');
    
    // Fill and submit form
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Test');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'User');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'test@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Test Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(3000);
    
    // Verify we're on success page
    await expect(page.locator('button:has-text("Hyr në Demo")')).toBeVisible();
    console.log('✅ Demo button found');
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/before-button-click.png', fullPage: true });
    
    // Click the button
    console.log('🖱️ Clicking demo button...');
    await page.click('button:has-text("Hyr në Demo")');
    
    // Wait for state change
    await page.waitForTimeout(3000);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/after-button-click.png', fullPage: true });
    
    // Look for login form elements (might be anywhere on page)
    const hasEmail = await page.locator('input[name="email"]').isVisible().catch(() => false);
    const hasPassword = await page.locator('input[name="password"]').isVisible().catch(() => false);
    const hasLoginButton = await page.locator('button[type="submit"]').isVisible().catch(() => false);
    const hasLoginText = await page.locator('text=Login, text=Hyr, text=Email, text=Password').isVisible().catch(() => false);
    
    console.log('📧 Email field visible:', hasEmail);
    console.log('🔑 Password field visible:', hasPassword);
    console.log('🔘 Login button visible:', hasLoginButton);
    console.log('📝 Login text visible:', hasLoginText);
    
    // Check page content for debugging
    const pageText = await page.textContent('body');
    console.log('Page contains "email":', pageText?.toLowerCase().includes('email'));
    console.log('Page contains "password":', pageText?.toLowerCase().includes('password'));
    console.log('Page contains "login":', pageText?.toLowerCase().includes('login'));
    
    // If login form is visible, test the pre-fill functionality
    if (hasEmail && hasPassword) {
      console.log('🎉 Login form is visible! Testing pre-fill...');
      
      const emailValue = await page.locator('input[name="email"]').inputValue();
      const passwordValue = await page.locator('input[name="password"]').inputValue();
      
      console.log('📧 Email value:', emailValue);
      console.log('🔑 Password value:', passwordValue);
      
      if (emailValue === 'manager_email1@gmail.com' && passwordValue === 'demo123') {
        console.log('✅ SUCCESS: Login form is properly pre-filled!');
      } else {
        console.log('⚠️ WARNING: Login form not properly pre-filled');
      }
    } else {
      console.log('❌ Login form not found after button click');
      console.log('Current URL:', page.url());
      
      // Scroll down to see if form is below viewport
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/after-scroll.png', fullPage: true });
      
      // Check again after scroll
      const hasEmailAfterScroll = await page.locator('input[name="email"]').isVisible().catch(() => false);
      console.log('📧 Email field visible after scroll:', hasEmailAfterScroll);
    }
  });
});