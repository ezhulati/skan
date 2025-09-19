const puppeteer = require('puppeteer');
const ApiHelpers = require('../utils/api-helpers');

describe('API vs UI Login Debug', () => {
  let browser;
  let page;
  let apiHelpers;

  beforeAll(async () => {
    console.log('🔍 Debugging API vs UI login differences');
    
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 500,
      devtools: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    apiHelpers = new ApiHelpers();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    console.log('✅ API vs UI Debug Complete');
  });

  test('1. Compare direct API vs UI request payload', async () => {
    console.log('📡 Testing direct API call...');
    
    // Test direct API call
    const apiResult = await apiHelpers.login('manager_email1@gmail.com', 'demo123');
    console.log('✅ Direct API Result:', {
      success: apiResult.success,
      user: apiResult.user?.fullName || apiResult.user?.email,
      venue: apiResult.venue?.name,
      error: apiResult.error
    });
    
    // Now intercept UI request
    console.log('\n🕵️ Intercepting UI login request...');
    
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Capture network requests with detailed payload
    const networkRequests = [];
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      if (request.url().includes('/auth/login')) {
        const postData = request.postData();
        const headers = request.headers();
        
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: headers,
          payload: postData,
          payloadParsed: postData ? (() => {
            try {
              return JSON.parse(postData);
            } catch (e) {
              return { error: 'Could not parse JSON', raw: postData };
            }
          })() : null
        });
        
        console.log('🔍 Intercepted login request:');
        console.log('URL:', request.url());
        console.log('Method:', request.method());
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('Payload:', postData);
        
        if (postData) {
          try {
            const parsed = JSON.parse(postData);
            console.log('Parsed payload:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('Could not parse payload as JSON');
          }
        }
      }
      
      request.continue();
    });
    
    // Navigate to login page
    await page.goto('https://admin.skan.al/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill and submit form
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      
      if (emailInput && passwordInput) {
        emailInput.value = 'manager_email1@gmail.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        passwordInput.value = 'demo123';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Submit form and wait for request
    await page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
      }
    });
    
    // Wait for login request to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📊 Network Request Analysis:');
    networkRequests.forEach((req, index) => {
      console.log(`Request ${index + 1}:`);
      console.log(`  URL: ${req.url}`);
      console.log(`  Method: ${req.method}`);
      console.log(`  Payload:`, req.payloadParsed || req.payload || 'No payload');
      console.log(`  Content-Type: ${req.headers['content-type'] || 'Not set'}`);
    });
    
    // Test what happens if we send correct payload manually
    console.log('\n🧪 Testing manual API call from browser...');
    
    const manualApiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://admin.skan.al'
          },
          body: JSON.stringify({
            email: 'manager_email1@gmail.com',
            password: 'demo123'
          })
        });
        
        const data = await response.json();
        
        return {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries([...response.headers.entries()])
        };
      } catch (error) {
        return {
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('🧪 Manual API test result:', JSON.stringify(manualApiTest, null, 2));
    
    // Compare payloads
    console.log('\n🔍 Payload Comparison:');
    console.log('Expected (working direct API):');
    console.log(JSON.stringify({
      email: 'manager_email1@gmail.com',
      password: 'demo123'
    }, null, 2));
    
    console.log('\nActual (UI request):');
    const uiPayload = networkRequests.find(req => req.payload)?.payloadParsed;
    console.log(JSON.stringify(uiPayload, null, 2));
    
    // Test form validation
    const formState = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const form = document.querySelector('form');
      
      return {
        emailValue: emailInput?.value,
        passwordValue: passwordInput?.value ? '[REDACTED]' : 'empty',
        formData: form ? new FormData(form) : null,
        emailValid: emailInput?.validity?.valid,
        passwordValid: passwordInput?.validity?.valid,
        formValid: form?.checkValidity?.()
      };
    });
    
    console.log('\n📋 Form State Analysis:', formState);
    
    expect(true).toBe(true); // Always pass, this is debug analysis
  }, 120000);

  test('2. Try different credential formats', async () => {
    console.log('🔄 Testing different credential formats...');
    
    // Test all variations of the credentials
    const credentialTests = [
      { email: 'manager_email1@gmail.com', password: 'demo123' },
      { email: 'manager_email1@gmail.com ', password: 'demo123' }, // with space
      { email: ' manager_email1@gmail.com', password: 'demo123' }, // with leading space
      { email: 'MANAGER_EMAIL1@GMAIL.COM', password: 'demo123' }, // uppercase
      { email: 'manager_email1@gmail.com', password: 'Demo123' }, // different case
      { email: 'manager_email1@gmail.com', password: 'demo123 ' }, // password with space
    ];
    
    for (const creds of credentialTests) {
      console.log(`\n🧪 Testing: "${creds.email}" / "${creds.password}"`);
      
      const result = await apiHelpers.login(creds.email, creds.password);
      console.log(`Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'} - ${result.error || 'OK'}`);
      
      if (result.success) {
        console.log(`User: ${result.user?.fullName || result.user?.email}`);
        console.log(`Venue: ${result.venue?.name || 'No venue'}`);
      }
      
      // Don't spam the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, 60000);

  test('3. Analyze form encoding and submission', async () => {
    console.log('📝 Analyzing form encoding...');
    
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1200, height: 800 });
    
    await page2.goto('https://admin.skan.al/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Analyze form elements in detail
    const formAnalysis = await page2.evaluate(() => {
      const form = document.querySelector('form');
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      // Get all form attributes
      const formAttributes = {};
      if (form) {
        for (let attr of form.attributes) {
          formAttributes[attr.name] = attr.value;
        }
      }
      
      // Get input attributes
      const emailAttributes = {};
      if (emailInput) {
        for (let attr of emailInput.attributes) {
          emailAttributes[attr.name] = attr.value;
        }
      }
      
      const passwordAttributes = {};
      if (passwordInput) {
        for (let attr of passwordInput.attributes) {
          passwordAttributes[attr.name] = attr.value;
        }
      }
      
      // Test FormData creation
      let formDataEntries = null;
      if (form) {
        emailInput.value = 'test@example.com';
        passwordInput.value = 'testpass';
        
        const formData = new FormData(form);
        formDataEntries = Array.from(formData.entries());
      }
      
      return {
        formExists: !!form,
        formAttributes,
        emailAttributes,
        passwordAttributes,
        formDataEntries,
        formAction: form?.action || 'no action',
        formMethod: form?.method || 'no method',
        formEnctype: form?.enctype || 'no enctype'
      };
    });
    
    console.log('📋 Detailed Form Analysis:');
    console.log(JSON.stringify(formAnalysis, null, 2));
    
    await page2.close();
  }, 60000);
});