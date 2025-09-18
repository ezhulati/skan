const { chromium } = require('playwright');

async function testDemoCredentials() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track console messages
  page.on('console', msg => {
    console.log(`🔍 Browser console [${msg.type()}]:`, msg.text());
  });

  try {
    console.log('🚀 Testing demo credentials functionality...');
    
    // Step 1: Go to demo request page
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForTimeout(2000);
    
    // Step 2: Fill and submit form
    console.log('📝 Filling out demo form...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Test User');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Debug Test');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'debug@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Debug Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(3000);
    
    // Step 3: Look for success page
    const hasSuccessMessage = await page.locator('text=Demo u aktivizua').isVisible().catch(() => false);
    console.log('✅ Success page visible:', hasSuccessMessage);
    
    // Step 4: Look for credentials
    const hasEmail = await page.locator('text=manager_email1@gmail.com').isVisible().catch(() => false);
    const hasPassword = await page.locator('text=demo123').isVisible().catch(() => false);
    console.log('📧 Email credentials visible:', hasEmail);
    console.log('🔑 Password credentials visible:', hasPassword);
    
    // Step 5: Find and click the auto-login button
    const buttons = await page.locator('button').all();
    let autoLoginButton = null;
    
    for (let button of buttons) {
      const text = await button.textContent();
      console.log(`🔘 Found button: "${text?.trim()}"`);
      
      if (text && (text.includes('Hyr') && text.includes('Demo') || text.includes('kredenciale'))) {
        autoLoginButton = button;
        console.log(`✅ Found auto-login button: "${text.trim()}"`);
        break;
      }
    }
    
    if (autoLoginButton) {
      console.log('🖱️ Clicking auto-login button...');
      await autoLoginButton.click();
      await page.waitForTimeout(3000);
      
      // Step 6: Check for login form and debug info
      const hasDebugInfo = await page.locator('text=DEBUG:').isVisible().catch(() => false);
      console.log('🐛 Debug info visible:', hasDebugInfo);
      
      if (hasDebugInfo) {
        const debugText = await page.locator('text=DEBUG:').textContent();
        console.log('🔍 Debug text:', debugText);
      }
      
      // Check for form fields
      const emailField = page.locator('input[name="email"]');
      const passwordField = page.locator('input[name="password"]');
      
      const emailVisible = await emailField.isVisible().catch(() => false);
      const passwordVisible = await passwordField.isVisible().catch(() => false);
      
      console.log('📧 Email field visible:', emailVisible);
      console.log('🔑 Password field visible:', passwordVisible);
      
      if (emailVisible && passwordVisible) {
        const emailValue = await emailField.inputValue();
        const passwordValue = await passwordField.inputValue();
        
        console.log('📧 Email field value:', emailValue);
        console.log('🔑 Password field value:', passwordValue);
        
        if (emailValue === 'manager_email1@gmail.com' && passwordValue === 'demo123') {
          console.log('🎉 SUCCESS: Credentials are properly set!');
        } else {
          console.log('❌ ISSUE: Credentials not set correctly');
          console.log('Expected: manager_email1@gmail.com / demo123');
          console.log(`Got: ${emailValue} / ${passwordValue}`);
        }
      }
      
    } else {
      console.log('❌ Auto-login button not found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-demo-credentials-result.png', fullPage: true });
    console.log('📷 Screenshot saved as test-demo-credentials-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(5000); // Keep open to see results
    await browser.close();
  }
}

testDemoCredentials().catch(console.error);