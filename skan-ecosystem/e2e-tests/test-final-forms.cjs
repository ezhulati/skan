const { chromium } = require('playwright');

async function testFinalForms() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing both forms with final fixes...');
    
    // Test 1: Demo Request Form
    console.log('\n===== TESTING DEMO REQUEST FORM =====');
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForTimeout(3000);
    
    console.log('📝 Filling demo request form...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Final');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Test');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'finaltest@forms.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Final Test Restaurant & Café');
    
    // Check honeypot field is hidden
    const honeypotField = await page.locator('input[name="bot-field"]').isHidden();
    console.log(`🍯 Honeypot field hidden: ${honeypotField ? 'YES' : 'NO'}`);
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(4000);
    
    // Check success
    const demoSuccess = await page.locator('text=Demo u aktivizua').isVisible().catch(() => false);
    console.log(`✅ Demo form success: ${demoSuccess ? 'YES' : 'NO'}`);
    
    if (demoSuccess) {
      // Check auto-login button
      const loginButton = await page.locator('button:has-text("Hyr në Demo")').isVisible().catch(() => false);
      console.log(`🔘 Auto-login button: ${loginButton ? 'VISIBLE' : 'NOT VISIBLE'}`);
      
      // Check credentials display
      const hasCorrectPassword = await page.textContent('body').then(text => text.includes('demo123')).catch(() => false);
      console.log(`🔑 Shows correct password (demo123): ${hasCorrectPassword ? 'YES' : 'NO'}`);
    }
    
    // Test 2: Contact Form  
    console.log('\n===== TESTING CONTACT FORM =====');
    await page.goto('https://skan.al/contact');
    await page.waitForTimeout(3000);
    
    console.log('📝 Filling contact form...');
    await page.fill('input[name="name"]', 'Final Test User');
    await page.fill('input[name="email"]', 'finaltest@contact.com');
    await page.fill('textarea[name="message"]', 'Testing the contact form with honeypot protection. This should work perfectly now!');
    
    // Check honeypot field is hidden
    const contactHoneypot = await page.locator('input[name="bot-field"]').isHidden();
    console.log(`🍯 Contact honeypot hidden: ${contactHoneypot ? 'YES' : 'NO'}`);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    // Check for success redirect or message
    const contactSuccess = page.url().includes('contact-success') || 
                          await page.locator('text=success, text=Thank, text=Faleminderit').isVisible().catch(() => false);
    console.log(`✅ Contact form success: ${contactSuccess ? 'YES' : 'NO'}`);
    
    // Test 3: Honeypot Protection (simulate bot)
    console.log('\n===== TESTING HONEYPOT PROTECTION =====');
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForTimeout(2000);
    
    console.log('🤖 Simulating bot behavior (filling honeypot)...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Bot');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Test');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'bot@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Bot Restaurant');
    
    // Fill honeypot (what bots would do)
    await page.evaluate(() => {
      const honeypot = document.querySelector('input[name="bot-field"]');
      if (honeypot) honeypot.value = 'I am a bot';
    });
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(4000);
    
    // Check if submission was blocked
    const botBlocked = !await page.locator('text=Demo u aktivizua').isVisible().catch(() => true);
    console.log(`🛡️ Bot submission blocked: ${botBlocked ? 'YES (GOOD)' : 'NO (BAD)'}`);
    
    console.log('\n===== FINAL RESULTS =====');
    console.log(`✅ Demo form works: ${demoSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Contact form works: ${contactSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Honeypot protection: ${botBlocked ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Auto-login functional: ${loginButton ? 'PASS' : 'FAIL'}`);
    
    await page.screenshot({ path: 'final-forms-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testFinalForms().catch(console.error);
