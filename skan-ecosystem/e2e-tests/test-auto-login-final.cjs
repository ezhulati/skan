const { chromium } = require('playwright');

async function testAutoLoginFinal() {
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
    console.log('🚀 Testing final auto-login functionality...');
    
    // Go directly to demo request page  
    await page.goto('http://localhost:3000/demo-request');
    await page.waitForTimeout(2000);
    
    // Fill and submit form
    console.log('📝 Filling out demo form...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Final Test');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'User');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'finaltest@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Final Test Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(3000);
    
    // Check success page
    const hasSuccessMessage = await page.locator('text=Demo u aktivizua').isVisible().catch(() => false);
    console.log('✅ Success page visible:', hasSuccessMessage);
    
    // Check password display
    const passwordDisplay = await page.locator('text=demo1234').textContent().catch(() => null);
    console.log('🔑 Password displayed correctly:', passwordDisplay ? 'demo1234' : 'NOT FOUND');
    
    // Find and click the auto-login button
    const autoLoginButton = page.locator('button:has-text("Hyr në Demo")');
    const buttonVisible = await autoLoginButton.isVisible().catch(() => false);
    console.log('🔘 Auto-login button visible:', buttonVisible);
    
    if (buttonVisible) {
      console.log('🖱️ Clicking "Hyr në Demo" button...');
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'final-test-before.png', fullPage: true });
      
      // Click the button
      await autoLoginButton.click();
      
      // Wait for response
      console.log('⏳ Waiting for login response...');
      await page.waitForTimeout(8000); // Longer wait
      
      // Check current URL
      const currentUrl = page.url();
      console.log('🌐 Current URL after button click:', currentUrl);
      
      // Check if we're on dashboard
      const onDashboard = currentUrl.includes('/dashboard');
      console.log('📊 Redirected to dashboard:', onDashboard);
      
      // Take final screenshot
      await page.screenshot({ path: 'final-test-after.png', fullPage: true });
      
      if (onDashboard) {
        console.log('🎉 SUCCESS: Auto-login button worked! User is on dashboard.');
        
        // Check if user data is set
        const userData = await page.evaluate(() => {
          return localStorage.getItem('user');
        });
        console.log('👤 User data in localStorage:', userData ? 'SET' : 'NOT SET');
        
      } else {
        console.log('❌ ISSUE: Button clicked but user not redirected to dashboard');
        
        // Check for any error messages
        const errorVisible = await page.locator('.error, [class*="error"]').isVisible().catch(() => false);
        if (errorVisible) {
          const errorText = await page.locator('.error, [class*="error"]').textContent().catch(() => 'Error not readable');
          console.log('🚨 Error message found:', errorText);
        }
      }
      
    } else {
      console.log('❌ Auto-login button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(5000); // Keep open to see results
    await browser.close();
  }
}

testAutoLoginFinal().catch(console.error);