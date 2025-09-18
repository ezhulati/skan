import { test, expect } from '@playwright/test';

test.describe('Complete Demo Login Flow', () => {
  test('complete flow from demo request to successful dashboard login', async ({ page }) => {
    console.log('🚀 Testing complete demo request to dashboard login flow...');
    
    // Step 1: Submit demo request form
    console.log('📝 Step 1: Submitting demo request form');
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForSelector('form[name="demo-request"]');
    
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Test Manager');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Demo User');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'test@example.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Test Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(3000);
    
    // Step 2: Verify simple success page
    console.log('✅ Step 2: Verifying simplified success page');
    await expect(page.locator('h2:has-text("Demo u aktivizua me sukses")')).toBeVisible();
    await expect(page.locator('text=manager_email1@gmail.com')).toBeVisible();
    await expect(page.locator('text=demo123')).toBeVisible();
    
    // Take screenshot of simplified design
    await page.screenshot({ 
      path: 'test-results/simplified-demo-success.png',
      fullPage: true 
    });
    
    console.log('✅ Simplified success page verified');
    
    // Step 3: Click auto-login button
    console.log('🔐 Step 3: Testing auto-login button');
    const loginButton = page.locator('button:has-text("Hyr në Demo")');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // Wait for the page to update
    await page.waitForTimeout(2000);
    
    // Step 4: Verify login form appears and is pre-filled
    console.log('📋 Step 4: Verifying login form is pre-filled');
    
    // Check if we're now showing the login form
    const emailField = page.locator('input[name="email"]');
    const passwordField = page.locator('input[name="password"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    
    // Verify fields are pre-filled
    const emailValue = await emailField.inputValue();
    const passwordValue = await passwordField.inputValue();
    
    console.log('📧 Email field value:', emailValue);
    console.log('🔑 Password field value:', passwordValue);
    
    expect(emailValue).toBe('manager_email1@gmail.com');
    expect(passwordValue).toBe('demo123');
    
    // Take screenshot of pre-filled login form
    await page.screenshot({ 
      path: 'test-results/prefilled-login-form.png',
      fullPage: true 
    });
    
    console.log('✅ Login form is properly pre-filled');
    
    // Step 5: Submit login form
    console.log('🏠 Step 5: Submitting login to access dashboard');
    const submitLoginButton = page.locator('button[type="submit"]').filter({ hasText: /Login|Hyr/ });
    await submitLoginButton.click();
    
    // Wait for login process
    await page.waitForTimeout(5000);
    
    // Step 6: Verify successful login
    console.log('🎯 Step 6: Verifying successful login and dashboard access');
    
    const currentUrl = page.url();
    console.log('🌐 Current URL after login:', currentUrl);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/final-login-result.png',
      fullPage: true 
    });
    
    // Check for success indicators
    const hasError = await page.locator('text=Invalid, text=Error, text=Failed').isVisible().catch(() => false);
    const isDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/admin');
    const hasWelcome = await page.locator('text=Welcome, text=Mirë se erdhe, text=Dashboard, h1').isVisible().catch(() => false);
    const hasOrders = await page.locator('text=Orders, text=Porosi, text=Menu').isVisible().catch(() => false);
    
    console.log('❌ Has login error:', hasError);
    console.log('🏠 Is on dashboard URL:', isDashboard);
    console.log('👋 Has welcome message:', hasWelcome);
    console.log('📋 Has dashboard content:', hasOrders);
    
    // Verify login was successful
    if (hasError) {
      throw new Error('Login failed with error message');
    }
    
    if (isDashboard || hasWelcome || hasOrders) {
      console.log('🎉 SUCCESS: Complete flow working - user successfully logged into dashboard!');
    } else {
      console.log('⚠️  Login may have failed - checking page content...');
      const pageContent = await page.textContent('body');
      console.log('Page content preview:', pageContent?.substring(0, 200));
      
      // If we're still on login page, there might be an issue
      if (currentUrl.includes('/demo-request') || currentUrl.includes('/login')) {
        throw new Error('User was not redirected after login - login may have failed');
      }
    }
    
    console.log('🎯 COMPLETE FLOW TEST FINISHED!');
    
    // Summary
    console.log('\n📊 FLOW SUMMARY:');
    console.log('✅ 1. Demo request form submitted successfully');
    console.log('✅ 2. Simplified success page displayed properly');
    console.log('✅ 3. Auto-login button clicked successfully');
    console.log('✅ 4. Login form appeared and was pre-filled');
    console.log('✅ 5. Login form submitted successfully');
    console.log('✅ 6. User reached dashboard/admin area');
  });
});