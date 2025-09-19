const puppeteer = require('puppeteer');

async function testDemoRequestFlow() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 1000
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
      if (request.url().includes('/api') || request.url().includes('/auth') || request.url().includes('/demo')) {
        console.log('🔍 API request:', request.method(), request.url());
        if (request.method() === 'POST') {
          console.log('📤 Payload:', request.postData());
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api') || response.url().includes('/auth') || response.url().includes('/demo')) {
        console.log('📥 API response:', response.status(), response.url());
      }
    });
    
    console.log('🚀 Testing demo request flow...');
    
    // Step 1: Go to login page and click demo request
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    console.log('✅ Navigated to login page');
    
    // Look for demo request link
    const demoRequestLink = await page.$('a[href="/demo-request"]');
    if (demoRequestLink) {
      console.log('✅ Found demo request link');
      await demoRequestLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('✅ Navigated to demo request page');
    } else {
      console.log('❌ Demo request link not found, navigating directly');
      await page.goto('http://localhost:3000/demo-request', { waitUntil: 'networkidle0' });
    }
    
    console.log('🌐 Current URL:', page.url());
    
    // Step 2: Fill out demo request form
    console.log('📝 Filling demo request form...');
    
    // Check what form fields are available
    const formFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map(input => ({
        name: input.name,
        id: input.id,
        type: input.type,
        placeholder: input.placeholder,
        required: input.required
      }));
    });
    
    console.log('📋 Available form fields:', formFields);
    
    // Fill out the form (adjust fields based on what's available)
    const testData = {
      restaurantName: 'Test Demo Restaurant',
      ownerName: 'Test Owner',
      email: 'test-demo@example.com',
      phone: '+355691234567',
      location: 'Tirana, Albania'
    };
    
    // Try to fill common field variations
    const fieldMappings = [
      { selector: '#restaurantName', value: testData.restaurantName },
      { selector: '#restaurant-name', value: testData.restaurantName },
      { selector: 'input[name="restaurantName"]', value: testData.restaurantName },
      { selector: 'input[placeholder*="restaurant"]', value: testData.restaurantName },
      
      { selector: '#ownerName', value: testData.ownerName },
      { selector: '#owner-name', value: testData.ownerName },
      { selector: 'input[name="ownerName"]', value: testData.ownerName },
      { selector: 'input[placeholder*="name"]', value: testData.ownerName },
      
      { selector: '#email', value: testData.email },
      { selector: 'input[name="email"]', value: testData.email },
      { selector: 'input[type="email"]', value: testData.email },
      
      { selector: '#phone', value: testData.phone },
      { selector: 'input[name="phone"]', value: testData.phone },
      { selector: 'input[type="tel"]', value: testData.phone },
      
      { selector: '#location', value: testData.location },
      { selector: 'input[name="location"]', value: testData.location }
    ];
    
    for (const field of fieldMappings) {
      try {
        const element = await page.$(field.selector);
        if (element) {
          await element.click();
          await element.evaluate(el => el.value = ''); // Clear first
          await element.type(field.value);
          console.log(`✅ Filled ${field.selector}: ${field.value}`);
        }
      } catch (e) {
        // Field doesn't exist, continue
      }
    }
    
    // Step 3: Submit demo request
    console.log('✉️ Submitting demo request...');
    
    const submitButton = await page.$('button[type="submit"], input[type="submit"], .submit-button, .demo-request-button');
    if (submitButton) {
      await submitButton.click();
      console.log('✅ Demo request submitted');
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('❌ Submit button not found');
    }
    
    const currentUrl = page.url();
    console.log('🌐 URL after submission:', currentUrl);
    
    // Check for success message or credentials
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasSuccessMessage: document.body.textContent.includes('success') || document.body.textContent.includes('Success'),
        hasCredentials: document.body.textContent.includes('email') && document.body.textContent.includes('password'),
        hasError: document.body.textContent.includes('error') || document.body.textContent.includes('Error'),
        bodyText: document.body.textContent.substring(0, 1000)
      };
    });
    
    console.log('📄 Page content after submission:', pageContent);
    
    // If we got credentials, try to extract them
    if (pageContent.hasCredentials) {
      console.log('🔑 Demo credentials appear to be displayed');
      
      // Try to extract email and password from the page
      const credentials = await page.evaluate(() => {
        const text = document.body.textContent;
        const emailMatch = text.match(/email[:\s]*([^\s]+@[^\s]+)/i);
        const passwordMatch = text.match(/password[:\s]*([^\s]+)/i);
        
        return {
          email: emailMatch ? emailMatch[1] : null,
          password: passwordMatch ? passwordMatch[1] : null
        };
      });
      
      console.log('📧 Extracted credentials:', credentials);
      
      if (credentials.email && credentials.password) {
        // Step 4: Try to login with the demo credentials
        console.log('🔄 Now testing login with demo credentials...');
        
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        
        // Wait for React to hydrate
        await page.waitForFunction(() => {
          const form = document.querySelector('form');
          if (!form) return false;
          const reactFiberKey = Object.keys(form).find(key => key.startsWith('__reactFiber'));
          return !!reactFiberKey;
        }, { timeout: 10000 });
        
        // Fill and submit login
        await page.type('#email', credentials.email);
        await page.type('#password', credentials.password);
        
        console.log(`✉️ Attempting login with: ${credentials.email} / ${credentials.password}`);
        
        await page.evaluate(() => {
          const button = document.querySelector('button[type="submit"]');
          button.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const loginResult = page.url();
        if (loginResult.includes('/dashboard')) {
          console.log('✅ Demo credentials login successful!');
        } else {
          console.log('❌ Demo credentials login failed - still on:', loginResult);
          
          const errorMsg = await page.$eval('.error-message', el => el.textContent).catch(() => 'No error message');
          console.log('❌ Login error:', errorMsg);
        }
      }
    }
    
    console.log('✅ Demo request flow test completed');
    
    // Keep browser open for inspection
    console.log('🔍 Keeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDemoRequestFlow();