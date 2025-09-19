const puppeteer = require('puppeteer');

async function detailedDebug() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,  // Make it visible 
      devtools: true,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 100
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🖥️  [${type.toUpperCase()}]`, text);
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log('🚨 JavaScript Error:', error.message);
    });
    
    // Track all network requests
    page.on('request', request => {
      const url = request.url();
      const method = request.method();
      if (url.includes('localhost') || url.includes('auth')) {
        console.log(`📤 ${method} ${url}`);
        if (method === 'POST') {
          console.log('📝 POST Data:', request.postData());
        }
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      if (url.includes('localhost') || url.includes('auth')) {
        console.log(`📥 ${status} ${url}`);
      }
    });
    
    console.log('🚀 Opening admin portal...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Wait for the page to fully load
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.waitForSelector('#password', { timeout: 10000 });
    
    // Check if React is loaded and if there are any immediate errors
    const reactCheck = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasForm: !!document.querySelector('form'),
        hasEmailInput: !!document.getElementById('email'),
        hasPasswordInput: !!document.getElementById('password'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        formOnSubmit: document.querySelector('form').onsubmit?.toString() || 'none',
        emailValue: document.getElementById('email').value,
        passwordValue: document.getElementById('password').value
      };
    });
    
    console.log('🔍 Page state:', reactCheck);
    
    // Clear and fill the form slowly
    console.log('📝 Filling form...');
    
    await page.focus('#email');
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.type('#email', 'manager_email1@gmail.com', { delay: 100 });
    
    await page.focus('#password');
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.type('#password', 'demo123', { delay: 100 });
    
    // Check values again
    const formValues = await page.evaluate(() => ({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    }));
    
    console.log('📋 Form values after typing:', formValues);
    
    // Add a hook to the form submission
    await page.evaluate(() => {
      const form = document.querySelector('form');
      const button = document.querySelector('button[type="submit"]');
      
      // Hook into the form submit event
      form.addEventListener('submit', (e) => {
        console.log('🎯 Form submit event fired!');
        console.log('Form data:', {
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        });
        console.log('Event prevented?', e.defaultPrevented);
      });
      
      // Hook into button click
      button.addEventListener('click', (e) => {
        console.log('🖱️  Submit button clicked!');
        console.log('Button disabled?', button.disabled);
        console.log('Button type:', button.type);
      });
      
      console.log('🔧 Event listeners added');
    });
    
    console.log('🖱️  Clicking submit button...');
    await page.click('button[type="submit"]');
    
    // Wait and see what happens
    console.log('⏱️  Waiting for form submission...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check the current URL and page state
    const finalState = await page.evaluate(() => ({
      url: window.location.href,
      hasError: !!document.querySelector('.error-message'),
      errorText: document.querySelector('.error-message')?.textContent || 'none',
      buttonDisabled: document.querySelector('button[type="submit"]')?.disabled || false
    }));
    
    console.log('🏁 Final state:', finalState);
    
    console.log('✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

detailedDebug();