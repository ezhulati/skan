const puppeteer = require('puppeteer');

async function debugReactHandlers() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`🖥️  [${msg.type().toUpperCase()}]`, msg.text());
    });
    
    // Track login request
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
    
    console.log('✅ React hydrated');
    
    // Fill the form
    await page.type('#email', 'manager_email1@gmail.com');
    await page.type('#password', 'demo123');
    
    // Hook into React components to debug the submission
    await page.evaluate(() => {
      // Find the React fiber node for the form
      const form = document.querySelector('form');
      const formFiberKey = Object.keys(form).find(key => key.startsWith('__reactFiber'));
      
      if (formFiberKey) {
        const formFiber = form[formFiberKey];
        console.log('🔍 Form fiber found');
        
        // Try to find the onSubmit handler
        const memoizedProps = formFiber?.memoizedProps;
        if (memoizedProps?.onSubmit) {
          console.log('✅ Form has onSubmit handler');
          
          // Wrap the original onSubmit handler
          const originalOnSubmit = memoizedProps.onSubmit;
          memoizedProps.onSubmit = function(e) {
            console.log('🎯 React onSubmit handler called!');
            console.log('Event:', e);
            console.log('Form data:', {
              email: document.getElementById('email').value,
              password: document.getElementById('password').value
            });
            
            try {
              const result = originalOnSubmit.call(this, e);
              console.log('✅ onSubmit handler completed');
              return result;
            } catch (error) {
              console.error('❌ Error in onSubmit handler:', error);
              throw error;
            }
          };
        } else {
          console.log('❌ No onSubmit handler found in memoizedProps');
          console.log('Available props:', Object.keys(memoizedProps || {}));
        }
      } else {
        console.log('❌ No React fiber found on form');
      }
      
      // Also hook into form submission at DOM level
      form.addEventListener('submit', (e) => {
        console.log('🌐 DOM submit event fired');
        console.log('Default prevented?', e.defaultPrevented);
      }, { capture: true });
      
      // Hook into button click
      const button = document.querySelector('button[type="submit"]');
      if (button) {
        button.addEventListener('click', (e) => {
          console.log('🖱️  Submit button clicked');
          console.log('Button disabled?', button.disabled);
        }, { capture: true });
      }
      
      console.log('🔧 Debug hooks installed');
    });
    
    console.log('✉️ Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for potential async operations
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check results
    if (loginRequestData) {
      console.log('✅ Login request made:', loginRequestData);
    } else {
      console.log('❌ No login request detected');
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

debugReactHandlers();