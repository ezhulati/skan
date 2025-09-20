// Use dynamic import for puppeteer since it's available globally
const { default: puppeteer } = await import('puppeteer');

async function testRestaurantDemoFlow() {
  console.log('🎭 SKAN.AL Restaurant Demo - Full Puppeteer Test');
  console.log('=============================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    slowMo: 50 // Slow down for visibility
  });
  
  try {
    const page = await browser.newPage();
    
    // Step 1: Start from Homepage
    console.log('🏠 Step 1: Testing Homepage');
    await page.goto('https://skan.al', { waitUntil: 'networkidle2' });
    
    // Check for demo buttons on homepage
    const homepageDemo = await page.evaluate(() => {
      const demoButtons = Array.from(document.querySelectorAll('a')).filter(link => 
        link.textContent.toLowerCase().includes('demo') || 
        link.href.includes('demo')
      );
      return {
        hasDemoButtons: demoButtons.length > 0,
        demoButtonTexts: demoButtons.map(btn => btn.textContent.trim()),
        demoButtonLinks: demoButtons.map(btn => btn.href)
      };
    });
    
    console.log('✅ Homepage demo buttons:', homepageDemo);
    await page.waitForTimeout(2000);
    
    // Step 2: Navigate to Demo Request Page
    console.log('\n🔍 Step 2: Testing Demo Request Flow');
    await page.goto('https://admin.skan.al/demo-request', { waitUntil: 'networkidle2' });
    
    // Wait for React to load
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Check if demo credentials are displayed
    const demoCredentials = await page.evaluate(() => {
      const emailElement = document.querySelector('div[style*="monospace"]');
      const passwordElements = document.querySelectorAll('div[style*="monospace"]');
      return {
        hasCredentials: emailElement !== null,
        email: emailElement ? emailElement.textContent.trim() : null,
        password: passwordElements.length > 1 ? passwordElements[1].textContent.trim() : null,
        hasAutoLoginButton: document.querySelector('button') !== null
      };
    });
    
    console.log('✅ Demo credentials found:', demoCredentials);
    
    // Step 3: Test Auto-Login Button
    console.log('\n🚀 Step 3: Testing Auto-Login to Restaurant Dashboard');
    
    // Click the auto-login button
    const loginButton = await page.waitForSelector('button:contains("Hyr në Demo"), button:contains("Enter Demo")');
    await loginButton.click();
    
    // Wait for navigation or error
    await Promise.race([
      page.waitForNavigation({ timeout: 10000 }),
      page.waitForTimeout(5000)
    ]);
    
    // Check if we're in the dashboard
    const dashboardStatus = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasOrders: document.body.textContent.includes('Order') || 
                   document.body.textContent.includes('Porosi'),
        hasBeachBar: document.body.textContent.includes('Beach Bar') ||
                     document.body.textContent.includes('beach-bar'),
        isLoggedIn: !document.body.textContent.includes('Login') &&
                    !document.body.textContent.includes('Hyr në')
      };
    });
    
    console.log('✅ Dashboard status:', dashboardStatus);
    await page.waitForTimeout(3000);
    
    // Step 4: Test Customer Ordering Experience
    console.log('\n🍽️ Step 4: Testing Customer Ordering Experience');
    await page.goto('https://order.skan.al/beach-bar-durres/a1', { waitUntil: 'networkidle2' });
    
    // Wait for React app to load
    await page.waitForTimeout(3000);
    
    const customerApp = await page.evaluate(() => {
      return {
        hasContent: document.body.innerHTML.length > 1000,
        hasBeachBar: document.body.textContent.includes('Beach Bar'),
        hasMenu: document.body.textContent.includes('Menu') || 
                 document.body.textContent.includes('menu'),
        hasItems: document.body.textContent.includes('Beer') ||
                  document.body.textContent.includes('Albanian'),
        hasTableInfo: document.body.textContent.includes('A1') ||
                      document.body.textContent.includes('Table'),
        isReactApp: document.querySelector('#root') !== null,
        url: window.location.href
      };
    });
    
    console.log('✅ Customer app status:', customerApp);
    
    // Step 5: Try to Navigate to Menu
    console.log('\n📱 Step 5: Testing Menu Navigation');
    
    // Look for menu button or auto-redirect
    try {
      await page.waitForTimeout(2000);
      
      // Check if we can find menu items
      const menuItems = await page.evaluate(() => {
        const items = [];
        // Look for common menu item indicators
        const menuElements = document.querySelectorAll('*');
        for (let element of menuElements) {
          const text = element.textContent || '';
          if (text.includes('Albanian Beer') || 
              text.includes('Greek Salad') || 
              text.includes('€') ||
              text.includes('Lek')) {
            items.push(text.trim().substring(0, 50));
          }
        }
        return {
          foundItems: items.slice(0, 5), // First 5 items
          hasMenuItems: items.length > 0,
          hasAlbanianBeer: document.body.textContent.includes('Albanian Beer'),
          hasPricing: document.body.textContent.includes('€') || 
                      document.body.textContent.includes('Lek')
        };
      });
      
      console.log('✅ Menu items found:', menuItems);
      
    } catch (error) {
      console.log('⚠️ Menu navigation issue:', error.message);
    }
    
    // Step 6: Test API Connectivity
    console.log('\n🔌 Step 6: Testing API Connectivity');
    
    const apiTests = await page.evaluate(async () => {
      try {
        // Test menu API
        const menuResponse = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/menu');
        const menuData = await menuResponse.json();
        
        return {
          menuApiWorking: menuResponse.ok,
          hasVenue: !!menuData.venue,
          hasCategories: !!(menuData.categories && menuData.categories.length > 0),
          venueName: menuData.venue ? menuData.venue.name : null,
          categoryCount: menuData.categories ? menuData.categories.length : 0
        };
      } catch (error) {
        return {
          menuApiWorking: false,
          error: error.message
        };
      }
    });
    
    console.log('✅ API connectivity:', apiTests);
    
    // Summary Report
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('=============================');
    
    const overallStatus = {
      homepage: homepageDemo.hasDemoButtons,
      demoRequest: demoCredentials.hasCredentials,
      autoLogin: dashboardStatus.isLoggedIn,
      customerApp: customerApp.hasContent && customerApp.isReactApp,
      menuData: apiTests.menuApiWorking,
      beachBarIntegration: customerApp.hasBeachBar && apiTests.hasVenue
    };
    
    console.log('✅ Homepage Demo Buttons:', overallStatus.homepage ? 'WORKING' : 'ISSUES');
    console.log('✅ Demo Request Page:', overallStatus.demoRequest ? 'WORKING' : 'ISSUES');
    console.log('✅ Auto-Login Functionality:', overallStatus.autoLogin ? 'WORKING' : 'ISSUES');
    console.log('✅ Customer Ordering App:', overallStatus.customerApp ? 'WORKING' : 'ISSUES');
    console.log('✅ Menu API Integration:', overallStatus.menuData ? 'WORKING' : 'ISSUES');
    console.log('✅ Beach Bar Integration:', overallStatus.beachBarIntegration ? 'WORKING' : 'ISSUES');
    
    const successCount = Object.values(overallStatus).filter(Boolean).length;
    const totalTests = Object.keys(overallStatus).length;
    
    console.log(`\n🎯 Overall Score: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
      console.log('🎉 COMPLETE SUCCESS - All demo components working perfectly!');
    } else if (successCount >= totalTests * 0.8) {
      console.log('⚠️ MOSTLY WORKING - Minor issues detected');
    } else {
      console.log('🚨 SIGNIFICANT ISSUES - Multiple components need attention');
    }
    
    console.log('\n🔗 Key URLs Tested:');
    console.log('- Homepage: https://skan.al');
    console.log('- Demo Request: https://admin.skan.al/demo-request');
    console.log('- Customer App: https://order.skan.al/beach-bar-durres/a1');
    console.log('- API Endpoint: https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/menu');
    
    // Keep browser open for manual inspection
    console.log('\n👀 Browser kept open for manual inspection...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRestaurantDemoFlow().catch(console.error);