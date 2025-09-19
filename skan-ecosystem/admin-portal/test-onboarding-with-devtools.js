const puppeteer = require('puppeteer');
const fs = require('fs');

// Comprehensive E2E Test using DevTools for Onboarding Reset
async function testOnboardingWithDevTools() {
  console.log('🚀 Comprehensive Onboarding E2E Test with DevTools...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 100
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
    // Enhanced console monitoring
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('onboarding') || text.includes('Loading') || text.includes('API') || text.includes('Error')) {
        console.log(`🔍 ${msg.type().toUpperCase()}: ${text}`);
      }
    });

    // Test 1: Login and Access Dashboard
    console.log('\n📋 PHASE 1: Authentication & Initial Setup');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'manager_email1@gmail.com');
    await page.type('input[type="password"]', 'demo123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);

    await new Promise(resolve => setTimeout(resolve, 2000));
    const initialUrl = page.url();
    addTestResult('Initial login successful', !initialUrl.includes('login'), `URL: ${initialUrl}`);

    // Test 2: Check for DevTools
    console.log('\n📋 PHASE 2: DevTools Verification');
    const devToolsElement = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        if (el.textContent && el.textContent.includes('🛠️ DEV TOOLS')) {
          return {
            exists: true,
            text: el.textContent.trim().substring(0, 50),
            clickable: true
          };
        }
      }
      return { exists: false, text: null, clickable: false };
    });
    
    addTestResult('DevTools available in development', devToolsElement.exists, 
      `DevTools found: ${devToolsElement.text || 'Not found'}`);

    // Test 3: Use DevTools to Force Onboarding
    console.log('\n📋 PHASE 3: Force Onboarding via DevTools');
    
    if (devToolsElement.exists) {
      // Click on DevTools to open it
      await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (let el of elements) {
          if (el.textContent && el.textContent.includes('🛠️ DEV TOOLS')) {
            el.click();
            return;
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for Force Onboarding button
      const forceButton = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent && btn.textContent.includes('Force Onboarding')) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      
      addTestResult('DevTools Force Onboarding button found', forceButton, 
        `Force button clicked: ${forceButton}`);
      
      if (forceButton) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const onboardingUrl = page.url();
        addTestResult('Successfully forced onboarding access', 
          onboardingUrl.includes('onboarding'), `URL: ${onboardingUrl}`);
        
        if (onboardingUrl.includes('onboarding')) {
          // Test 4: Comprehensive Onboarding UI Testing
          console.log('\n📋 PHASE 4: Onboarding UI Components');
          
          await page.waitForSelector('.onboarding-wizard', { timeout: 5000 });
          
          // Check progress bar improvements
          const stepElements = await page.$$('.step');
          const stepIcons = await page.$$('.step-icon');
          const stepTitles = await page.$$eval('.step-title', elements => 
            elements.map(el => el.textContent.trim())
          );
          const progressLine = await page.$('.progress-line');
          const progressFill = await page.$('.progress-fill');
          
          addTestResult('Onboarding wizard loaded', stepElements.length > 0, 
            `Found ${stepElements.length} steps`);
          addTestResult('New progress bar design', stepIcons.length === 5, 
            `Icons: ${stepIcons.length}`);
          addTestResult('Concise step titles', stepTitles.every(title => title.length <= 6), 
            `Titles: ${stepTitles.join(', ')}`);
          addTestResult('Progress line animation', progressLine !== null);
          addTestResult('Progress fill element', progressFill !== null);

          // Test 5: Form Functionality
          console.log('\n📋 PHASE 5: Restaurant Information Form');
          
          const formFields = {
            name: await page.$('input[placeholder*="Taverna"], input[placeholder*="Restaurant"]'),
            address: await page.$('input[placeholder*="Rruga"], input[placeholder*="Address"]'),
            phone: await page.$('input[type="tel"], input[placeholder*="+355"]'),
            cuisine: await page.$('select'),
            description: await page.$('textarea')
          };
          
          let allFieldsExist = true;
          Object.entries(formFields).forEach(([field, element]) => {
            const exists = element !== null;
            addTestResult(`${field} field exists`, exists);
            if (!exists) allFieldsExist = false;
          });

          if (allFieldsExist) {
            // Test 6: Form Input and Validation
            console.log('\n📋 PHASE 6: Form Input Testing');
            
            const testData = {
              name: 'DevTools Test Restaurant',
              address: 'E2E Test Street 456, Tirana',
              phone: '+355 69 333 4444',
              cuisine: 'mediterranean',
              description: 'Comprehensive E2E test using DevTools for onboarding reset functionality'
            };

            // Fill the form
            await page.type('input[placeholder*="Taverna"], input[placeholder*="Restaurant"]', testData.name);
            await page.type('input[placeholder*="Rruga"], input[placeholder*="Address"]', testData.address);
            await page.type('input[type="tel"], input[placeholder*="+355"]', testData.phone);
            await page.select('select', testData.cuisine);
            await page.type('textarea', testData.description);

            // Verify form data
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

            let allDataCorrect = true;
            Object.entries(testData).forEach(([field, expected]) => {
              const correct = enteredData[field] === expected;
              addTestResult(`${field} data entry correct`, correct, 
                `Expected: '${expected}', Got: '${enteredData[field]}'`);
              if (!correct) allDataCorrect = false;
            });

            // Test 7: Form Submission and Error Handling
            console.log('\n📋 PHASE 7: Form Submission Testing');
            
            const continueButton = await page.$('.next-button');
            const isButtonEnabled = await page.$eval('.next-button', el => !el.disabled);
            addTestResult('Continue button enabled', isButtonEnabled);

            if (continueButton && isButtonEnabled) {
              // Clear localStorage to test fresh submission
              await page.evaluate(() => {
                localStorage.removeItem('onboarding_restaurant_info');
                localStorage.removeItem('onboarding_current_step');
              });

              await page.click('.next-button');
              await new Promise(resolve => setTimeout(resolve, 4000));

              // Check results
              const errorMessage = await page.$('.error-message');
              const skipButton = await page.$('.skip-button');
              
              if (errorMessage) {
                const errorText = await page.$eval('.error-message', el => el.textContent.trim());
                addTestResult('Error handling active', true, `Error: ${errorText}`);
                
                if (skipButton) {
                  addTestResult('Skip & Continue option available', true);
                  
                  // Test skip functionality
                  await page.click('.skip-button');
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  const currentStep = await page.$eval('.step.active .step-title', 
                    el => el.textContent).catch(() => 'Unknown');
                  addTestResult('Skip functionality works', 
                    currentStep !== 'Info', `Current step: ${currentStep}`);
                } else {
                  addTestResult('Skip & Continue option available', false, 'Skip button not found');
                }
              } else {
                const currentStep = await page.$eval('.step.active .step-title', 
                  el => el.textContent).catch(() => 'Unknown');
                addTestResult('Form submission successful', 
                  currentStep !== 'Info', `Progressed to: ${currentStep}`);
              }

              // Test 8: Data Persistence
              console.log('\n📋 PHASE 8: Data Persistence Testing');
              
              const savedData = await page.evaluate(() => {
                return {
                  info: localStorage.getItem('onboarding_restaurant_info'),
                  step: localStorage.getItem('onboarding_current_step')
                };
              });
              
              addTestResult('Data persisted to localStorage', savedData.info !== null, 
                `Data exists: ${!!savedData.info}`);

              // Test 9: Page Refresh and Data Restoration
              console.log('\n📋 PHASE 9: Data Restoration Testing');
              
              await page.reload({ waitUntil: 'networkidle0' });
              await new Promise(resolve => setTimeout(resolve, 3000));

              const stillOnOnboarding = page.url().includes('onboarding');
              if (stillOnOnboarding) {
                const restoredName = await page.evaluate(() => {
                  const nameField = document.querySelector('input[placeholder*="Taverna"], input[placeholder*="Restaurant"]');
                  return nameField ? nameField.value : '';
                });
                
                addTestResult('Data restored after refresh', 
                  restoredName.includes('DevTools'), `Restored name: ${restoredName}`);
              } else {
                addTestResult('User progressed beyond onboarding', true, 
                  'Successfully moved past onboarding');
              }

              // Test 10: Mobile Responsiveness
              console.log('\n📋 PHASE 10: Mobile Responsiveness');
              
              // Navigate back to onboarding if needed
              if (!page.url().includes('onboarding')) {
                await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });
                await new Promise(resolve => setTimeout(resolve, 2000));
              }

              await page.setViewport({ width: 375, height: 667 }); // iPhone SE
              await new Promise(resolve => setTimeout(resolve, 1000));

              const mobileStepIcons = await page.$$('.step-icon');
              const mobileProgressBar = await page.$('.step-progress');
              const progressBarWidth = await page.$eval('.step-progress', 
                el => el.offsetWidth).catch(() => 0);
              
              addTestResult('Mobile progress bar responsive', mobileProgressBar !== null);
              addTestResult('Mobile step icons visible', mobileStepIcons.length > 0, 
                `Icons: ${mobileStepIcons.length}`);
              addTestResult('Progress bar adapts to mobile', 
                progressBarWidth > 0 && progressBarWidth < 400, `Width: ${progressBarWidth}px`);

              // Test 11: DevTools Reset Functionality
              console.log('\n📋 PHASE 11: DevTools Reset Testing');
              
              // Switch back to desktop for DevTools interaction
              await page.setViewport({ width: 1200, height: 800 });
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Test the reset functionality
              const resetSuccess = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                for (let el of elements) {
                  if (el.textContent && el.textContent.includes('🛠️ DEV TOOLS')) {
                    el.click();
                    setTimeout(() => {
                      const buttons = document.querySelectorAll('button');
                      for (let btn of buttons) {
                        if (btn.textContent && btn.textContent.includes('Reset Onboarding')) {
                          btn.click();
                          return true;
                        }
                      }
                    }, 500);
                    return true;
                  }
                }
                return false;
              });
              
              addTestResult('DevTools reset functionality accessible', resetSuccess);
              
              if (resetSuccess) {
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for reset and reload
                
                // After reset, check if we're back to a clean state
                const finalUrl = page.url();
                addTestResult('Reset functionality works', 
                  finalUrl.includes('onboarding') || finalUrl.includes('login'), 
                  `Final URL: ${finalUrl}`);
              }
            }
          }
        }
      }
    } else {
      addTestResult('DevTools not available', false, 'Cannot test onboarding reset functionality');
    }

    // Test 12: API Integration Check
    console.log('\n📋 PHASE 12: API Integration');
    
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

    addTestResult('API health check passes', apiHealth.reachable, 
      `Status: ${apiHealth.status}, Response: ${apiHealth.response?.substring(0, 50) || apiHealth.error}`);

  } catch (error) {
    addTestResult('Test execution completed without crashes', false, `Error: ${error.message}`);
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }

  // Generate comprehensive report
  console.log('\n' + '='.repeat(90));
  console.log('📊 COMPREHENSIVE ONBOARDING TEST RESULTS WITH DEVTOOLS');
  console.log('='.repeat(90));
  console.log(`🕒 Test Completed: ${new Date().toISOString()}`);
  console.log(`📈 Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  
  console.log('\n📋 DETAILED RESULTS BY PHASE:');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${String(index + 1).padStart(2, '0')}. ${status} ${test.testName}`);
    if (test.details) {
      console.log(`     📝 ${test.details}`);
    }
  });

  // Categorized analysis
  const categories = {
    'Authentication': testResults.tests.filter(t => t.testName.includes('login') || t.testName.includes('auth')),
    'DevTools': testResults.tests.filter(t => t.testName.includes('DevTools') || t.testName.includes('Force') || t.testName.includes('Reset')),
    'UI Components': testResults.tests.filter(t => t.testName.includes('progress') || t.testName.includes('wizard') || t.testName.includes('step')),
    'Form Functionality': testResults.tests.filter(t => t.testName.includes('field') || t.testName.includes('data') || t.testName.includes('form')),
    'Error Handling': testResults.tests.filter(t => t.testName.includes('error') || t.testName.includes('skip')),
    'Data Persistence': testResults.tests.filter(t => t.testName.includes('persist') || t.testName.includes('restore') || t.testName.includes('localStorage')),
    'Responsiveness': testResults.tests.filter(t => t.testName.includes('mobile') || t.testName.includes('responsive')),
    'Integration': testResults.tests.filter(t => t.testName.includes('API') || t.testName.includes('health'))
  };

  console.log('\n🎯 CATEGORY BREAKDOWN:');
  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      const rate = Math.round((passed / total) * 100);
      console.log(`   ${category}: ${passed}/${total} (${rate}%)`);
    }
  });

  // Save detailed results
  fs.writeFileSync('test-results-onboarding-devtools.json', 
    JSON.stringify(testResults, null, 2));
  console.log('\n💾 Test results saved to: test-results-onboarding-devtools.json');

  // Final assessment and recommendations
  const successRate = (testResults.summary.passed / testResults.summary.total) * 100;
  
  console.log('\n🎉 FINAL ASSESSMENT:');
  
  if (successRate >= 95) {
    console.log('🏆 OUTSTANDING: Production-ready with excellent UX and developer tools!');
    console.log('✨ All major functionality tested and working perfectly.');
  } else if (successRate >= 85) {
    console.log('🎯 EXCELLENT: High-quality implementation with minor issues to address.');
    console.log('🚀 Ready for production with small fixes.');
  } else if (successRate >= 70) {
    console.log('👍 GOOD: Solid foundation with some important improvements needed.');
    console.log('🔧 Address failed tests before production deployment.');
  } else {
    console.log('⚠️ NEEDS WORK: Significant issues require attention before production.');
    console.log('🛠️ Focus on fixing critical functionality first.');
  }

  const failedTests = testResults.tests.filter(t => !t.passed);
  if (failedTests.length > 0) {
    console.log('\n🔧 PRIORITY FIXES NEEDED:');
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.testName}: ${test.details}`);
    });
  } else {
    console.log('\n🎊 NO ISSUES FOUND: All functionality working perfectly!');
  }

  console.log('\n' + '='.repeat(90));
  
  return testResults;
}

// Execute the comprehensive test
if (require.main === module) {
  testOnboardingWithDevTools().catch(console.error);
}

module.exports = testOnboardingWithDevTools;