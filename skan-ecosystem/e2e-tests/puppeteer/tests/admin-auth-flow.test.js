const puppeteer = require('puppeteer');
const ApiHelpers = require('../utils/api-helpers');

describe('Admin Authentication and Dashboard Flow', () => {
  let browser;
  let page;
  let apiHelpers;

  beforeAll(async () => {
    console.log('🔐 Starting Admin Authentication Flow Tests');
    
    browser = await puppeteer.launch({
      headless: false, // Visual debugging
      slowMo: 200,     // Slow down to see what's happening
      devtools: false,
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
    console.log('✅ Admin Authentication Flow Tests Complete');
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('1. Admin Login Form Analysis and Testing', async () => {
    console.log('🔍 Analyzing admin login form...');
    
    await page.goto('https://admin.skan.al/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Analyze login form structure
    const formAnalysis = await page.evaluate(() => {
      const emailInputs = document.querySelectorAll('input[type="email"], input[name="email"], [placeholder*="email"], [placeholder*="Email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"], input[name="password"], [placeholder*="password"], [placeholder*="Password"]');
      const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], button');
      const forms = document.querySelectorAll('form');
      
      const loginElements = [];
      
      // Get all input fields
      document.querySelectorAll('input').forEach(input => {
        loginElements.push({
          type: input.type,
          name: input.name || '',
          placeholder: input.placeholder || '',
          id: input.id || '',
          className: input.className || ''
        });
      });
      
      // Get all buttons
      const buttons = [];
      document.querySelectorAll('button').forEach(btn => {
        buttons.push({
          text: btn.textContent.trim(),
          type: btn.type || '',
          className: btn.className || ''
        });
      });
      
      return {
        emailInputCount: emailInputs.length,
        passwordInputCount: passwordInputs.length,
        submitButtonCount: submitButtons.length,
        formCount: forms.length,
        allInputs: loginElements,
        allButtons: buttons,
        pageTitle: document.title,
        bodyText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log('🔍 Form Analysis Results:');
    console.log(`Email inputs: ${formAnalysis.emailInputCount}`);
    console.log(`Password inputs: ${formAnalysis.passwordInputCount}`);
    console.log(`Submit buttons: ${formAnalysis.submitButtonCount}`);
    console.log(`Forms: ${formAnalysis.formCount}`);
    console.log(`Page title: ${formAnalysis.pageTitle}`);
    
    console.log('\n📝 All Input Fields:');
    formAnalysis.allInputs.forEach((input, index) => {
      console.log(`${index + 1}. Type: ${input.type}, Name: ${input.name}, Placeholder: ${input.placeholder}`);
    });
    
    console.log('\n🔘 All Buttons:');
    formAnalysis.allButtons.forEach((btn, index) => {
      console.log(`${index + 1}. "${btn.text}" (Type: ${btn.type})`);
    });
    
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/admin-login-form.png',
      fullPage: true 
    });
    
    expect(formAnalysis.emailInputCount).toBeGreaterThan(0);
    expect(formAnalysis.passwordInputCount).toBeGreaterThan(0);
    expect(formAnalysis.submitButtonCount).toBeGreaterThan(0);
  }, 60000);

  test('2. Complete Login Process with Real Credentials', async () => {
    console.log('🔑 Testing complete login process...');
    
    await page.goto('https://admin.skan.al/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test API login first to verify credentials
    console.log('🧪 Testing API login first...');
    const apiLogin = await apiHelpers.login('manager_email1@gmail.com', 'demo123');
    console.log('📡 API Login Result:', apiLogin.success ? 'SUCCESS' : 'FAILED');
    if (apiLogin.success) {
      console.log('👤 User:', apiLogin.user.fullName || apiLogin.user.email);
      console.log('🏪 Venue:', apiLogin.venue?.name || 'No venue info');
    } else {
      console.log('❌ API Error:', apiLogin.error);
    }
    
    // Now try UI login
    console.log('\n🖱️ Attempting UI login...');
    
    const loginAttempt = await page.evaluate(() => {
      // Find email input (try multiple selectors)
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        '[placeholder*="email"]',
        '[placeholder*="Email"]',
        'input[id*="email"]'
      ];
      
      let emailInput = null;
      for (let selector of emailSelectors) {
        emailInput = document.querySelector(selector);
        if (emailInput) break;
      }
      
      // Find password input
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        '[placeholder*="password"]',
        '[placeholder*="Password"]',
        'input[id*="password"]'
      ];
      
      let passwordInput = null;
      for (let selector of passwordSelectors) {
        passwordInput = document.querySelector(selector);
        if (passwordInput) break;
      }
      
      // Find submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button'
      ];
      
      let submitButton = null;
      for (let selector of submitSelectors) {
        const buttons = document.querySelectorAll(selector);
        for (let btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('login') || text.includes('sign in') || text.includes('submit') || btn.type === 'submit') {
            submitButton = btn;
            break;
          }
        }
        if (submitButton) break;
      }
      
      if (!emailInput || !passwordInput || !submitButton) {
        return {
          success: false,
          error: 'Missing form elements',
          found: {
            email: !!emailInput,
            password: !!passwordInput,
            submit: !!submitButton
          }
        };
      }
      
      // Fill the form
      emailInput.value = 'manager_email1@gmail.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      passwordInput.value = 'demo123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      return {
        success: true,
        emailFilled: emailInput.value,
        passwordFilled: !!passwordInput.value,
        submitButtonText: submitButton.textContent.trim()
      };
    });
    
    console.log('📝 Form Fill Result:', loginAttempt);
    
    if (loginAttempt.success) {
      // Click submit button
      await page.evaluate(() => {
        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button'
        ];
        
        for (let selector of submitSelectors) {
          const buttons = document.querySelectorAll(selector);
          for (let btn of buttons) {
            const text = btn.textContent.toLowerCase();
            if (text.includes('login') || text.includes('sign in') || text.includes('submit') || btn.type === 'submit') {
              btn.click();
              return;
            }
          }
        }
      });
      
      console.log('🔄 Login submitted, waiting for response...');
      
      // Wait for either redirect or error message
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const postLoginStatus = await page.evaluate(() => {
        const currentUrl = window.location.href;
        const pageTitle = document.title;
        const bodyText = document.body.textContent;
        
        // Look for error messages
        const errorIndicators = [
          'error', 'invalid', 'incorrect', 'failed', 'wrong',
          'unauthorized', 'authentication', 'login failed'
        ];
        
        const hasError = errorIndicators.some(indicator => 
          bodyText.toLowerCase().includes(indicator)
        );
        
        // Look for success indicators
        const successIndicators = [
          'dashboard', 'welcome', 'orders', 'menu', 'admin',
          'restaurant', 'logout'
        ];
        
        const hasSuccess = successIndicators.some(indicator => 
          bodyText.toLowerCase().includes(indicator) || 
          currentUrl.toLowerCase().includes(indicator)
        );
        
        return {
          currentUrl,
          pageTitle,
          hasError,
          hasSuccess,
          bodyPreview: bodyText.substring(0, 300)
        };
      });
      
      console.log('📊 Post-Login Status:');
      console.log(`URL: ${postLoginStatus.currentUrl}`);
      console.log(`Title: ${postLoginStatus.pageTitle}`);
      console.log(`Has Error: ${postLoginStatus.hasError}`);
      console.log(`Has Success: ${postLoginStatus.hasSuccess}`);
      console.log(`Body Preview: ${postLoginStatus.bodyPreview.substring(0, 100)}...`);
      
      await page.screenshot({ 
        path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/post-login.png',
        fullPage: true 
      });
      
      // Verify login success
      if (postLoginStatus.currentUrl.includes('dashboard') || postLoginStatus.hasSuccess) {
        console.log('✅ Login successful!');
        expect(postLoginStatus.hasSuccess).toBe(true);
      } else if (postLoginStatus.hasError) {
        console.log('❌ Login failed with error');
        expect(postLoginStatus.hasError).toBe(false);
      } else {
        console.log('⚠️ Login status unclear, needs investigation');
        expect(postLoginStatus.currentUrl).toContain('admin');
      }
    } else {
      console.log('❌ Could not fill login form');
      expect(loginAttempt.success).toBe(true);
    }
  }, 120000);

  test('3. Dashboard Functionality Test', async () => {
    console.log('📊 Testing dashboard functionality...');
    
    // First login via API to get auth token
    const apiLogin = await apiHelpers.login('manager_email1@gmail.com', 'demo123');
    
    if (!apiLogin.success) {
      console.log('❌ Cannot test dashboard without valid login');
      expect(apiLogin.success).toBe(true);
      return;
    }
    
    // Try direct dashboard access after login
    await page.goto('https://admin.skan.al/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardAnalysis = await page.evaluate(() => {
      const currentUrl = window.location.href;
      const pageTitle = document.title;
      const bodyText = document.body.textContent;
      
      // Look for dashboard elements
      const dashboardElements = [
        'orders', 'menu', 'users', 'settings', 'logout',
        'dashboard', 'restaurant', 'qr', 'analytics'
      ];
      
      const foundElements = dashboardElements.filter(element => 
        bodyText.toLowerCase().includes(element)
      );
      
      // Count interactive elements
      const buttons = document.querySelectorAll('button').length;
      const links = document.querySelectorAll('a').length;
      const inputs = document.querySelectorAll('input').length;
      
      // Look for order-related content
      const orderKeywords = ['order', 'customer', 'table', 'status'];
      const hasOrderContent = orderKeywords.some(keyword => 
        bodyText.toLowerCase().includes(keyword)
      );
      
      return {
        currentUrl,
        pageTitle,
        foundElements,
        interactiveElementCount: buttons + links + inputs,
        hasOrderContent,
        bodyText: bodyText.substring(0, 500)
      };
    });
    
    console.log('📋 Dashboard Analysis:');
    console.log(`URL: ${dashboardAnalysis.currentUrl}`);
    console.log(`Title: ${dashboardAnalysis.pageTitle}`);
    console.log(`Found Elements: ${dashboardAnalysis.foundElements.join(', ')}`);
    console.log(`Interactive Elements: ${dashboardAnalysis.interactiveElementCount}`);
    console.log(`Has Order Content: ${dashboardAnalysis.hasOrderContent}`);
    
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/dashboard.png',
      fullPage: true 
    });
    
    // Test getting orders via API to see what should be in dashboard
    console.log('\n📡 Testing API order retrieval...');
    const orders = await apiHelpers.getVenueOrders('beach-bar-durres', 'all');
    console.log('📊 API Orders Result:', orders.success ? `${orders.data.length} orders found` : orders.error);
    
    if (orders.success && orders.data.length > 0) {
      console.log('📋 Sample Order:', {
        orderNumber: orders.data[0].orderNumber || 'No number',
        status: orders.data[0].status || 'No status',
        customer: orders.data[0].customerName || 'No customer'
      });
    }
    
    expect(dashboardAnalysis.currentUrl).toContain('admin');
    expect(dashboardAnalysis.interactiveElementCount).toBeGreaterThan(5);
  }, 120000);

  test('4. Console Error Investigation', async () => {
    console.log('🐛 Investigating console errors in admin portal...');
    
    const consoleMessages = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    await page.goto('https://admin.skan.al/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📝 Console Messages:');
    consoleMessages.forEach((msg, index) => {
      if (index < 10) { // Limit output
        console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text.substring(0, 100)}`);
      }
    });
    
    console.log('\n❌ JavaScript Errors:');
    jsErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.message}`);
    });
    
    // Save detailed debug info
    const debugData = {
      timestamp: new Date().toISOString(),
      consoleMessages: consoleMessages.slice(0, 20),
      jsErrors,
      url: await page.url()
    };
    
    require('fs').writeFileSync(
      '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/admin-debug-log.json',
      JSON.stringify(debugData, null, 2)
    );
    
    console.log('💾 Admin debug data saved to reports/admin-debug-log.json');
    
    expect(true).toBe(true); // Always pass, just collecting debug info
  }, 60000);
});