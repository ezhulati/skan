const { chromium } = require('playwright');

async function testAutoLoginButton() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track console messages and network requests
  page.on('console', msg => {
    console.log(`🔍 Browser console [${msg.type()}]:`, msg.text());
  });

  page.on('request', request => {
    if (request.url().includes('auth/login')) {
      console.log(`🌐 Login request: ${request.method()} ${request.url()}`);
      console.log(`📦 Request body:`, request.postData());
    }
  });

  page.on('response', response => {
    if (response.url().includes('auth/login')) {
      console.log(`📥 Login response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('🚀 Testing auto-login button functionality...');
    
    // Step 1: Go to demo request page
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForTimeout(2000);
    
    // Step 2: Fill and submit form quickly
    console.log('📝 Filling out demo form...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Auto Test');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Login Test');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'autotest@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Auto Login Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(3000);
    
    // Step 3: Verify success page
    const hasSuccessMessage = await page.locator('text=Demo u aktivizua').isVisible().catch(() => false);
    console.log('✅ Success page visible:', hasSuccessMessage);
    
    // Step 4: Find and click the auto-login button
    const autoLoginButton = page.locator('button:has-text("Hyr në Demo")');
    const buttonVisible = await autoLoginButton.isVisible().catch(() => false);
    console.log('🔘 Auto-login button visible:', buttonVisible);
    
    if (buttonVisible) {
      console.log('🖱️ Clicking "Hyr në Demo" button...');
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'before-auto-login.png', fullPage: true });
      
      // Click the button and wait for response
      await autoLoginButton.click();
      
      // Wait longer to see what happens
      console.log('⏳ Waiting for login response...');
      await page.waitForTimeout(5000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('🌐 Current URL after button click:', currentUrl);
      
      // Check if we're on dashboard
      const onDashboard = currentUrl.includes('/dashboard');
      console.log('📊 Redirected to dashboard:', onDashboard);
      
      // Take final screenshot
      await page.screenshot({ path: 'after-auto-login.png', fullPage: true });
      
      if (onDashboard) {
        console.log('🎉 SUCCESS: Auto-login button worked! User is on dashboard.');
      } else {
        console.log('❌ ISSUE: Button clicked but user not redirected to dashboard');
        
        // Check for errors on page
        const hasError = await page.locator('text=Invalid, text=Error, text=Problem').isVisible().catch(() => false);
        if (hasError) {
          const errorText = await page.locator('.error-message, [class*="error"]').textContent().catch(() => 'No error text found');
          console.log('🚨 Error message found:', errorText);
        }
      }
      
    } else {
      console.log('❌ Auto-login button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000); // Keep open to see results
    await browser.close();
  }
}

testAutoLoginButton().catch(console.error);