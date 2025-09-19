const puppeteer = require('puppeteer');
const ApiHelpers = require('../utils/api-helpers');

describe('Admin Login Deep Debug', () => {
  let browser;
  let page;

  beforeAll(async () => {
    console.log('🔍 Starting Admin Login Deep Debug');
    
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000,     // Very slow to see every step
      devtools: true,   // Open dev tools
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  });

  afterAll(async () => {
    // Keep browser open for manual inspection
    console.log('⚠️ Browser kept open for manual inspection');
    console.log('✅ Admin Login Deep Debug Complete');
  });

  test('1. Step-by-step login investigation', async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Capture all network requests
    const networkLogs = [];
    page.on('response', response => {
      networkLogs.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    });
    
    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    console.log('🌐 Navigating to admin login...');
    await page.goto('https://admin.skan.al/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📝 Filling login form...');
    
    // Fill email with more explicit targeting
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.focus();
        emailInput.value = '';
        emailInput.value = 'manager_email1@gmail.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill password
    await page.evaluate(() => {
      const passwordInput = document.querySelector('input[type="password"]');
      if (passwordInput) {
        passwordInput.focus();
        passwordInput.value = '';
        passwordInput.value = 'demo123';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check form state before submit
    const preSubmitState = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      return {
        emailValue: emailInput?.value,
        passwordLength: passwordInput?.value?.length,
        submitDisabled: submitButton?.disabled,
        formValid: emailInput?.validity?.valid && passwordInput?.validity?.valid
      };
    });
    
    console.log('📋 Pre-submit state:', preSubmitState);
    
    // Take screenshot before submit
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/before-submit.png'
    });
    
    console.log('🔄 Submitting form...');
    
    // Submit with navigation waiting
    const submitPromise = page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
        return true;
      }
      return false;
    });
    
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'networkidle2', 
      timeout: 10000 
    }).catch(() => null); // Don't fail if no navigation
    
    await submitPromise;
    
    console.log('⏳ Waiting for response...');
    
    // Wait for either navigation or form response
    await Promise.race([
      navigationPromise,
      new Promise(resolve => setTimeout(resolve, 8000))
    ]);
    
    // Check final state
    const postSubmitState = await page.evaluate(() => {
      const currentUrl = window.location.href;
      const pageTitle = document.title;
      const bodyText = document.body.textContent;
      
      // Look for error messages
      const errorSelectors = [
        '.error', '.alert', '.message', '[role="alert"]',
        '.notification', '.toast', '.danger', '.warning'
      ];
      
      let errorMessages = [];
      errorSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (el.textContent.trim()) {
            errorMessages.push(el.textContent.trim());
          }
        });
      });
      
      // Check for specific error text in body
      const errorKeywords = [
        'invalid', 'incorrect', 'wrong', 'failed', 'error',
        'unauthorized', 'authentication failed', 'login failed'
      ];
      
      const bodyLower = bodyText.toLowerCase();
      const foundErrors = errorKeywords.filter(keyword => bodyLower.includes(keyword));
      
      return {
        currentUrl,
        pageTitle,
        errorMessages,
        foundErrors,
        bodyLength: bodyText.length,
        bodyPreview: bodyText.substring(0, 400)
      };
    });
    
    console.log('📊 Post-submit analysis:');
    console.log(`URL: ${postSubmitState.currentUrl}`);
    console.log(`Title: ${postSubmitState.pageTitle}`);
    console.log(`Error messages: ${postSubmitState.errorMessages.join(', ')}`);
    console.log(`Found error keywords: ${postSubmitState.foundErrors.join(', ')}`);
    console.log(`Body preview: ${postSubmitState.bodyPreview.substring(0, 150)}...`);
    
    // Take screenshot after submit
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/after-submit.png',
      fullPage: true
    });
    
    console.log('\n🌐 Network requests during login:');
    networkLogs.forEach((log, index) => {
      if (log.url.includes('admin') || log.url.includes('login') || log.url.includes('auth')) {
        console.log(`${index + 1}. ${log.status} ${log.url}`);
      }
    });
    
    console.log('\n📝 Console messages:');
    consoleMessages.forEach((msg, index) => {
      if (index < 10) {
        console.log(`${index + 1}. [${msg.type}] ${msg.text.substring(0, 100)}`);
      }
    });
    
    // Try direct dashboard access
    console.log('\n🔄 Trying direct dashboard access...');
    await page.goto('https://admin.skan.al/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    }).catch(() => console.log('Dashboard access failed'));
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardState = await page.evaluate(() => {
      return {
        currentUrl: window.location.href,
        pageTitle: document.title,
        bodyLength: document.body.textContent.length,
        bodyPreview: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('\n📊 Dashboard access result:');
    console.log(`URL: ${dashboardState.currentUrl}`);
    console.log(`Title: ${dashboardState.pageTitle}`);
    console.log(`Body preview: ${dashboardState.bodyPreview}`);
    
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/dashboard-attempt.png',
      fullPage: true
    });
    
    // Save complete debug data
    const debugData = {
      timestamp: new Date().toISOString(),
      preSubmitState,
      postSubmitState,
      dashboardState,
      networkLogs: networkLogs.filter(log => 
        log.url.includes('admin') || log.url.includes('login') || log.url.includes('auth')
      ),
      consoleMessages: consoleMessages.slice(0, 20)
    };
    
    require('fs').writeFileSync(
      '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/complete-debug.json',
      JSON.stringify(debugData, null, 2)
    );
    
    console.log('💾 Complete debug data saved to reports/complete-debug.json');
    
    // Don't close page for manual inspection
    console.log('\n🔍 Browser left open for manual inspection');
    console.log('📧 Credentials used: manager_email1@gmail.com / demo123');
    
    expect(true).toBe(true); // Always pass, this is debug analysis
  }, 300000); // 5 minute timeout
});