#!/usr/bin/env node

/**
 * Final Contact Form Test
 * Tests contact form submission end-to-end after Netlify forms.html fix
 */

const { chromium } = require('playwright');

async function testContactForm() {
  console.log('🧪 Testing contact form submission after Netlify forms.html fix...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better visibility
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to contact page
    console.log('📍 Navigating to contact page...');
    await page.goto('https://skan.al/contact');
    await page.waitForLoadState('networkidle');
    
    // Check if form has Netlify attributes in live site
    console.log('🔍 Checking form attributes in live site...');
    const formAttributes = await page.evaluate(() => {
      const form = document.querySelector('form[name="contact"]');
      if (!form) return null;
      
      return {
        name: form.getAttribute('name'),
        method: form.getAttribute('method'),
        netlify: form.getAttribute('data-netlify'),
        honeypot: form.getAttribute('data-netlify-honeypot'),
        action: form.getAttribute('action'),
        hasFormName: !!form.querySelector('input[name="form-name"]'),
        hasBotField: !!form.querySelector('input[name="bot-field"]')
      };
    });
    
    console.log('Form attributes:', formAttributes);
    
    if (!formAttributes || !formAttributes.netlify) {
      console.log('❌ Form missing Netlify attributes - deployment may not be ready yet');
      return;
    }
    
    // Fill out the form
    console.log('📝 Filling out contact form...');
    
    await page.fill('input[name="name"]', 'Test User Final');
    await page.fill('input[name="email"]', 'testfinal@example.com');
    await page.fill('input[name="restaurant"]', 'Test Restaurant Final');
    await page.selectOption('select[name="subject"]', 'demo');
    await page.fill('textarea[name="message"]', 'This is a final test of the contact form after adding forms.html for Netlify detection.');
    
    console.log('✅ Form filled successfully');
    
    // Submit the form
    console.log('📤 Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for success page or check for errors
    try {
      // Wait for either success page or stay on same page with error
      await page.waitForURL('**/contact-success**', { timeout: 10000 });
      console.log('✅ Form submitted successfully - redirected to success page!');
      
      // Check success page content
      const successHeading = await page.textContent('h1');
      console.log('Success page heading:', successHeading);
      
    } catch (timeoutError) {
      console.log('⏰ No redirect to success page within 10 seconds');
      
      // Check if still on contact page
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check for any error messages
      const errorMessages = await page.locator('.error, .alert, [role="alert"]').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ Error messages found:', errorMessages);
      } else {
        console.log('🤔 No error messages visible');
      }
    }
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close when done');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testContactForm().catch(console.error);