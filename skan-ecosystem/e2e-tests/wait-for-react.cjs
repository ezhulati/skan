const puppeteer = require('puppeteer');

async function waitForReactLogin() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Track network requests
    let loginRequestData = null;
    page.on('request', request => {
      if (request.url().includes('/auth/login') && request.method() === 'POST') {
        loginRequestData = request.postData();
        console.log('🔍 Login request intercepted:', loginRequestData);
      }
    });
    
    console.log('🚀 Opening admin portal...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Wait for React to fully load by checking for React-specific elements
    console.log('⏳ Waiting for React to hydrate...');
    
    await page.waitForFunction(() => {
      // Check if the form has React event handlers attached
      const form = document.querySelector('form');
      if (!form) return false;
      
      // Check if the form has React fiber properties (indicating React is hydrated)
      const reactFiberKey = Object.keys(form).find(key => key.startsWith('__reactFiber'));
      const reactInternalKey = Object.keys(form).find(key => key.startsWith('__reactInternalInstance'));
      
      return !!(reactFiberKey || reactInternalKey);
    }, { timeout: 10000 });
    
    console.log('✅ React appears to be hydrated');
    
    // Wait a bit more to ensure all event handlers are attached
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill the form
    console.log('📝 Filling form...');
    await page.type('#email', 'manager_email1@gmail.com');
    await page.type('#password', 'demo123');
    
    // Check form values
    const formValues = await page.evaluate(() => ({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    }));
    
    console.log('📋 Form values:', formValues);
    
    // Check if React event handlers are attached
    const hasReactHandlers = await page.evaluate(() => {
      const form = document.querySelector('form');
      const button = document.querySelector('button[type="submit"]');
      
      // Check for React fiber properties
      const formFiber = Object.keys(form).find(key => key.startsWith('__reactFiber'));
      const buttonFiber = Object.keys(button).find(key => key.startsWith('__reactFiber'));
      
      return {
        formHasReactFiber: !!formFiber,
        buttonHasReactFiber: !!buttonFiber,
        formOnSubmit: typeof form.onsubmit,
        reactFiberKeys: Object.keys(form).filter(key => key.startsWith('__react'))
      };
    });
    
    console.log('🔍 React handlers check:', hasReactHandlers);
    
    // Submit the form
    console.log('✉️ Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for network activity
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check results
    if (loginRequestData) {
      console.log('✅ Login request sent:', loginRequestData);
      try {
        const parsed = JSON.parse(loginRequestData);
        console.log('📊 Parsed request data:', parsed);
      } catch (e) {
        console.log('❌ Could not parse request data');
      }
    } else {
      console.log('❌ No login request intercepted');
    }
    
    // Check final URL
    const finalUrl = page.url();
    console.log('🌐 Final URL:', finalUrl);
    
    // Check for any error messages
    const hasError = await page.$('.error-message');
    if (hasError) {
      const errorText = await hasError.evaluate(el => el.textContent);
      console.log('❌ Error message:', errorText);
    }
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

waitForReactLogin();