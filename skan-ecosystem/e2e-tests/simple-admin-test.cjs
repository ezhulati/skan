const puppeteer = require('puppeteer');

async function testAdminLogin() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Console error:', msg.text());
      }
    });
    
    // Log page errors
    page.on('pageerror', error => {
      console.log('🚨 Page error:', error.message);
    });
    
    // Log network requests to see what's sent
    let loginRequestData = null;
    page.on('request', request => {
      if (request.url().includes('/auth/login') && request.method() === 'POST') {
        loginRequestData = request.postData();
        console.log('🔍 Login request intercepted:', loginRequestData);
      }
    });
    
    // Log network responses
    page.on('response', response => {
      if (response.url().includes('/auth/login')) {
        console.log('📥 Login response:', response.status(), response.statusText());
      }
    });
    
    console.log('🚀 Testing admin login...');
    
    // Go to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded');
    
    // Wait for form elements
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.waitForSelector('#password', { timeout: 10000 });
    console.log('✅ Form elements found');
    
    // Fill the form
    await page.type('#email', 'manager_email1@gmail.com');
    await page.type('#password', 'demo123');
    console.log('✅ Form filled');
    
    // Check form values
    const emailValue = await page.$eval('#email', el => el.value);
    const passwordValue = await page.$eval('#password', el => el.value);
    console.log('📝 Form values:', { email: emailValue, password: passwordValue });
    
    // Add debugging to the form submission
    await page.evaluate(() => {
      const form = document.querySelector('form');
      const originalSubmit = form.onsubmit;
      
      form.addEventListener('submit', (e) => {
        console.log('Form submit event triggered');
        console.log('Form data:', {
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        });
      });
    });
    
    // Submit form
    await page.click('button[type="submit"]');
    console.log('✅ Form submitted');
    
    // Wait for network activity
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what was sent
    if (loginRequestData) {
      console.log('📤 Request data sent:', loginRequestData);
      try {
        const parsed = JSON.parse(loginRequestData);
        console.log('📋 Parsed data:', parsed);
      } catch (e) {
        console.log('❌ Could not parse request data');
      }
    } else {
      console.log('❌ No login request intercepted');
    }
    
    // Check for any errors on page
    const errorElement = await page.$('.error-message');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error on page:', errorText);
    }
    
    // Check current URL
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAdminLogin();