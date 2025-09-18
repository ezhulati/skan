const { chromium } = require('playwright');

async function simpleTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Going to production demo page...');
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForTimeout(3000);
    
    console.log('📝 Filling form...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Test User');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Last Name');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'test@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Test Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(4000);
    
    // Check if success page appears
    const successVisible = await page.locator('text=Demo u aktivizua').isVisible().catch(() => false);
    console.log('✅ Success page:', successVisible ? 'VISIBLE' : 'NOT VISIBLE');
    
    if (successVisible) {
      // Look for password display
      const passwordText = await page.textContent('body').catch(() => '');
      const hasDemo1234 = passwordText.includes('demo1234');
      const hasDemo123 = passwordText.includes('demo123');
      
      console.log('🔑 Password demo1234 found:', hasDemo1234 ? 'YES' : 'NO');
      console.log('🔑 Password demo123 found:', hasDemo123 ? 'YES' : 'NO');
      
      // Look for login button
      const loginButton = await page.locator('button:has-text("Hyr në Demo")').isVisible().catch(() => false);
      console.log('🔘 Login button visible:', loginButton ? 'YES' : 'NO');
      
      if (loginButton) {
        console.log('🖱️ Clicking login button...');
        await page.click('button:has-text("Hyr në Demo")');
        await page.waitForTimeout(5000);
        
        const finalUrl = page.url();
        console.log('🌐 Final URL:', finalUrl);
        
        const onDashboard = finalUrl.includes('/dashboard');
        console.log('📊 On dashboard:', onDashboard ? 'YES' : 'NO');
        
        if (onDashboard) {
          console.log('🎉 SUCCESS: Login worked!');
        } else {
          console.log('❌ FAILED: Not on dashboard');
        }
      }
    }
    
    await page.screenshot({ path: 'simple-test-result.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

simpleTest().catch(console.error);