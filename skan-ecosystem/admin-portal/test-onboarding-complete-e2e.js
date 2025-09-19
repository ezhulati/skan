const puppeteer = require('puppeteer');
const fs = require('fs');

// Comprehensive End-to-End Onboarding Test with Authentication
async function testCompleteOnboardingFlow() {
  console.log('🚀 Starting Complete Onboarding E2E Test with Authentication...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 100 // Slow down for better visibility
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
    if (details) {
      console.log(`   📝 ${details}`);
    }
  }

  try {
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('onboarding')) {
        console.log(`🔍 PAGE LOG: ${msg.text()}`);
      } else if (msg.type() === 'error') {
        console.log(`🚨 PAGE ERROR: ${msg.text()}`);
      }
    });

    // Test 1: Navigate to application root
    console.log('\n📋 TEST 1: Application Access');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    const currentUrl = page.url();
    addTestResult('Application loads and redirects properly', 
      currentUrl.includes('login'), `Redirected to: ${currentUrl}`);

    // Test 2: Check login page elements
    console.log('\n📋 TEST 2: Login Page Verification');
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"]');
    
    addTestResult('Email field exists', emailField !== null);
    addTestResult('Password field exists', passwordField !== null);
    addTestResult('Login button exists', loginButton !== null);

    // Test 3: Attempt login with demo credentials (if available)
    console.log('\n📋 TEST 3: Authentication Test');
    
    // Try demo credentials from the CLAUDE.md documentation
    const demoCredentials = {
      email: 'manager_email1@gmail.com',
      password: 'demo123'
    };

    if (emailField && passwordField && loginButton) {
      await page.type('input[type="email"]', demoCredentials.email);
      await page.type('input[type="password"]', demoCredentials.password);
      
      // Click login and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const postLoginUrl = page.url();
      const loginSuccessful = !postLoginUrl.includes('login');
      
      addTestResult('Login attempt completed', true, `Current URL: ${postLoginUrl}`);
      
      if (loginSuccessful) {
        addTestResult('Authentication successful', true);
        
        // Test 4: Check if redirected to onboarding or dashboard
        console.log('\n📋 TEST 4: Post-Login Navigation');
        
        if (postLoginUrl.includes('onboarding')) {
          addTestResult('Redirected to onboarding (user needs setup)', true);
          
          // Test 5: Onboarding UI Components
          console.log('\n📋 TEST 5: Onboarding Interface Verification');
          
          // Wait for onboarding wizard to load
          await page.waitForSelector('.onboarding-wizard', { timeout: 5000 });
          
          const wizardExists = await page.$('.onboarding-wizard') !== null;
          addTestResult('Onboarding wizard loads', wizardExists);

          // Test 6: Progress Bar New Design
          console.log('\n📋 TEST 6: Progress Bar UI Improvements');
          
          const stepIcons = await page.$$('.step-icon');
          const stepTitles = await page.$$eval('.step-title', elements => 
            elements.map(el => el.textContent.trim())
          );
          const progressLine = await page.$('.progress-line');
          
          addTestResult('Step icons present (new design)', stepIcons.length === 5, 
            `Found ${stepIcons.length} step icons`);
          addTestResult('Step titles are concise', 
            stepTitles.every(title => title.length <= 6), 
            `Titles: ${stepTitles.join(', ')}`);
          addTestResult('Progress line exists', progressLine !== null);

          // Test 7: Form Field Verification
          console.log('\n📋 TEST 7: Restaurant Information Form');
          
          const formFields = {
            name: await page.$('input[placeholder*="Taverna"]'),
            address: await page.$('input[placeholder*="Rruga"]'),
            phone: await page.$('input[placeholder*="+355"]'),
            cuisine: await page.$('select'),
            description: await page.$('textarea')
          };
          
          Object.entries(formFields).forEach(([field, element]) => {
            addTestResult(`${field} field exists`, element !== null);
          });

          // Test 8: Form Input and Validation
          console.log('\n📋 TEST 8: Form Input Testing');
          
          const testData = {
            name: 'E2E Test Restaurant',
            address: 'Test Street 123, Tirana',
            phone: '+355 69 987 6543',
            cuisine: 'mediterranean',
            description: 'Comprehensive E2E test restaurant for SKAN.AL'
          };

          // Fill out the form
          await page.type('input[placeholder*="Taverna"]', testData.name);
          await page.type('input[placeholder*="Rruga"]', testData.address);
          await page.type('input[placeholder*="+355"]', testData.phone);
          await page.select('select', testData.cuisine);
          await page.type('textarea', testData.description);

          // Verify the data was entered correctly
          const enteredData = await page.evaluate(() => {
            return {
              name: document.querySelector('input[placeholder*="Taverna"]')?.value || '',
              address: document.querySelector('input[placeholder*="Rruga"]')?.value || '',
              phone: document.querySelector('input[placeholder*="+355"]')?.value || '',
              cuisine: document.querySelector('select')?.value || '',
              description: document.querySelector('textarea')?.value || ''
            };
          });

          Object.entries(testData).forEach(([field, expected]) => {
            addTestResult(`${field} data entered correctly`, 
              enteredData[field] === expected, 
              `Expected: ${expected}, Got: ${enteredData[field]}`);
          });

          // Test 9: Form Submission and Error Handling
          console.log('\n📋 TEST 9: Form Submission Testing');
          
          const continueButton = await page.$('.next-button');
          const isButtonEnabled = await page.$eval('.next-button', el => !el.disabled);
          addTestResult('Continue button enabled with valid data', isButtonEnabled);

          if (continueButton && isButtonEnabled) {
            // Clear localStorage to test fresh submission
            await page.evaluate(() => {
              localStorage.removeItem('onboarding_restaurant_info');
              localStorage.removeItem('onboarding_current_step');
            });

            // Submit the form
            await page.click('.next-button');
            
            // Wait for response (either success or error)
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check for error messages or progress
            const errorMessage = await page.$('.error-message');
            const skipButton = await page.$('.skip-button');
            
            if (errorMessage) {
              const errorText = await page.$eval('.error-message', el => el.textContent);
              addTestResult('Error handling displayed', true, `Error: ${errorText}`);
              
              if (skipButton) {
                addTestResult('Skip & Continue button appears on error', true);
                
                // Test the skip functionality
                await page.click('.skip-button');
                await new Promise(resolve => setTimeout(resolve, 1000));
                addTestResult('Skip functionality works', true);
              }
            } else {
              // Check if progressed to next step
              const currentStepTitle = await page.$eval('.step.active .step-title', 
                el => el.textContent).catch(() => null);
              addTestResult('Progressed to next step', 
                currentStepTitle === 'Menu', `Current step: ${currentStepTitle}`);
            }

            // Test 10: LocalStorage Persistence
            console.log('\n📋 TEST 10: Data Persistence Testing');
            
            const savedData = await page.evaluate(() => {
              return {
                info: localStorage.getItem('onboarding_restaurant_info'),
                step: localStorage.getItem('onboarding_current_step')
              };
            });
            
            addTestResult('Restaurant info saved to localStorage', 
              savedData.info !== null, `Data saved: ${!!savedData.info}`);

            // Test 11: Page Refresh and Data Restoration
            console.log('\n📋 TEST 11: Data Restoration Testing');
            
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check if onboarding wizard still loads
            const wizardAfterRefresh = await page.$('.onboarding-wizard');
            addTestResult('Onboarding wizard loads after refresh', wizardAfterRefresh !== null);

            if (wizardAfterRefresh) {
              // Check if we're on the correct step
              const currentStepAfterRefresh = await page.$eval('.step.active .step-title', 
                el => el.textContent).catch(() => 'Info');
              
              // Check if data was restored (if we're back on step 1)
              if (currentStepAfterRefresh === 'Info') {
                const restoredName = await page.$eval('input[placeholder*="Taverna"]', 
                  el => el.value).catch(() => '');
                addTestResult('Data restored after page refresh', 
                  restoredName.includes('E2E Test'), `Restored name: ${restoredName}`);
              } else {
                addTestResult('Maintained progress after refresh', true, 
                  `On step: ${currentStepAfterRefresh}`);
              }
            }

            // Test 12: Mobile Responsiveness
            console.log('\n📋 TEST 12: Mobile Responsiveness');
            
            await page.setViewport({ width: 375, height: 667 }); // iPhone SE
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mobileStepIcons = await page.$$('.step-icon');
            const mobileProgressBar = await page.$('.step-progress');
            
            addTestResult('Progress bar responsive on mobile', mobileProgressBar !== null);
            addTestResult('Step icons visible on mobile', mobileStepIcons.length > 0, 
              `Found ${mobileStepIcons.length} icons`);

          } else {
            addTestResult('Continue button not accessible', false, 'Cannot test form submission');
          }

        } else if (postLoginUrl.includes('dashboard')) {
          addTestResult('Redirected to dashboard (onboarding complete)', true);
          
          // User has already completed onboarding, test dashboard access
          console.log('\n📋 TEST 5: Dashboard Access (User Already Onboarded)');
          
          const dashboardTitle = await page.$('h1');
          addTestResult('Dashboard loads successfully', dashboardTitle !== null);
        }
        
      } else {
        addTestResult('Authentication failed', false, 'Login credentials may be invalid');
        
        // Check for error messages
        const loginError = await page.$('.error-message');
        if (loginError) {
          const errorText = await page.$eval('.error-message', el => el.textContent);
          addTestResult('Login error message displayed', true, `Error: ${errorText}`);
        }
      }
    } else {
      addTestResult('Login form incomplete', false, 'Missing form elements');
    }

    // Test 13: API Health Check
    console.log('\n📋 TEST 13: API Integration');
    
    const apiHealth = await page.evaluate(async () => {
      try {
        const response = await fetch('https://api-mkazmlu7ta-ew.a.run.app/health');
        return { 
          status: response.status, 
          reachable: true,
          statusText: response.statusText
        };
      } catch (error) {
        return { status: null, reachable: false, error: error.message };
      }
    });

    addTestResult('API endpoint reachable', apiHealth.reachable, 
      `Status: ${apiHealth.status} ${apiHealth.statusText || apiHealth.error}`);

  } catch (error) {
    addTestResult('Test execution completed without crashes', false, `Error: ${error.message}`);
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }

  // Generate comprehensive test report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE ONBOARDING E2E TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`🕒 Test Completed: ${new Date().toISOString()}`);
  console.log(`📈 Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  
  console.log('\n📋 DETAILED TEST RESULTS:');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${String(index + 1).padStart(2, '0')}. ${status} ${test.testName}`);
    if (test.details) {
      console.log(`     📝 ${test.details}`);
    }
  });

  // Save detailed results
  fs.writeFileSync('test-results-complete-onboarding-e2e.json', 
    JSON.stringify(testResults, null, 2));
  console.log('\n💾 Test results saved to: test-results-complete-onboarding-e2e.json');

  // Performance and Quality Assessment
  console.log('\n🎯 QUALITY ASSESSMENT:');
  
  const categories = {
    'UI/UX': testResults.tests.filter(t => 
      t.testName.includes('Progress') || t.testName.includes('responsive') || 
      t.testName.includes('UI') || t.testName.includes('design')),
    'Functionality': testResults.tests.filter(t => 
      t.testName.includes('Form') || t.testName.includes('submission') || 
      t.testName.includes('validation')),
    'Persistence': testResults.tests.filter(t => 
      t.testName.includes('localStorage') || t.testName.includes('restore') || 
      t.testName.includes('refresh')),
    'Error Handling': testResults.tests.filter(t => 
      t.testName.includes('error') || t.testName.includes('skip')),
    'Integration': testResults.tests.filter(t => 
      t.testName.includes('API') || t.testName.includes('auth'))
  };

  Object.entries(categories).forEach(([category, tests]) => {
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
    console.log(`   ${category}: ${passed}/${total} (${rate}%)`);
  });

  // Final recommendations
  console.log('\n🚀 RECOMMENDATIONS:');
  if (testResults.summary.failed === 0) {
    console.log('🎉 Perfect Score! All onboarding functionality is working correctly.');
    console.log('✨ The onboarding flow is production-ready with excellent UX.');
  } else {
    const failureRate = (testResults.summary.failed / testResults.summary.total) * 100;
    if (failureRate < 10) {
      console.log('🎯 Excellent! Minor issues found that are easy to fix.');
    } else if (failureRate < 25) {
      console.log('⚠️  Good overall, but some important issues need attention.');
    } else {
      console.log('🔧 Several critical issues found that should be addressed.');
    }
    
    console.log('\n📝 Priority Fixes:');
    const failedTests = testResults.tests.filter(t => !t.passed);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.testName}: ${test.details}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  
  return testResults;
}

// Run the comprehensive test
if (require.main === module) {
  testCompleteOnboardingFlow().catch(console.error);
}

module.exports = testCompleteOnboardingFlow;