#!/usr/bin/env node

/**
 * Live Contact Form Test - Submit and See What Happens
 */

const { chromium } = require('playwright');

async function testContactFormLive() {
  console.log('🧪 Testing live contact form submission...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to contact page
    console.log('📍 Navigating to contact page...');
    await page.goto('https://skan.al/contact');
    await page.waitForLoadState('networkidle');
    
    // Fill out the form
    console.log('📝 Filling out contact form...');
    
    await page.fill('input[name="name"]', 'Live Test User');
    await page.fill('input[name="email"]', 'livetest@example.com');
    await page.fill('input[name="restaurant"]', 'Live Test Restaurant');
    await page.selectOption('select[name="subject"]', 'demo');
    await page.fill('textarea[name="message"]', 'This is a live test to see if the contact form works after the forms.html fix.');
    
    console.log('✅ Form filled successfully');
    
    // Submit the form and capture network requests
    console.log('📤 Submitting form...');
    
    // Listen for network responses
    page.on('response', response => {
      console.log(`📡 Response: ${response.status()} ${response.url()}`);
    });
    
    await page.click('button[type="submit"]');
    
    // Wait and see what happens
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('🌐 Current URL after submit:', currentUrl);
    
    if (currentUrl.includes('contact-success')) {
      console.log('✅ SUCCESS! Form redirected to success page');
      
      const pageContent = await page.textContent('body');
      console.log('📄 Success page contains:', pageContent.substring(0, 200) + '...');
      
    } else if (currentUrl.includes('contact')) {
      console.log('⚠️  Still on contact page - checking for messages...');
      
      // Check for any error or success messages
      const messages = await page.locator('div[class*="error"], div[class*="success"], div[class*="message"]').allTextContents();
      if (messages.length > 0) {
        console.log('💬 Messages found:', messages);
      } else {
        console.log('🤔 No visible messages');
      }
    } else {
      console.log('🔄 Redirected to unexpected URL:', currentUrl);
    }
    
    // Keep browser open for inspection
    console.log('\n🔍 Keeping browser open for manual inspection...');
    await page.waitForTimeout(30000); // Wait 30 seconds
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testContactFormLive().catch(console.error);