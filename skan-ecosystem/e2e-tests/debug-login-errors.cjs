const puppeteer = require('puppeteer');

async function debugLoginErrors() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Capture ALL console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🖥️  [${type.toUpperCase()}]`, text);
    });
    
    // Capture all JavaScript errors
    page.on('pageerror', error => {
      console.log('🚨 JavaScript Error:', error.message);
      console.log('Stack:', error.stack);
    });
    
    // Capture unhandled promise rejections
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`🚨 HTTP Error: ${response.status()} ${response.url()}`);
      }
    });
    
    // Track network requests including those that might fail
    page.on('requestfailed', request => {
      console.log('🚨 Request failed:', request.url(), request.failure().errorText);
    });
    
    let loginRequestData = null;
    page.on('request', request => {
      if (request.url().includes('/auth/login') && request.method() === 'POST') {
        loginRequestData = request.postData();
        console.log('🔍 Login request intercepted:', loginRequestData);
      }
    });
    
    console.log('🚀 Opening admin portal...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Wait for React to hydrate
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      const reactFiberKey = Object.keys(form).find(key => key.startsWith('__reactFiber'));
      return !!reactFiberKey;
    }, { timeout: 10000 });
    
    // Check environment and context setup
    const contextInfo = await page.evaluate(() => {
      // Check environment variables (safely)
      const envVars = {
        REACT_APP_API_URL: (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 'undefined'
      };
      
      // Check if AuthContext is available
      const form = document.querySelector('form');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const submitButton = document.querySelector('button[type="submit"]');
      
      return {
        envVars,
        formExists: !!form,
        emailExists: !!emailInput,
        passwordExists: !!passwordInput,
        submitExists: !!submitButton,
        submitButtonDisabled: submitButton?.disabled || false,
        submitButtonType: submitButton?.type || 'unknown'
      };
    });
    
    console.log('🔍 Context info:', contextInfo);
    
    // Fill the form
    console.log('📝 Filling form...');
    await page.type('#email', 'manager_email1@gmail.com');
    await page.type('#password', 'demo123');
    
    // Check form values one more time
    const formValues = await page.evaluate(() => ({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    }));
    console.log('📋 Form values:', formValues);
    
    // Inject code to hook into the form submission at the React level
    await page.evaluate(() => {
      // Override console.error to catch any errors during submission
      const originalError = console.error;
      console.error = function(...args) {
        console.log('🚨 CONSOLE ERROR DURING SUBMISSION:', ...args);
        originalError.apply(console, args);
      };
      
      // Hook into fetch to see what's being called
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        console.log('🌐 FETCH CALLED:', args[0], args[1]);
        return originalFetch.apply(window, args);
      };
      
      console.log('🔧 Debugging hooks installed');
    });
    
    console.log('✉️ Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait longer for any async operations
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check results
    if (loginRequestData) {
      console.log('✅ Login request made:', loginRequestData);
    } else {
      console.log('❌ No login request detected');
      
      // Check if we stayed on the login page
      const currentUrl = page.url();
      console.log('🌐 Current URL:', currentUrl);
      
      // Check for error messages
      const errorMessage = await page.$eval('.error-message', el => el.textContent).catch(() => 'No error message');
      console.log('❌ Error message:', errorMessage);
      
      // Check button state
      const buttonState = await page.evaluate(() => {
        const button = document.querySelector('button[type="submit"]');
        return {
          disabled: button?.disabled,
          textContent: button?.textContent?.trim()
        };
      });
      console.log('🔘 Button state:', buttonState);
    }
    
    console.log('✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugLoginErrors();