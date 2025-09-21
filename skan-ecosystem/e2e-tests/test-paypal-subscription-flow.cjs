const puppeteer = require('puppeteer');

async function testPayPalSubscriptionFlow() {
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
      if (request.url().includes('/api') || request.url().includes('/v1') || request.url().includes('paypal')) {
        console.log('🔍 API request:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api') || response.url().includes('/v1') || response.url().includes('paypal')) {
        console.log('📥 API response:', response.status(), response.url());
      }
    });
    
    console.log('🚀 Testing PayPal subscription flow...');
    
    // Step 1: Navigate to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    console.log('✅ Navigated to login page');
    
    // Step 2: Login with demo credentials
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.type('#email', 'manager_email1@gmail.com');
    await page.type('#password', 'admin123');
    
    console.log('✉️ Attempting login with demo credentials...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    const currentUrl = page.url();
    console.log('🌐 URL after login:', currentUrl);
    
    // Step 3: Navigate to payment settings
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully logged in to dashboard');
      
      // Look for navigation menu and click on payment settings
      try {
        // Try different selectors for payment settings
        const paymentSelectors = [
          'a[href="/payment-settings"]',
          'a[href*="payment"]',
          'nav a:contains("Payment")',
          'nav a:contains("Abonim")',
          '.nav-item:contains("Payment")',
          '.sidebar-nav a:contains("Payment")'
        ];
        
        let paymentLink = null;
        for (const selector of paymentSelectors) {
          try {
            paymentLink = await page.$(selector);
            if (paymentLink) {
              console.log(`✅ Found payment link with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (paymentLink) {
          await paymentLink.click();
          await page.waitForNavigation({ waitUntil: 'networkidle0' });
          console.log('✅ Navigated to payment settings page');
        } else {
          // Navigate directly to payment settings
          console.log('⚠️ Payment link not found, navigating directly');
          await page.goto('http://localhost:3000/payment-settings', { waitUntil: 'networkidle0' });
        }
        
      } catch (e) {
        console.log('⚠️ Error finding payment link, navigating directly:', e.message);
        await page.goto('http://localhost:3000/payment-settings', { waitUntil: 'networkidle0' });
      }
      
      // Step 4: Check PayPal integration
      console.log('🔍 Checking PayPal integration...');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check for plan selection tabs
      const planTabs = await page.$$('.plan-tab');
      console.log(`📋 Found ${planTabs.length} plan tabs`);
      
      if (planTabs.length > 0) {
        // Test monthly plan (should be selected by default)
        console.log('💰 Testing monthly plan...');
        await planTabs[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if pricing shows €35/month
        const monthlyPricing = await page.evaluate(() => {
          const priceElement = document.querySelector('.price-amount');
          const periodElement = document.querySelector('.price-period');
          return {
            price: priceElement ? priceElement.textContent : null,
            period: periodElement ? periodElement.textContent : null
          };
        });
        
        console.log('💰 Monthly pricing:', monthlyPricing);
        
        // Test annual plan if available
        if (planTabs.length > 1) {
          console.log('📅 Testing annual plan...');
          await planTabs[1].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if pricing shows €357/year
          const annualPricing = await page.evaluate(() => {
            const priceElement = document.querySelector('.price-amount');
            const periodElement = document.querySelector('.price-period');
            const savingsElement = document.querySelector('.savings-text');
            return {
              price: priceElement ? priceElement.textContent : null,
              period: periodElement ? periodElement.textContent : null,
              savings: savingsElement ? savingsElement.textContent : null
            };
          });
          
          console.log('📅 Annual pricing:', annualPricing);
        }
      }
      
      // Step 5: Check for PayPal buttons
      console.log('💳 Checking for PayPal buttons...');
      
      // Wait for PayPal SDK to load
      await page.waitForFunction(() => {
        return window.paypal !== undefined;
      }, { timeout: 15000 }).catch(() => {
        console.log('⚠️ PayPal SDK did not load within 15 seconds');
      });
      
      // Check if PayPal buttons are rendered
      const paypalButtons = await page.$('.paypal-buttons');
      const paypalContainer = await page.$('.paypal-buttons-container');
      
      if (paypalButtons || paypalContainer) {
        console.log('✅ PayPal buttons container found');
        
        // Check if actual PayPal buttons are rendered inside
        const paypalIframes = await page.$$('iframe[src*="paypal"]');
        console.log(`💳 Found ${paypalIframes.length} PayPal iframe(s)`);
        
        if (paypalIframes.length > 0) {
          console.log('✅ PayPal buttons successfully rendered');
        } else {
          console.log('⚠️ PayPal buttons container exists but no buttons rendered');
        }
      } else {
        console.log('❌ PayPal buttons container not found');
      }
      
      // Step 6: Check PayPal configuration
      const paypalConfig = await page.evaluate(() => {
        return {
          paypalLoaded: typeof window.paypal !== 'undefined',
          clientId: document.querySelector('script[src*="paypal"]')?.src || 'Not found',
          hasPaypalContainer: !!document.querySelector('.paypal-buttons-container'),
          hasTrialHighlight: !!document.querySelector('.trial-highlight'),
          trialText: document.querySelector('.trial-period')?.textContent || 'Not found'
        };
      });
      
      console.log('🔧 PayPal Configuration:', paypalConfig);
      
      // Step 7: Test plan switching functionality
      if (planTabs.length > 1) {
        console.log('🔄 Testing plan switching...');
        
        // Switch to monthly
        await planTabs[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const monthlyState = await page.evaluate(() => {
          const activeTab = document.querySelector('.plan-tab.active');
          const buttonText = document.querySelector('.paypal-info h3')?.textContent;
          return {
            activeTab: activeTab?.textContent || 'None',
            buttonText: buttonText || 'Not found'
          };
        });
        
        console.log('📝 Monthly state:', monthlyState);
        
        // Switch to annual
        await planTabs[1].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const annualState = await page.evaluate(() => {
          const activeTab = document.querySelector('.plan-tab.active');
          const buttonText = document.querySelector('.paypal-info h3')?.textContent;
          const savings = document.querySelector('.price-savings')?.textContent;
          return {
            activeTab: activeTab?.textContent || 'None',
            buttonText: buttonText || 'Not found',
            savings: savings || 'Not shown'
          };
        });
        
        console.log('📝 Annual state:', annualState);
      }
      
    } else if (currentUrl.includes('/onboarding')) {
      console.log('⚠️ Redirected to onboarding, but we can test PayPal components');
      // Could potentially test PayPal components in onboarding context
    } else {
      console.log('❌ Login failed - still on:', currentUrl);
      
      // Check for error messages
      const errorMsg = await page.$eval('.error-message', el => el.textContent).catch(() => 'No error message found');
      console.log('❌ Login error:', errorMsg);
    }
    
    console.log('✅ PayPal subscription flow test completed');
    
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

testPayPalSubscriptionFlow();