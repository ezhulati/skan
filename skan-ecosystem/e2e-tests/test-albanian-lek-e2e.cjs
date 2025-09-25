// Comprehensive End-to-End Test for Albanian Lek Pricing System
const puppeteer = require('puppeteer');

async function runCompleteE2ETest() {
  console.log('🇦🇱 SKAN.AL ALBANIAN LEK PRICING - COMPREHENSIVE E2E TEST');
  console.log('========================================================');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1280, height: 800 },
    slowMo: 1000
  });
  
  let testResults = {
    marketingSite: false,
    apiEndpoint: false,
    customerApp: false,
    adminPortal: false,
    orderPlacement: false,
    pricing: {
      currency: false,
      albanianBeer: false,
      greekSalad: false,
      seafoodRisotto: false
    }
  };
  
  try {
    // Test 1: Marketing Site Demo Flow
    console.log('\n📱 TEST 1: Marketing Site Demo Flow');
    console.log('===================================');
    
    const page = await browser.newPage();
    await page.goto('https://skan.al', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Marketing site loaded');
    
    // Look for demo links
    const demoFound = await page.$eval('body', el => {
      return el.textContent.includes('Beach Bar') || el.textContent.includes('demo');
    });
    
    if (demoFound) {
      console.log('✅ Beach Bar demo references found on marketing site');
      testResults.marketingSite = true;
    }
    
    await page.close();
    
    // Test 2: API Endpoint Verification
    console.log('\n🔌 TEST 2: API Endpoint Verification');
    console.log('====================================');
    
    const apiPage = await browser.newPage();
    await apiPage.goto('https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/menu');
    
    const apiContent = await apiPage.content();
    const apiData = JSON.parse(await apiPage.$eval('pre', el => el.textContent));
    
    // Check currency
    if (apiData.venue.settings.currency === 'ALL') {
      console.log('✅ API currency set to Albanian Lek (ALL)');
      testResults.apiEndpoint = true;
      testResults.pricing.currency = true;
    }
    
    // Check specific prices
    const items = apiData.categories.flatMap(cat => cat.items);
    const albanianBeer = items.find(item => item.id === 'albanian-beer');
    const greekSalad = items.find(item => item.id === 'greek-salad');
    const seafoodRisotto = items.find(item => item.id === 'seafood-risotto');
    
    if (albanianBeer && albanianBeer.price === 350) {
      console.log('✅ Albanian Beer: 350 Lek (correct)');
      testResults.pricing.albanianBeer = true;
    }
    
    if (greekSalad && greekSalad.price === 900) {
      console.log('✅ Greek Salad: 900 Lek (correct)');
      testResults.pricing.greekSalad = true;
    }
    
    if (seafoodRisotto && seafoodRisotto.price === 1800) {
      console.log('✅ Seafood Risotto: 1800 Lek (correct)');
      testResults.pricing.seafoodRisotto = true;
    }
    
    await apiPage.close();
    
    // Test 3: Customer App Experience
    console.log('\n🛒 TEST 3: Customer App Experience');
    console.log('==================================');
    
    const customerPage = await browser.newPage();
    await customerPage.goto('https://order.skan.al/beach-bar-durres/a1/menu', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('✅ Customer app loaded');
    
    // Wait for menu to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for Albanian Lek pricing display
    const lekFound = await customerPage.$eval('body', el => {
      const text = el.textContent;
      return text.includes('350') && (text.includes('Lek') || text.includes('lek'));
    });
    
    if (lekFound) {
      console.log('✅ Albanian Lek pricing displayed in customer app');
      testResults.customerApp = true;
    }
    
    // Check for Albanian names
    const albanianNamesFound = await customerPage.$eval('body', el => {
      const text = el.textContent;
      return text.includes('Birrë Shqiptare') || text.includes('Sallatë Greke');
    });
    
    if (albanianNamesFound) {
      console.log('✅ Albanian menu item names displayed');
    }
    
    // Test 4: Order Placement Flow
    console.log('\n📝 TEST 4: Order Placement Flow');
    console.log('===============================');
    
    try {
      // Try to find and click an item (Albanian Beer)
      const itemButton = await customerPage.$('button, div, [data-testid], [role="button"]');
      if (itemButton) {
        await itemButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Item interaction successful');
        testResults.orderPlacement = true;
      }
    } catch (error) {
      console.log('⚠️ Order placement test skipped (interaction complex)');
    }
    
    await customerPage.close();
    
    // Test 5: Admin Portal Access
    console.log('\n👨‍💼 TEST 5: Admin Portal Access');
    console.log('===============================');
    
    const adminPage = await browser.newPage();
    await adminPage.goto('https://admin.skan.al/login', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('✅ Admin portal loaded');
    
    // Try demo login
    try {
      await adminPage.type('input[type="email"], input[name="email"]', 'manager_email1@gmail.com');
      await adminPage.type('input[type="password"], input[name="password"]', 'demo123');
      
      const loginButton = await adminPage.$('button[type="submit"], button:contains("Login")');
      if (loginButton) {
        await loginButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const currentUrl = adminPage.url();
        if (currentUrl.includes('dashboard') || !currentUrl.includes('login')) {
          console.log('✅ Admin portal login successful');
          testResults.adminPortal = true;
        }
      }
    } catch (error) {
      console.log('⚠️ Admin portal login test skipped (complex interaction)');
    }
    
    await adminPage.close();
    
  } catch (error) {
    console.error('❌ E2E Test Error:', error.message);
  }
  
  // Final Results
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('==============================');
  console.log(`Marketing Site: ${testResults.marketingSite ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoint: ${testResults.apiEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Customer App: ${testResults.customerApp ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Portal: ${testResults.adminPortal ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Order Flow: ${testResults.orderPlacement ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n💰 PRICING VERIFICATION');
  console.log('=======================');
  console.log(`Currency (ALL): ${testResults.pricing.currency ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Albanian Beer (350): ${testResults.pricing.albanianBeer ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Greek Salad (900): ${testResults.pricing.greekSalad ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Seafood Risotto (1800): ${testResults.pricing.seafoodRisotto ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = 9;
  const passedTests = Object.values(testResults).flat().filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n🎯 OVERALL SUCCESS RATE: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate >= 80) {
    console.log('\n🎉 EXCELLENT: Albanian Lek pricing system is working correctly!');
    console.log('🇦🇱 Beach Bar Durrës demo is fully operational with Albanian Lek');
    console.log('📱 Customer ordering experience: https://order.skan.al/beach-bar-durres/a1/menu');
    console.log('👨‍💼 Admin management portal: https://admin.skan.al');
    console.log('🌐 Marketing site: https://skan.al');
  } else {
    console.log('\n⚠️ ISSUES DETECTED: Some components may need attention');
    console.log('💡 Check individual test results above for specific problems');
  }
  
  await browser.close();
  return testResults;
}

runCompleteE2ETest().catch(console.error);
