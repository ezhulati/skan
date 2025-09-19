const puppeteer = require('puppeteer');

async function debugFormSubmission() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log(`🖥️  [${msg.type().toUpperCase()}]`, msg.text());
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
    
    // Fill the form
    await page.type('#email', 'manager_email1@gmail.com');
    await page.type('#password', 'demo123');
    
    // Check the form structure
    const formStructure = await page.evaluate(() => {
      const form = document.querySelector('form');
      const button = document.querySelector('button[type="submit"]');
      
      return {
        formExists: !!form,
        buttonExists: !!button,
        buttonInForm: form && button && form.contains(button),
        buttonType: button?.type,
        buttonDisabled: button?.disabled,
        formAction: form?.action,
        formMethod: form?.method,
        buttonForm: button?.form === form,
        formChildrenCount: form?.children.length,
        formTagName: form?.tagName,
        buttonTagName: button?.tagName
      };
    });
    
    console.log('🔍 Form structure:', formStructure);
    
    // Add event listeners to track all possible events
    await page.evaluate(() => {
      const form = document.querySelector('form');
      const button = document.querySelector('button[type="submit"]');
      
      // Add comprehensive event tracking
      ['click', 'mousedown', 'mouseup', 'submit', 'keydown', 'keyup'].forEach(eventType => {
        if (button) {
          button.addEventListener(eventType, (e) => {
            console.log(`🔘 Button ${eventType}:`, {
              type: e.type,
              target: e.target.tagName,
              defaultPrevented: e.defaultPrevented,
              bubbles: e.bubbles
            });
          }, { capture: true });
        }
        
        if (form && ['submit'].includes(eventType)) {
          form.addEventListener(eventType, (e) => {
            console.log(`📝 Form ${eventType}:`, {
              type: e.type,
              target: e.target.tagName,
              defaultPrevented: e.defaultPrevented,
              bubbles: e.bubbles
            });
          }, { capture: true });
        }
      });
      
      console.log('📡 Event listeners added');
    });
    
    console.log('🖱️  Method 1: Clicking with Puppeteer...');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!loginRequestData) {
      console.log('🖱️  Method 2: Clicking with JavaScript...');
      await page.evaluate(() => {
        const button = document.querySelector('button[type="submit"]');
        console.log('📍 About to click button with JS');
        button.click();
        console.log('✅ Button clicked with JS');
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!loginRequestData) {
      console.log('📝 Method 3: Triggering form submit directly...');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        console.log('📍 About to submit form directly');
        
        // Create and dispatch submit event
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        console.log('✅ Form submit event dispatched');
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!loginRequestData) {
      console.log('⌨️  Method 4: Pressing Enter in form...');
      await page.focus('#password');
      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check results
    if (loginRequestData) {
      console.log('✅ Login request made:', loginRequestData);
    } else {
      console.log('❌ No login request detected after all methods');
    }
    
    console.log('🌐 Final URL:', page.url());
    console.log('✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugFormSubmission();