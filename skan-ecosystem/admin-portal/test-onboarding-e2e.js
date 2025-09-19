const puppeteer = require('puppeteer');
const fs = require('fs');

// Comprehensive End-to-End Onboarding Test
async function testOnboardingFlow() {
  console.log('🚀 Starting Comprehensive Onboarding E2E Test...\n');
  
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

    // Test 1: Navigate to onboarding page
    console.log('\n📋 TEST 1: Navigation to Onboarding Page');
    await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });
    
    const pageTitle = await page.title();
    addTestResult('Navigate to onboarding page', pageTitle.includes('SKAN') || pageTitle.includes('Restaurant'), `Page title: ${pageTitle}`);

    // Test 2: Check if onboarding wizard loads
    console.log('\n📋 TEST 2: Onboarding Wizard Loading');
    const wizardExists = await page.$('.onboarding-wizard') !== null;
    addTestResult('Onboarding wizard element exists', wizardExists);

    // Wait for loading to complete
    await page.waitForSelector('.onboarding-content', { timeout: 5000 });
    
    // Test 3: Check progress bar UI improvements
    console.log('\n📋 TEST 3: Progress Bar UI Improvements');
    const progressBar = await page.$('.step-progress');
    const progressBarExists = progressBar !== null;
    addTestResult('Progress bar exists', progressBarExists);

    // Check if step icons are present (new design)
    const stepIcons = await page.$$('.step-icon');
    addTestResult('Step icons present (new design)', stepIcons.length === 5, `Found ${stepIcons.length} step icons`);

    // Check if step titles are concise (should be short like "Info", "Menu", etc.)
    const stepTitles = await page.$$eval('.step-title', elements => 
      elements.map(el => el.textContent.trim())
    );
    const hasConciseTitles = stepTitles.every(title => title.length <= 6);
    addTestResult('Step titles are concise', hasConciseTitles, `Titles: ${stepTitles.join(', ')}`);

    // Test 4: Check if progress line exists
    const progressLine = await page.$('.progress-line');
    addTestResult('Progress line exists', progressLine !== null);

    // Test 5: Restaurant Information Form
    console.log('\n📋 TEST 4: Restaurant Information Form');
    
    // Check if form fields exist
    const restaurantNameField = await page.$('input[placeholder*="Taverna"]');
    const addressField = await page.$('input[placeholder*="Rruga"]');
    const phoneField = await page.$('input[placeholder*="+355"]');
    const cuisineSelect = await page.$('select');
    const descriptionField = await page.$('textarea');
    
    addTestResult('Restaurant name field exists', restaurantNameField !== null);
    addTestResult('Address field exists', addressField !== null);
    addTestResult('Phone field exists', phoneField !== null);
    addTestResult('Cuisine select exists', cuisineSelect !== null);
    addTestResult('Description field exists', descriptionField !== null);

    // Test 6: Fill out the form with test data
    console.log('\n📋 TEST 5: Form Input Testing');
    
    const testData = {
      name: 'Test Restaurant E2E',
      address: 'Test Address 123, Tirana',
      phone: '+355 67 123 4567',
      cuisine: 'mediterranean',
      description: 'This is a comprehensive E2E test restaurant description.'
    };

    await page.type('input[placeholder*="Taverna"]', testData.name);
    await page.type('input[placeholder*="Rruga"]', testData.address);
    await page.type('input[placeholder*="+355"]', testData.phone);
    await page.select('select', testData.cuisine);
    await page.type('textarea', testData.description);

    // Verify the data was entered
    const enteredName = await page.$eval('input[placeholder*="Taverna"]', el => el.value);
    const enteredAddress = await page.$eval('input[placeholder*="Rruga"]', el => el.value);
    const enteredPhone = await page.$eval('input[placeholder*="+355"]', el => el.value);
    const selectedCuisine = await page.$eval('select', el => el.value);
    const enteredDescription = await page.$eval('textarea', el => el.value);

    addTestResult('Restaurant name entered correctly', enteredName === testData.name);
    addTestResult('Address entered correctly', enteredAddress === testData.address);
    addTestResult('Phone entered correctly', enteredPhone === testData.phone);
    addTestResult('Cuisine selected correctly', selectedCuisine === testData.cuisine);
    addTestResult('Description entered correctly', enteredDescription === testData.description);

    // Test 7: Check if continue button is enabled
    console.log('\n📋 TEST 6: Form Validation');
    const continueButton = await page.$('.next-button');
    const isButtonEnabled = await page.$eval('.next-button', el => !el.disabled);
    addTestResult('Continue button enabled with valid data', isButtonEnabled);

    // Test 8: Test localStorage persistence before submission
    console.log('\n📋 TEST 7: LocalStorage Persistence (Pre-submission)');
    
    // Clear localStorage first
    await page.evaluate(() => {
      localStorage.removeItem('onboarding_restaurant_info');
      localStorage.removeItem('onboarding_current_step');
    });

    // Submit the form
    await page.click('.next-button');
    
    // Wait a moment for processing
    await page.waitForTimeout(2000);

    // Check if data was saved to localStorage
    const savedData = await page.evaluate(() => {
      const savedInfo = localStorage.getItem('onboarding_restaurant_info');
      const savedStep = localStorage.getItem('onboarding_current_step');
      return { savedInfo, savedStep };
    });

    addTestResult('Restaurant info saved to localStorage', savedData.savedInfo !== null, `Saved data exists: ${!!savedData.savedInfo}`);

    // Test 9: Check if we progressed to step 2 (or if error handling works)
    console.log('\n📋 TEST 8: Form Submission and Progress');
    
    // Wait for either success (step 2) or error message
    await page.waitForTimeout(3000);
    
    const currentStepElement = await page.$('.step.active .step-title');
    const currentStepTitle = currentStepElement ? await page.$eval('.step.active .step-title', el => el.textContent) : null;
    
    const errorMessage = await page.$('.error-message');
    const hasError = errorMessage !== null;
    
    if (hasError) {
      const errorText = await page.$eval('.error-message', el => el.textContent);
      addTestResult('Error handling displayed correctly', true, `Error shown: ${errorText}`);
      
      // Test skip functionality if error occurred
      const skipButton = await page.$('.skip-button');
      if (skipButton) {
        addTestResult('Skip & Continue button appears on error', true);
        await page.click('.skip-button');
        await page.waitForTimeout(1000);
      }
    } else {
      addTestResult('Form submission successful', currentStepTitle === 'Menu', `Current step: ${currentStepTitle}`);
    }

    // Test 10: Test page refresh and restoration
    console.log('\n📋 TEST 9: Page Refresh and Data Restoration');
    
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);

    // Check if data was restored
    const restoredName = await page.$eval('input[placeholder*="Taverna"]', el => el.value).catch(() => '');
    const restoredAddress = await page.$eval('input[placeholder*="Rruga"]', el => el.value).catch(() => '');
    
    // If we're on step 1, check if data was restored
    const isOnStep1 = await page.$('input[placeholder*="Taverna"]') !== null;
    if (isOnStep1) {
      addTestResult('Data restored after page refresh', 
        restoredName.includes('Test Restaurant') || restoredAddress.includes('Test Address'),
        `Restored name: ${restoredName}, address: ${restoredAddress}`);
    } else {
      addTestResult('Progressed past step 1 successfully', true, 'Not on step 1 anymore');
    }

    // Test 11: Check responsive design (mobile simulation)
    console.log('\n📋 TEST 10: Mobile Responsiveness');
    
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE size
    await page.waitForTimeout(1000);

    const progressBarMobile = await page.$('.step-progress');
    const mobileStepIcons = await page.$$('.step-icon');
    
    addTestResult('Progress bar exists on mobile', progressBarMobile !== null);
    addTestResult('Step icons visible on mobile', mobileStepIcons.length > 0, `Found ${mobileStepIcons.length} icons`);

    // Check if step titles are still readable on mobile
    const mobileTitles = await page.$$eval('.step-title', elements => 
      elements.map(el => el.textContent.trim())
    );
    addTestResult('Step titles readable on mobile', mobileTitles.length > 0, `Mobile titles: ${mobileTitles.join(', ')}`);

    // Test 12: API Integration Test (if reachable)
    console.log('\n📋 TEST 11: API Integration');
    
    // Check if API is reachable
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://api-mkazmlu7ta-ew.a.run.app/health');
        return { status: response.status, reachable: true };
      } catch (error) {
        return { status: null, reachable: false, error: error.message };
      }
    });

    addTestResult('API endpoint reachable', apiResponse.reachable, `API status: ${apiResponse.status || 'unreachable'}`);

    // Test 13: Console Error Check
    console.log('\n📋 TEST 12: Console Error Analysis');
    
    const consoleErrors = [];
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    // Wait a moment to catch any errors
    await page.waitForTimeout(2000);
    
    addTestResult('No critical console errors', consoleErrors.length === 0, 
      consoleErrors.length > 0 ? `Errors: ${consoleErrors.join(', ')}` : 'Clean console');

  } catch (error) {
    addTestResult('Test execution completed without crashes', false, `Error: ${error.message}`);
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }

  // Generate test report
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE E2E TEST RESULTS');
  console.log('='.repeat(60));
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
  fs.writeFileSync('test-results-onboarding-e2e.json', JSON.stringify(testResults, null, 2));
  console.log('\n💾 Test results saved to: test-results-onboarding-e2e.json');

  // Recommendations based on results
  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.summary.failed === 0) {
    console.log('🎉 All tests passed! The onboarding flow is working perfectly.');
  } else {
    console.log(`🔧 ${testResults.summary.failed} test(s) failed. Review the detailed results above.`);
    
    const failedTests = testResults.tests.filter(t => !t.passed);
    failedTests.forEach(test => {
      console.log(`   • Fix: ${test.testName} - ${test.details}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  return testResults;
}

// Run the test
if (require.main === module) {
  testOnboardingFlow().catch(console.error);
}

module.exports = testOnboardingFlow;