const puppeteer = require('puppeteer');

async function testCorrectDemoCredentials() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 500
    });
    
    const page = await browser.newPage();
    
    // Monitor console and network
    page.on('console', msg => {
      console.log(`🖥️  [${msg.type().toUpperCase()}]`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('🚨 Page error:', error.message);
    });
    
    // Monitor API requests
    page.on('request', request => {
      if (request.url().includes('/auth/login')) {
        console.log('🔍 Login request:', request.method(), request.url());
        if (request.method() === 'POST') {
          console.log('📤 Login payload:', request.postData());
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/auth/login')) {
        console.log('📥 Login response:', response.status(), response.statusText());
      }
    });
    
    console.log('🚀 Testing CORRECT demo credentials...');
    console.log('📧 Email: manager_email1@gmail.com');
    console.log('🔑 Password: demo123');
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    console.log('✅ Navigated to login page');
    
    // Wait for React to hydrate
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      const reactFiberKey = Object.keys(form).find(key => key.startsWith('__reactFiber'));
      return !!reactFiberKey;
    }, { timeout: 10000 });
    console.log('✅ React hydrated');
    
    // Fill in the CORRECT demo credentials
    await page.type('#email', 'manager_email1@gmail.com');
    await page.type('#password', 'demo123');
    console.log('✅ Correct credentials filled');
    
    // Check form values
    const formValues = await page.evaluate(() => ({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    }));
    console.log('📋 Form values:', formValues);
    
    // Submit using JavaScript click
    console.log('✉️ Submitting form...');
    await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]');
      button.click();
    });
    
    // Wait for response and navigation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalUrl = page.url();
    console.log('🌐 Final URL:', finalUrl);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ Login successful with CORRECT credentials - redirected to dashboard');
    } else if (finalUrl.includes('/login')) {
      console.log('❌ Login failed with demo123 - still on login page');
      
      // Check for error messages
      const errorMessage = await page.$eval('.error-message', el => el.textContent).catch(() => 'No error message');
      console.log('❌ Error message:', errorMessage);
    } else {
      console.log('❓ Unexpected redirect to:', finalUrl);
    }
    
    console.log('✅ Correct demo credentials test completed');
    
    // Keep browser open for inspection
    console.log('🔍 Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testCorrectDemoCredentials();
