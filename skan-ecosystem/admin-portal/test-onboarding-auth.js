const puppeteer = require('puppeteer');
const fs = require('fs');

// Complete Onboarding Flow Testing with Authentication
async function testOnboardingWithAuth() {
  console.log('🚀 Starting Authenticated Onboarding Flow Test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0, total: 0 }
  };

  // Helper function to add test result
  function addTestResult(testName, passed, details = '') {
    const result = { testName, passed, details, timestamp: new Date().toISOString() };
    testResults.tests.push(result);
    testResults.summary.total++;
    if (passed) {
      testResults.summary.passed++;
      console.log(`✅ ${testName}`);
    } else {
      testResults.summary.failed++;
      console.log(`❌ ${testName} - ${details}`);
    }
  }

  try {
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log(`🔍 PAGE LOG: ${msg.text()}`);
      } else if (msg.type() === 'error') {
        console.log(`🚨 PAGE ERROR: ${msg.text()}`);
      }
    });

    // Test 1: Navigate to login page
    console.log('\n📋 TEST 1: Login Process');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 30000 });
    
    const loginPageTitle = await page.title();
    addTestResult('Login page loaded', loginPageTitle.includes('SKAN') || loginPageTitle.includes('Restaurant'), `Page title: ${loginPageTitle}`);

    // Test 2: Perform login
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    const loginButton = await page.waitForSelector('button[type="submit"]', { timeout: 10000 });

    addTestResult('Login form elements exist', emailInput && passwordInput && loginButton);

    // Fill login form
    await page.type('input[type="email"]', 'manager_email1@gmail.com');
    await page.type('input[type="password"]', 'demo123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    addTestResult('Login successful', currentUrl.includes('dashboard') || currentUrl.includes('onboarding'), `Current URL: ${currentUrl}`);

    // Test 3: Navigate to onboarding (force it)
    console.log('\n📋 TEST 2: Force Navigate to Onboarding');
    await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Check if onboarding wizard loads
    console.log('\n📋 TEST 3: Onboarding Wizard Loading');
    try {
      await page.waitForSelector('.onboarding-wizard', { timeout: 10000 });
      addTestResult('Onboarding wizard element exists', true);
    } catch (error) {
      addTestResult('Onboarding wizard element exists', false, `Error: ${error.message}`);
    }

    // Test 5: Check onboarding content
    try {
      await page.waitForSelector('.onboarding-content', { timeout: 10000 });
      addTestResult('Onboarding content loaded', true);
    } catch (error) {
      addTestResult('Onboarding content loaded', false, `Error: ${error.message}`);
    }

    // Test 6: Check Step 1 Albanian content
    console.log('\n📋 TEST 4: Step 1 - Restaurant Information Form');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for loading
    
    const step1Title = await page.$eval('h2', el => el.textContent).catch(() => '');
    addTestResult('Step 1 title in Albanian', step1Title.includes('Mirë se vini'), `Title: ${step1Title}`);

    const restaurantNameField = await page.$('input[placeholder*="Taverna"]');
    addTestResult('Restaurant name field exists', restaurantNameField !== null);

    const addressField = await page.$('input[placeholder*="Rruga"]');
    addTestResult('Address field exists', addressField !== null);

    const phoneField = await page.$('input[placeholder*="+355"]');
    addTestResult('Phone field exists', phoneField !== null);

    const cuisineSelect = await page.$('select');
    addTestResult('Cuisine select exists', cuisineSelect !== null);

    // Test 7: Fill out Step 1 form with test data
    console.log('\n📋 TEST 5: Step 1 Form Input Testing');
    
    const testData = {
      name: 'Test Restaurant E2E',
      address: 'Test Address 123, Tirana',
      phone: '+355 67 123 4567',
      cuisine: 'mediterranean',
      description: 'This is a comprehensive E2E test restaurant description.'
    };

    if (restaurantNameField) {
      await page.click('input[placeholder*="Taverna"]');
      await page.evaluate(() => document.querySelector('input[placeholder*="Taverna"]').select());
      await page.type('input[placeholder*="Taverna"]', testData.name);
    }

    if (addressField) {
      await page.click('input[placeholder*="Rruga"]');
      await page.evaluate(() => document.querySelector('input[placeholder*="Rruga"]').select());
      await page.type('input[placeholder*="Rruga"]', testData.address);
    }

    if (phoneField) {
      await page.click('input[placeholder*="+355"]');
      await page.evaluate(() => document.querySelector('input[placeholder*="+355"]').select());
      await page.type('input[placeholder*="+355"]', testData.phone);
    }

    if (cuisineSelect) {
      await page.select('select', testData.cuisine);
    }

    const descriptionField = await page.$('textarea');
    if (descriptionField) {
      await page.click('textarea');
      await page.type('textarea', testData.description);
    }

    // Verify the data was entered
    const enteredName = await page.$eval('input[placeholder*="Taverna"]', el => el.value).catch(() => '');
    addTestResult('Restaurant name entered correctly', enteredName.includes('Test Restaurant'), `Entered: ${enteredName}`);

    // Test 8: Check continue button and proceed to Step 2
    console.log('\n📋 TEST 6: Step 1 to Step 2 Transition');
    
    const continueButton = await page.$('.next-button');
    addTestResult('Continue button exists', continueButton !== null);

    if (continueButton) {
      await page.click('.next-button');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for transition
      
      // Check if we're on step 2
      const step2Title = await page.$eval('h2', el => el.textContent).catch(() => '');
      addTestResult('Progressed to Step 2', step2Title.includes('Kategoritë'), `Current title: ${step2Title}`);
    }

    // Test 9: Step 2 - Menu Categories
    console.log('\n📋 TEST 7: Step 2 - Menu Categories');
    
    const categoryPreview = await page.$('.category-preview');
    addTestResult('Category preview exists', categoryPreview !== null);

    const categoryItems = await page.$$('.category-item');
    addTestResult('Category items displayed', categoryItems.length >= 4, `Found ${categoryItems.length} categories`);

    // Proceed to Step 3
    const step2NextButton = await page.$('.next-button');
    if (step2NextButton) {
      await page.click('.next-button');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test 10: Step 3 - Menu Items
    console.log('\n📋 TEST 8: Step 3 - Menu Items');
    
    const step3Title = await page.$eval('h2', el => el.textContent).catch(() => '');
    addTestResult('Step 3 title in Albanian', step3Title.includes('Shtoni Artikujt'), `Title: ${step3Title}`);

    const menuItemNameInput = await page.$('input[placeholder*="Emri i pjatës"]');
    const menuItemPriceInput = await page.$('input[placeholder*="Çmimi"]');
    const addItemButton = await page.$('.add-item-button');
    
    addTestResult('Menu item name input exists', menuItemNameInput !== null);
    addTestResult('Menu item price input exists', menuItemPriceInput !== null);
    addTestResult('Add item button exists', addItemButton !== null);

    // Test 11: Add a menu item
    console.log('\n📋 TEST 9: Add Menu Item Functionality');
    
    if (menuItemNameInput && menuItemPriceInput && addItemButton) {
      await page.click('input[placeholder*="Emri i pjatës"]');
      await page.type('input[placeholder*="Emri i pjatës"]', 'Byrek me Spinaq');
      
      await page.click('input[placeholder*="Çmimi"]');
      await page.type('input[placeholder*="Çmimi"]', '4.50');
      
      await page.click('.add-item-button');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if item was added
      const addedItems = await page.$('.added-items');
      const itemCards = await page.$$('.item-card');
      
      addTestResult('Menu item added successfully', itemCards.length > 0, `Added ${itemCards.length} items`);
    }

    // Proceed to Step 4
    const step3NextButton = await page.$('.next-button');
    if (step3NextButton) {
      await page.click('.next-button');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test 12: Step 4 - Table Setup
    console.log('\n📋 TEST 10: Step 4 - Table Setup');
    
    const step4Title = await page.$eval('h2', el => el.textContent).catch(() => '');
    addTestResult('Step 4 title in Albanian', step4Title.includes('Konfigurimi i Tavolinave'), `Title: ${step4Title}`);

    const tableCountInput = await page.$('input[type="number"]');
    addTestResult('Table count input exists', tableCountInput !== null);

    // Test 13: Set table count and generate QR codes
    console.log('\n📋 TEST 11: Table Count and QR Generation');
    
    if (tableCountInput) {
      await page.click('input[type="number"]');
      await page.evaluate(() => document.querySelector('input[type="number"]').select());
      await page.type('input[type="number"]', '8');
      
      const enteredTableCount = await page.$eval('input[type="number"]', el => el.value);
      addTestResult('Table count entered correctly', enteredTableCount === '8', `Entered: ${enteredTableCount}`);
    }

    // Test the QR generation button
    const qrGenerateButton = await page.$('.next-button');
    if (qrGenerateButton) {
      const buttonText = await page.$eval('.next-button', el => el.textContent).catch(() => '');
      addTestResult('QR generate button has Albanian text', buttonText.includes('Gjenero') || buttonText.includes('button'), `Button text: ${buttonText}`);
      
      await page.click('.next-button');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for potential API call and navigation
      
      // Check if we progressed to Step 5
      const step5Title = await page.$eval('h2', el => el.textContent).catch(() => '');
      addTestResult('QR generation and step 5 progression', step5Title.includes('Gati për') || step5Title.includes('Ready'), `Current title: ${step5Title}`);
    }

    // Test 14: Step 5 - Completion
    console.log('\n📋 TEST 12: Step 5 - Completion');
    
    const setupSummary = await page.$('.setup-summary');
    addTestResult('Setup summary exists', setupSummary !== null);

    const summaryItems = await page.$$('.summary-item');
    addTestResult('Summary items displayed', summaryItems.length >= 3, `Found ${summaryItems.length} summary items`);

    const completeButton = await page.$('.complete-button');
    addTestResult('Complete button exists', completeButton !== null);

    // Test 15: Albanian translations validation
    console.log('\n📋 TEST 13: Albanian Translations Validation');
    
    const albanianTexts = [
      'Gati për përdorim',
      'Kategoritë e Menusë',
      'Konfigurimi i Tavolinave',
      'Mirë se vini',
      'restoranti'
    ];
    
    let translationsCorrect = 0;
    for (const text of albanianTexts) {
      const elementExists = await page.evaluate((searchText) => {
        return document.body.innerText.includes(searchText);
      }, text);
      
      if (elementExists) {
        translationsCorrect++;
      }
    }
    
    addTestResult('Albanian translations present', translationsCorrect >= albanianTexts.length * 0.6, 
      `Found ${translationsCorrect}/${albanianTexts.length} Albanian texts`);

  } catch (error) {
    addTestResult('Test execution completed without crashes', false, `Error: ${error.message}`);
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }

  // Generate comprehensive test report
  console.log('\n' + '='.repeat(70));
  console.log('📊 AUTHENTICATED ONBOARDING FLOW TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`🕒 Test Duration: ${new Date().toISOString()}`);
  console.log(`📈 Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  
  console.log('\n📋 DETAILED RESULTS:');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.testName}`);
    if (test.details) {
      console.log(`   📝 ${test.details}`);
    }
  });

  // Save results to file
  fs.writeFileSync('test-results-onboarding-auth.json', JSON.stringify(testResults, null, 2));
  console.log('\n💾 Test results saved to: test-results-onboarding-auth.json');

  // Specific recommendations based on results
  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.summary.failed === 0) {
    console.log('🎉 Perfect! All onboarding steps are working correctly with authentication.');
  } else {
    console.log(`🔧 ${testResults.summary.failed} issue(s) found. Detailed analysis:`);
    
    const failedTests = testResults.tests.filter(t => !t.passed);
    failedTests.forEach(test => {
      console.log(`   • ${test.testName}: ${test.details}`);
    });
    
    // Provide specific fix suggestions
    console.log('\n🛠️ SUGGESTED FIXES:');
    if (failedTests.some(t => t.testName.includes('Albanian'))) {
      console.log('   • Review Albanian translations for completeness');
    }
    if (failedTests.some(t => t.testName.includes('button'))) {
      console.log('   • Check button click handlers and form validation');
    }
    if (failedTests.some(t => t.testName.includes('wizard'))) {
      console.log('   • Verify onboarding wizard CSS classes and structure');
    }
  }

  console.log('\n' + '='.repeat(70));
  
  return testResults;
}

// Run the test
if (require.main === module) {
  testOnboardingWithAuth().catch(console.error);
}

module.exports = testOnboardingWithAuth;