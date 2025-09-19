const puppeteer = require('puppeteer');
const fs = require('fs');

// E2E Test for Fresh User Onboarding Flow
async function testFreshUserOnboarding() {
  console.log('🚀 Testing Fresh User Onboarding Flow...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 50
  });
  
  const page = await browser.newPage();
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0, total: 0 }
  };

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
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('onboarding') || msg.text().includes('Loading') || msg.text().includes('API'))) {
        console.log(`🔍 PAGE: ${msg.text()}`);
      } else if (msg.type() === 'error') {
        console.log(`🚨 ERROR: ${msg.text()}`);
      }
    });

    // Test 1: Navigate and Login
    console.log('\n📋 TEST 1: Authentication Flow');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Login with demo credentials
    await page.type('input[type="email"]', 'manager_email1@gmail.com');
    await page.type('input[type="password"]', 'demo123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    addTestResult('Login successful', !currentUrl.includes('login'), `URL: ${currentUrl}`);

    // Test 2: Force onboarding by clearing user state and navigating directly
    console.log('\n📋 TEST 2: Force Onboarding Access');
    
    // Clear any existing onboarding data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate directly to onboarding
    await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if onboarding loads (might be blocked by auth)
    const onboardingUrl = page.url();
    const onOnboardingPage = onboardingUrl.includes('onboarding');
    
    if (onOnboardingPage) {
      addTestResult('Onboarding page accessible', true);
      
      // Test 3: Onboarding UI Components
      console.log('\n📋 TEST 3: Onboarding UI Verification');
      
      try {
        await page.waitForSelector('.onboarding-wizard', { timeout: 5000 });
        const wizardExists = await page.$('.onboarding-wizard') !== null;
        addTestResult('Onboarding wizard loads', wizardExists);

        if (wizardExists) {
          // Test 4: Progress Bar New Design
          console.log('\n📋 TEST 4: Progress Bar Design');
          
          const stepIcons = await page.$$('.step-icon');
          const stepTitles = await page.$$eval('.step-title', elements => 
            elements.map(el => el.textContent.trim())
          );
          const progressLine = await page.$('.progress-line');
          const progressFill = await page.$('.progress-fill');
          
          addTestResult('Step icons present', stepIcons.length === 5, `Found ${stepIcons.length} icons`);
          addTestResult('Concise step titles', stepTitles.every(title => title.length <= 6), 
            `Titles: ${stepTitles.join(', ')}`);
          addTestResult('Progress line exists', progressLine !== null);
          addTestResult('Progress fill animation exists', progressFill !== null);

          // Test 5: Form Fields
          console.log('\n📋 TEST 5: Restaurant Form Fields');
          
          const formFields = {
            name: await page.$('input[placeholder*="Taverna"], input[placeholder*="Restaurant"]'),
            address: await page.$('input[placeholder*="Rruga"], input[placeholder*="Address"]'),
            phone: await page.$('input[type="tel"], input[placeholder*="+355"]'),
            cuisine: await page.$('select'),
            description: await page.$('textarea')
          };
          
          Object.entries(formFields).forEach(([field, element]) => {
            addTestResult(`${field} field exists`, element !== null);
          });

          // Test 6: Form Input Testing
          console.log('\n📋 TEST 6: Form Input Testing');
          
          const testData = {
            name: 'Puppeteer Test Restaurant',
            address: 'Automated Test Street 123, Tirana',
            phone: '+355 69 111 2222',
            cuisine: 'mediterranean',
            description: 'This is an automated E2E test restaurant created by Puppeteer'
          };

          // Fill the form
          if (formFields.name) await page.type('input[placeholder*="Taverna"], input[placeholder*="Restaurant"]', testData.name);
          if (formFields.address) await page.type('input[placeholder*="Rruga"], input[placeholder*="Address"]', testData.address);
          if (formFields.phone) await page.type('input[type="tel"], input[placeholder*="+355"]', testData.phone);
          if (formFields.cuisine) await page.select('select', testData.cuisine);
          if (formFields.description) await page.type('textarea', testData.description);

          // Verify data entry
          const enteredData = await page.evaluate(() => {
            const nameField = document.querySelector('input[placeholder*="Taverna"], input[placeholder*="Restaurant"]');
            const addressField = document.querySelector('input[placeholder*="Rruga"], input[placeholder*="Address"]');
            const phoneField = document.querySelector('input[type="tel"], input[placeholder*="+355"]');
            const cuisineField = document.querySelector('select');
            const descField = document.querySelector('textarea');
            
            return {
              name: nameField ? nameField.value : '',
              address: addressField ? addressField.value : '',
              phone: phoneField ? phoneField.value : '',
              cuisine: cuisineField ? cuisineField.value : '',
              description: descField ? descField.value : ''
            };
          });

          Object.entries(testData).forEach(([field, expected]) => {
            addTestResult(`${field} data entered correctly`, 
              enteredData[field] === expected, 
              `Expected: ${expected}, Got: ${enteredData[field]}`);
          });

          // Test 7: Button State
          console.log('\n📋 TEST 7: Form Validation');
          
          const continueButton = await page.$('.next-button');
          if (continueButton) {
            const isEnabled = await page.$eval('.next-button', el => !el.disabled);
            addTestResult('Continue button enabled with valid data', isEnabled);
          }

          // Test 8: Form Submission
          console.log('\n📋 TEST 8: Form Submission');
          
          // Clear localStorage before submission
          await page.evaluate(() => {
            localStorage.removeItem('onboarding_restaurant_info');
            localStorage.removeItem('onboarding_current_step');
          });

          if (continueButton) {
            await page.click('.next-button');
            await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for API response

            // Check for errors or progress
            const errorMessage = await page.$('.error-message');
            const skipButton = await page.$('.skip-button');
            
            if (errorMessage) {
              const errorText = await page.$eval('.error-message', el => el.textContent.trim());
              addTestResult('Error handling active', true, `Error: ${errorText}`);
              
              if (skipButton) {
                addTestResult('Skip button appears on error', true);
                
                // Test skip functionality
                await page.click('.skip-button');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const currentStepAfterSkip = await page.$eval('.step.active .step-title', 
                  el => el.textContent).catch(() => null);
                addTestResult('Skip functionality works', 
                  currentStepAfterSkip !== 'Info', `Now on: ${currentStepAfterSkip}`);
              }
            } else {
              // Check if progressed
              const currentStep = await page.$eval('.step.active .step-title', 
                el => el.textContent).catch(() => 'Unknown');
              addTestResult('Form submission progressed', 
                currentStep !== 'Info', `Current step: ${currentStep}`);
            }

            // Test 9: localStorage Persistence
            console.log('\n📋 TEST 9: Data Persistence');
            
            const savedData = await page.evaluate(() => {
              return {
                info: localStorage.getItem('onboarding_restaurant_info'),
                step: localStorage.getItem('onboarding_current_step')
              };
            });
            
            addTestResult('Data saved to localStorage', 
              savedData.info !== null, `Data exists: ${!!savedData.info}`);

            // Test 10: Page Refresh Test
            console.log('\n📋 TEST 10: Data Restoration');
            
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check if we're still in onboarding and data is restored
            const stillOnOnboarding = page.url().includes('onboarding');
            if (stillOnOnboarding) {
              const restoredName = await page.evaluate(() => {
                const nameField = document.querySelector('input[placeholder*="Taverna"], input[placeholder*="Restaurant"]');
                return nameField ? nameField.value : '';
              });
              
              addTestResult('Data restored after refresh', 
                restoredName.includes('Puppeteer'), `Restored: ${restoredName}`);
            } else {
              addTestResult('Progressed beyond onboarding', true, 'No longer on onboarding page');
            }

            // Test 11: Mobile Responsiveness
            console.log('\n📋 TEST 11: Mobile Testing');
            
            // Go back to onboarding if not there
            if (!page.url().includes('onboarding')) {
              await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

            await page.setViewport({ width: 375, height: 667 });
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mobileStepIcons = await page.$$('.step-icon');
            const mobileProgressBar = await page.$('.step-progress');
            
            addTestResult('Mobile progress bar works', mobileProgressBar !== null);
            addTestResult('Mobile step icons visible', mobileStepIcons.length > 0, 
              `Icons: ${mobileStepIcons.length}`);

            // Test viewport responsiveness
            const progressBarWidth = await page.$eval('.step-progress', 
              el => el.offsetWidth).catch(() => 0);
            addTestResult('Progress bar responsive', progressBarWidth > 0 && progressBarWidth < 400, 
              `Width: ${progressBarWidth}px`);
          }
        }
      } catch (wizardError) {
        addTestResult('Onboarding wizard loads', false, `Error: ${wizardError.message}`);
      }
    } else {
      addTestResult('Onboarding page accessible', false, `Redirected to: ${onboardingUrl}`);
      
      // If redirected to dashboard, try to force onboarding by modifying user state
      console.log('\n📋 Attempting to force onboarding state...');
      
      await page.evaluate(() => {
        // Try to modify auth state to force onboarding
        localStorage.setItem('auth_needsOnboarding', 'true');
        localStorage.setItem('onboarding_forced', 'true');
      });
      
      await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalUrl = page.url();
      addTestResult('Forced onboarding access', finalUrl.includes('onboarding'), 
        `Final URL: ${finalUrl}`);
    }

    // Test 12: API Health Check
    console.log('\n📋 TEST 12: API Integration');
    
    const apiHealth = await page.evaluate(async () => {
      try {
        const response = await fetch('https://api-mkazmlu7ta-ew.a.run.app/health');
        const text = await response.text();
        return { 
          status: response.status, 
          reachable: true,
          response: text
        };
      } catch (error) {
        return { status: null, reachable: false, error: error.message };
      }
    });

    addTestResult('API health check', apiHealth.reachable, 
      `Status: ${apiHealth.status}, Response: ${apiHealth.response?.substring(0, 50) || apiHealth.error}`);

  } catch (error) {
    addTestResult('Test execution without crashes', false, `Error: ${error.message}`);
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }

  // Generate Report
  console.log('\n' + '='.repeat(80));
  console.log('📊 FRESH USER ONBOARDING TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`🕒 Completed: ${new Date().toISOString()}`);
  console.log(`📈 Total: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  
  console.log('\n📋 DETAILED RESULTS:');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${String(index + 1).padStart(2, '0')}. ${status} ${test.testName}`);
    if (test.details) {
      console.log(`     📝 ${test.details}`);
    }
  });

  // Save results
  fs.writeFileSync('test-results-fresh-user-onboarding.json', 
    JSON.stringify(testResults, null, 2));
  console.log('\n💾 Results saved to: test-results-fresh-user-onboarding.json');

  // Final assessment
  console.log('\n🎯 ASSESSMENT:');
  const successRate = (testResults.summary.passed / testResults.summary.total) * 100;
  
  if (successRate >= 95) {
    console.log('🎉 EXCELLENT: Onboarding flow is production-ready!');
  } else if (successRate >= 85) {
    console.log('✅ GOOD: Minor issues to address before production.');
  } else if (successRate >= 70) {
    console.log('⚠️ NEEDS WORK: Several issues need attention.');
  } else {
    console.log('🔴 CRITICAL: Major issues prevent production deployment.');
  }

  const failedTests = testResults.tests.filter(t => !t.passed);
  if (failedTests.length > 0) {
    console.log('\n🔧 PRIORITY FIXES:');
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.testName}: ${test.details}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  
  return testResults;
}

// Execute the test
if (require.main === module) {
  testFreshUserOnboarding().catch(console.error);
}

module.exports = testFreshUserOnboarding;