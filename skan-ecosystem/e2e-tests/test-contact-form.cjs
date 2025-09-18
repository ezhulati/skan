const { chromium } = require('playwright');

async function testContactForm() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing contact form specifically...');
    
    await page.goto('https://skan.al/contact');
    await page.waitForTimeout(3000);
    
    console.log('✅ Contact page loaded');
    
    // Check form exists
    const form = await page.locator('form[name="contact"]').isVisible().catch(() => false);
    console.log(`📋 Contact form visible: ${form ? 'YES' : 'NO'}`);
    
    if (form) {
      // Check honeypot field is hidden
      const honeypotHidden = await page.locator('input[name="bot-field"]').isHidden();
      console.log(`🍯 Honeypot field hidden: ${honeypotHidden ? 'YES' : 'NO'}`);
      
      // Check form has data-netlify attribute
      const isNetlifyForm = await page.locator('form[data-netlify="true"]').isVisible().catch(() => false);
      console.log(`🌐 Netlify form configured: ${isNetlifyForm ? 'YES' : 'NO'}`);
      
      // Fill out the form
      console.log('📝 Filling contact form...');
      await page.fill('input[name="name"]', 'Contact Test User');
      await page.fill('input[name="email"]', 'contacttest@forms.com');
      await page.fill('textarea[name="message"]', 'This is a test of the contact form to verify it works correctly with honeypot protection.');
      
      // Take screenshot before submission
      await page.screenshot({ path: 'contact-form-before.png', fullPage: true });
      
      // Submit form
      console.log('📤 Submitting contact form...');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      // Check current URL and page content
      const currentUrl = page.url();
      console.log(`🌐 Current URL after submission: ${currentUrl}`);
      
      // Check for success indicators
      const successRedirect = currentUrl.includes('contact-success') || currentUrl.includes('success');
      const successMessage = await page.locator('text=success, text=thank, text=faleminderit, text=Thank').isVisible().catch(() => false);
      const stillOnContactPage = currentUrl.includes('/contact');
      
      console.log(`✅ Success redirect: ${successRedirect ? 'YES' : 'NO'}`);
      console.log(`✅ Success message visible: ${successMessage ? 'YES' : 'NO'}`);
      console.log(`📍 Still on contact page: ${stillOnContactPage ? 'YES' : 'NO'}`);
      
      // Take final screenshot
      await page.screenshot({ path: 'contact-form-after.png', fullPage: true });
      
      // Test honeypot protection
      console.log('\n🤖 Testing honeypot protection...');
      if (stillOnContactPage) {
        // Go back to contact page if not there
        await page.goto('https://skan.al/contact');
        await page.waitForTimeout(2000);
      }
      
      // Fill form as a bot would (including honeypot)
      await page.fill('input[name="name"]', 'Bot User');
      await page.fill('input[name="email"]', 'bot@spam.com');
      await page.fill('textarea[name="message"]', 'This is spam from a bot');
      
      // Fill honeypot field (what bots do)
      await page.evaluate(() => {
        const honeypot = document.querySelector('input[name="bot-field"]');
        if (honeypot) honeypot.value = 'I am a spam bot';
      });
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);
      
      const botUrl = page.url();
      const botBlocked = !botUrl.includes('success') && !await page.locator('text=success, text=thank').isVisible().catch(() => true);
      console.log(`🛡️ Bot submission blocked: ${botBlocked ? 'YES (GOOD)' : 'NO (BAD)'}`);
      
    } else {
      console.log('❌ Contact form not found');
    }
    
    console.log('\n===== CONTACT FORM TEST RESULTS =====');
    console.log(`📋 Form exists: ${form ? 'PASS' : 'FAIL'}`);
    console.log(`🍯 Honeypot protection: ${honeypotHidden ? 'PASS' : 'FAIL'}`);
    console.log(`🌐 Netlify integration: ${isNetlifyForm ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Form submission: ${successRedirect || successMessage ? 'PASS' : 'NEEDS MANUAL CHECK'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testContactForm().catch(console.error);