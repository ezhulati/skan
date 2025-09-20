const puppeteer = require('puppeteer');

async function testCompleteRestaurantDemoLogin() {
  console.log('🔑 SKAN.AL Complete Demo Login Test');
  console.log('====================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    slowMo: 100 // Slow down for visibility
  });
  
  let page;
  
  try {
    page = await browser.newPage();
    
    // Step 1: Navigate to Demo Request Page
    console.log('🚀 Step 1: Navigating to Demo Request Page');
    await page.goto('https://admin.skan.al/demo-request', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for React to load
    await page.waitForTimeout(3000);
    
    // Check if demo credentials are displayed
    const credentialsInfo = await page.evaluate(() => {
      const credentialBoxes = document.querySelectorAll('div[style*="monospace"]');
      return {
        found: credentialBoxes.length >= 2,
        email: credentialBoxes[0] ? credentialBoxes[0].textContent.trim() : null,
        password: credentialBoxes[1] ? credentialBoxes[1].textContent.trim() : null,
        hasAutoLoginButton: !!document.querySelector('button')
      };
    });
    
    console.log('✅ Demo credentials displayed:', credentialsInfo);
    
    if (!credentialsInfo.found) {
      throw new Error('Demo credentials not found on page');
    }
    
    // Step 2: Test Auto-Login Button
    console.log('\n🎯 Step 2: Testing Auto-Login Button');
    
    // Find and click the auto-login button
    const loginButton = await page.waitForSelector('button', { timeout: 10000 });
    console.log('📱 Found login button, clicking...');
    
    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await loginButton.click();
    console.log('🔄 Button clicked, waiting for navigation...');
    
    // Wait for navigation to complete
    try {
      await navigationPromise;
      console.log('✅ Navigation completed');
    } catch (error) {
      console.log('⚠️ Navigation timeout, checking current state...');
    }
    
    await page.waitForTimeout(3000);
    
    // Step 3: Verify Dashboard Access
    console.log('\n📊 Step 3: Verifying Dashboard Access');
    
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);
    
    const dashboardStatus = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        pathname: window.location.pathname,
        hasOrders: document.body.textContent.includes('Orders') || 
                   document.body.textContent.includes('Porosi') ||
                   document.body.textContent.includes('Order'),
        hasBeachBar: document.body.textContent.includes('Beach Bar') ||
                     document.body.textContent.includes('beach-bar') ||
                     document.body.textContent.includes('Durrës'),
        hasDashboard: document.body.textContent.includes('Dashboard') ||
                      window.location.pathname.includes('dashboard'),
        hasLoginError: document.body.textContent.includes('Invalid') ||
                       document.body.textContent.includes('Error') ||
                       document.body.textContent.includes('Failed'),
        isLoggedIn: !document.body.textContent.includes('Login') &&
                    !document.body.textContent.includes('Sign in') &&
                    window.location.pathname !== '/login',
        pageContent: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('📋 Dashboard status:', dashboardStatus);
    
    // Step 4: Test Beach Bar Orders Access
    console.log('\n🏖️ Step 4: Testing Beach Bar Orders Access');
    
    if (dashboardStatus.isLoggedIn) {
      try {
        // Try to navigate to orders or find order elements
        const orderElements = await page.evaluate(() => {
          // Look for order-related elements
          const orderIndicators = [];
          const allElements = document.querySelectorAll('*');
          
          for (let element of allElements) {
            const text = element.textContent || '';
            if (text.includes('SKN-') || 
                text.includes('Albanian Beer') || 
                text.includes('Greek Salad') ||
                text.includes('beach-bar-durres')) {
              orderIndicators.push(text.trim().substring(0, 100));
            }
          }
          
          return {
            foundOrderData: orderIndicators.length > 0,
            orderSamples: orderIndicators.slice(0, 3),
            hasTableNumbers: document.body.textContent.includes('Table') ||
                            document.body.textContent.includes('T0'),
            hasOrderNumbers: document.body.textContent.includes('SKN-')
          };
        });
        
        console.log('📦 Order data found:', orderElements);
        
      } catch (error) {
        console.log('⚠️ Error checking orders:', error.message);
      }
    }
    
    // Step 5: Test Manual Login (if auto-login failed)
    if (!dashboardStatus.isLoggedIn && currentUrl.includes('demo-request')) {
      console.log('\n🔄 Step 5: Testing Manual Login Flow');
      
      // Try manual login with displayed credentials
      try {
        // Switch to manual login mode
        const manualLoginButton = await page.$('button:contains("Kam Kredenciale")');
        if (manualLoginButton) {
          await manualLoginButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Fill in credentials
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        
        if (emailInput && passwordInput) {
          await emailInput.type('demo.beachbar@skan.al');
          await passwordInput.type('BeachBarDemo2024!');
          
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(3000);
            
            const manualLoginResult = await page.evaluate(() => ({
              url: window.location.href,
              isLoggedIn: !document.body.textContent.includes('Login')
            }));
            
            console.log('🔐 Manual login result:', manualLoginResult);
          }
        }
      } catch (error) {
        console.log('⚠️ Manual login failed:', error.message);
      }
    }
    
    // Final Summary
    console.log('\n📊 COMPLETE DEMO LOGIN TEST SUMMARY');
    console.log('===================================');
    
    const finalStatus = await page.evaluate(() => ({
      currentUrl: window.location.href,
      isInDashboard: window.location.pathname.includes('dashboard') || 
                     !window.location.pathname.includes('demo-request'),
      hasBeachBarContent: document.body.textContent.includes('Beach Bar') ||
                          document.body.textContent.includes('beach-bar'),
      canAccessOrders: document.body.textContent.includes('Order') ||
                       document.body.textContent.includes('SKN-'),
      loginSuccessful: !document.body.textContent.includes('Login') &&
                       !window.location.pathname.includes('login')
    }));
    
    console.log('🎯 Final Status:', finalStatus);
    
    if (finalStatus.loginSuccessful && finalStatus.hasBeachBarContent) {
      console.log('🎉 SUCCESS: Complete demo login flow working!');
      console.log('✅ User can access Beach Bar Durrës dashboard');
      console.log('✅ Credentials are correct and functional');
    } else if (finalStatus.loginSuccessful) {
      console.log('⚠️ PARTIAL SUCCESS: Login works but wrong venue');
      console.log('❌ User not accessing Beach Bar Durrës specifically');
    } else {
      console.log('❌ FAILURE: Login flow not working');
      console.log('🔧 Credentials or auto-login functionality needs fixing');
    }
    
    // Keep browser open for inspection
    console.log('\n👀 Keeping browser open for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    if (page) {
      await browser.close();
    }
  }
}

// Run the test
testCompleteRestaurantDemoLogin().catch(console.error);