const { chromium } = require('playwright');

async function testContactReal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Real contact form submission test...');
    
    await page.goto('https://skan.al/contact');
    await page.waitForTimeout(3000);
    
    // Check form attributes more thoroughly
    const formHtml = await page.locator('form[name="contact"]').innerHTML();
    console.log('📋 Form has data-netlify:', formHtml.includes('data-netlify="true"'));
    console.log('📋 Form has honeypot:', formHtml.includes('data-netlify-honeypot'));
    console.log('📋 Form action:', formHtml.includes('contact-success'));
    
    // Fill form with real data
    console.log('📝 Filling real contact form...');
    await page.fill('input[name="name"]', 'Contact Form Test');
    await page.fill('input[name="email"]', 'test@contactform.com');
    await page.fill('textarea[name="message"]', 'Testing contact form functionality to ensure it works correctly.');
    
    // Monitor navigation
    let navigationOccurred = false;
    page.on('framenavigated', () => {
      navigationOccurred = true;
      console.log(`🧭 Navigation to: ${page.url()}`);
    });
    
    // Submit and wait for navigation or response
    console.log('📤 Submitting form...');
    await Promise.race([
      page.waitForNavigation({ timeout: 10000 }),
      page.waitForTimeout(10000)
    ]);
    
    // Check final state
    const finalUrl = page.url();
    console.log(`🌐 Final URL: ${finalUrl}`);
    console.log(`🧭 Navigation occurred: ${navigationOccurred}`);
    
    // Check for success indicators
    const onSuccessPage = finalUrl.includes('contact-success');
    const hasSuccessContent = await page.locator('text=success, text=thank, text=faleminderit, text=Message sent').isVisible().catch(() => false);
    
    console.log(`✅ On success page: ${onSuccessPage}`);
    console.log(`✅ Has success content: ${hasSuccessContent}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'contact-real-test.png', fullPage: true });
    
    if (onSuccessPage || hasSuccessContent) {
      console.log('🎉 Contact form is working correctly!');
    } else {
      console.log('⚠️ Contact form may need configuration check');
      
      // Check for any error messages
      const bodyText = await page.textContent('body');
      if (bodyText.includes('404') || bodyText.includes('Not Found')) {
        console.log('❌ 404 error - success page not found');
      } else if (bodyText.includes('500') || bodyText.includes('Error')) {
        console.log('❌ Server error occurred');
      } else {
        console.log('ℹ️ Form submitted but unclear result');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testContactReal().catch(console.error);