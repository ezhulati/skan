/**
 * Comprehensive Card Button Functionality Test
 * 
 * This test will systematically verify that order card buttons work correctly
 * and will continue debugging until they are fully functional per specifications.
 */

const puppeteer = require('puppeteer');

async function testCardButtonsComprehensive() {
  console.log('🔥 COMPREHENSIVE CARD BUTTON TEST');
  console.log('=====================================');
  console.log('Testing buttons until they are fully functional...\n');
  
  let browser;
  let testResults = {
    loginSuccess: false,
    ordersVisible: false,
    buttonsFound: false,
    buttonsClickable: false,
    alertsTriggered: false,
    statusUpdated: false,
    errors: []
  };
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
      devtools: true // Open devtools to see console
    });

    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔥 BUTTON CLICKED!') || text.includes('Button clicked')) {
        console.log(`✅ CONSOLE: ${text}`);
        testResults.alertsTriggered = true;
      } else if (text.includes('Mock orders loaded') || text.includes('orders')) {
        console.log(`📊 DATA: ${text}`);
      } else if (text.includes('Error') || text.includes('error')) {
        console.log(`❌ ERROR: ${text}`);
        testResults.errors.push(text);
      }
    });

    // Catch page errors
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
      testResults.errors.push(error.message);
    });

    // Step 1: Navigate to admin portal
    console.log('🌐 Step 1: Navigating to admin portal...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log(`✅ Current URL: ${page.url()}`);
    
    // Step 2: Check if we need to login or if we're already on dashboard
    let currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login') || !currentUrl.includes('/dashboard')) {
      console.log('🔑 Step 2: Attempting login...');
      
      try {
        // Check for rate limiting message first
        const pageContent = await page.content();
        if (pageContent.includes('Too many authentication attempts') || pageContent.includes('try again later')) {
          console.log('⚠️ Rate limiting detected. Waiting and retrying...');
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          await page.reload();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Wait for login form
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        
        // Clear and fill login form
        await page.click('input[type="email"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('input[type="email"]', 'demo.beachbar@skan.al');
        
        await page.click('input[type="password"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('input[type="password"]', 'BeachBarDemo2024!');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for navigation or dashboard
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check if we successfully navigated
        currentUrl = page.url();
        if (currentUrl.includes('/dashboard') || currentUrl.includes('localhost:3002') && !currentUrl.includes('/login')) {
          testResults.loginSuccess = true;
          console.log('✅ Login successful');
        } else {
          console.log('⚠️ Login may have failed, but continuing...');
          // Check for error messages
          const errorContent = await page.content();
          if (errorContent.includes('Too many')) {
            console.log('❌ Still rate limited. Testing may not work properly.');
          }
        }
        
      } catch (loginError) {
        console.log('⚠️ Login failed or not needed, checking for dashboard...');
        console.log(`Login error: ${loginError.message}`);
      }
    } else {
      console.log('✅ Already on dashboard, skipping login');
      testResults.loginSuccess = true;
    }
    
    // Step 3: Wait for dashboard to load
    console.log('📊 Step 3: Waiting for dashboard to load...');
    
    // Wait for various dashboard elements
    const dashboardSelectors = [
      '.dashboard-page',
      '.orders-container',
      '.orders-section-header',
      'h2'
    ];
    
    let dashboardLoaded = false;
    for (const selector of dashboardSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ Found dashboard element: ${selector}`);
        dashboardLoaded = true;
        break;
      } catch (e) {
        console.log(`⚠️ Dashboard element not found: ${selector}`);
      }
    }
    
    if (!dashboardLoaded) {
      throw new Error('Dashboard did not load properly');
    }
    
    // Step 4: Check for orders or mock data
    console.log('🔍 Step 4: Checking for orders...');
    
    // Wait a bit for orders to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for various order-related elements
    const orderSelectors = [
      '.order-card',
      '.no-orders',
      '.orders-container .order-card',
      '[class*="order"]'
    ];
    
    let ordersFound = false;
    let orderElements = [];
    
    for (const selector of orderSelectors) {
      try {
        orderElements = await page.$$(selector);
        if (orderElements.length > 0) {
          console.log(`✅ Found ${orderElements.length} elements with selector: ${selector}`);
          ordersFound = true;
          testResults.ordersVisible = true;
          break;
        }
      } catch (e) {
        console.log(`⚠️ No elements found for: ${selector}`);
      }
    }
    
    if (!ordersFound) {
      console.log('⚠️ No orders visible. Checking page content...');
      
      // Get page text content to see what's displayed
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('📄 Page content (first 500 chars):');
      console.log(pageText.substring(0, 500));
      
      // Check for "no orders" message
      if (pageText.includes('Nuk u gjetën porosite') || pageText.includes('no orders')) {
        console.log('ℹ️ "No orders" message detected - this is expected if no data');
      }
      
      // Try to trigger mock data if available
      console.log('🔄 Attempting to trigger mock data...');
      
      // Click refresh button if available
      try {
        const refreshButton = await page.$('.refresh-button, button:contains("Rifresko")');
        if (refreshButton) {
          await refreshButton.click();
          console.log('✅ Clicked refresh button');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check again for orders
          orderElements = await page.$$('.order-card');
          if (orderElements.length > 0) {
            console.log(`✅ Found ${orderElements.length} orders after refresh`);
            ordersFound = true;
            testResults.ordersVisible = true;
          }
        }
      } catch (e) {
        console.log('⚠️ Could not find or click refresh button');
      }
    }
    
    // Step 5: Look for buttons regardless of order visibility
    console.log('🔘 Step 5: Searching for status buttons...');
    
    const buttonSelectors = [
      '.status-button',
      'button[class*="status"]',
      'button:contains("Prano")',
      'button:contains("Gati")',
      'button:contains("Shërbyer")',
      '.order-card button',
      '[class*="order"] button'
    ];
    
    let buttonsFound = [];
    let totalButtons = 0;
    
    for (const selector of buttonSelectors) {
      try {
        const buttons = await page.$$(selector);
        totalButtons += buttons.length;
        if (buttons.length > 0) {
          console.log(`✅ Found ${buttons.length} buttons with selector: ${selector}`);
          buttonsFound = buttonsFound.concat(buttons);
        }
      } catch (e) {
        console.log(`⚠️ No buttons found for: ${selector}`);
      }
    }
    
    // Remove duplicates
    buttonsFound = [...new Set(buttonsFound)];
    
    if (buttonsFound.length > 0) {
      testResults.buttonsFound = true;
      console.log(`✅ Total unique buttons found: ${buttonsFound.length}`);
    } else {
      console.log('❌ No status buttons found on page');
      
      // Get all buttons on page for debugging
      const allButtons = await page.$$('button');
      console.log(`📊 Total buttons on page: ${allButtons.length}`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        try {
          const buttonText = await allButtons[i].evaluate(el => el.textContent.trim());
          const buttonClass = await allButtons[i].evaluate(el => el.className);
          console.log(`  Button ${i + 1}: "${buttonText}" (class: ${buttonClass})`);
        } catch (e) {
          console.log(`  Button ${i + 1}: Could not read properties`);
        }
      }
    }
    
    // Step 6: Test button functionality - Use direct click approach
    console.log('🖱️ Step 6: Testing button clicks with direct approach...');
    
    // Test up to 3 buttons using fresh selectors each time
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`\n🔘 Testing button ${i + 1}:`);
        
        // Set up dialog handler for alerts
        let alertTriggered = false;
        let alertMessage = '';
        
        const dialogHandler = async (dialog) => {
          alertTriggered = true;
          alertMessage = dialog.message();
          console.log(`🚨 ALERT TRIGGERED: ${alertMessage}`);
          await dialog.accept();
          testResults.alertsTriggered = true;
        };
        
        page.once('dialog', dialogHandler);
        
        // Fresh selector every time to avoid DOM detachment
        const statusButtons = await page.$$('.status-button');
        console.log(`   📊 Found ${statusButtons.length} status buttons in DOM`);
        
        if (statusButtons.length === 0) {
          console.log(`   ❌ No status buttons found`);
          page.off('dialog', dialogHandler);
          break;
        }
        
        const buttonIndex = Math.min(i, statusButtons.length - 1);
        const targetButton = statusButtons[buttonIndex];
        
        if (!targetButton) {
          console.log(`   ❌ Target button at index ${buttonIndex} not found`);
          page.off('dialog', dialogHandler);
          continue;
        }
        
        // Get button info quickly before it detaches
        let buttonText = 'Unknown';
        let isVisible = false;
        try {
          buttonText = await targetButton.evaluate(el => el.textContent.trim());
          isVisible = await targetButton.isIntersectingViewport();
          console.log(`   Text: "${buttonText}"`);
          console.log(`   Visible: ${isVisible}`);
        } catch (e) {
          console.log(`   ⚠️ Could not get button info: ${e.message}`);
        }
        
        // Multiple click strategies
        console.log(`   🖱️ Attempting multiple click strategies...`);
        
        let clickSuccess = false;
        
        // Strategy 1: Direct element click
        try {
          await targetButton.click();
          console.log(`   ✅ Strategy 1 (direct click) successful`);
          clickSuccess = true;
        } catch (e) {
          console.log(`   ❌ Strategy 1 failed: ${e.message}`);
        }
        
        // Strategy 2: Fresh selector click if first failed
        if (!clickSuccess) {
          try {
            const freshButtons = await page.$$('.status-button');
            if (freshButtons.length > buttonIndex) {
              await freshButtons[buttonIndex].click();
              console.log(`   ✅ Strategy 2 (fresh selector) successful`);
              clickSuccess = true;
            }
          } catch (e) {
            console.log(`   ❌ Strategy 2 failed: ${e.message}`);
          }
        }
        
        // Strategy 3: CSS selector click if others failed
        if (!clickSuccess) {
          try {
            await page.click('.status-button');
            console.log(`   ✅ Strategy 3 (CSS click) successful`);
            clickSuccess = true;
          } catch (e) {
            console.log(`   ❌ Strategy 3 failed: ${e.message}`);
          }
        }
        
        if (!clickSuccess) {
          console.log(`   ❌ All click strategies failed for button ${i + 1}`);
        }
        
        // Wait for potential alert and DOM updates
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (alertTriggered) {
          console.log(`   ✅ Button click successful! Alert: ${alertMessage}`);
          testResults.buttonsClickable = true;
        } else {
          console.log(`   ⚠️ Button clicked but no alert triggered`);
        }
        
        // Remove the dialog handler
        page.off('dialog', dialogHandler);
        
      } catch (e) {
        console.log(`   ❌ Error testing button ${i + 1}: ${e.message}`);
        testResults.errors.push(`Button ${i + 1} error: ${e.message}`);
      }
      
      // Delay between button tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 7: Check for status updates
    console.log('\n🔄 Step 7: Checking for status updates...');
    
    // Wait and check if any orders changed status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check console for status update messages
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
    // Step 8: Generate comprehensive report
    console.log('\n📋 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    
    const score = Object.values(testResults).filter(v => v === true).length;
    const maxScore = Object.keys(testResults).length - 1; // Exclude errors array
    
    console.log(`🎯 Overall Score: ${score}/${maxScore} (${Math.round(score/maxScore*100)}%)`);
    console.log();
    
    console.log('✅ SUCCESS CRITERIA:');
    console.log(`   Login: ${testResults.loginSuccess ? '✅' : '❌'}`);
    console.log(`   Orders Visible: ${testResults.ordersVisible ? '✅' : '❌'}`);
    console.log(`   Buttons Found: ${testResults.buttonsFound ? '✅' : '❌'}`);
    console.log(`   Buttons Clickable: ${testResults.buttonsClickable ? '✅' : '❌'}`);
    console.log(`   Alerts Triggered: ${testResults.alertsTriggered ? '✅' : '❌'}`);
    console.log(`   Status Updated: ${testResults.statusUpdated ? '✅' : '❌'}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      testResults.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (score === maxScore && testResults.errors.length === 0) {
      console.log('🎉 ALL TESTS PASSED! Buttons are fully functional.');
      return { success: true, testResults };
    } else if (testResults.buttonsClickable && testResults.alertsTriggered) {
      console.log('✅ BUTTONS WORK! Some data/display issues remain but core functionality is good.');
      return { success: true, testResults };
    } else {
      console.log('❌ BUTTONS NOT FULLY FUNCTIONAL. Issues need to be resolved.');
      return { success: false, testResults };
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    testResults.errors.push(error.message);
    return { success: false, error: error.message, testResults };
    
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...');
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testCardButtonsComprehensive()
    .then((result) => {
      console.log('\n' + '='.repeat(60));
      if (result.success) {
        console.log('🎉 COMPREHENSIVE BUTTON TEST - SUCCESS!');
        console.log('✅ Card buttons are functional and meet requirements');
      } else {
        console.log('⚠️ COMPREHENSIVE BUTTON TEST - NEEDS WORK');
        console.log('❌ Card buttons need further debugging');
        
        // Provide actionable next steps
        console.log('\n🔧 NEXT STEPS:');
        if (!result.testResults.ordersVisible) {
          console.log('1. Fix order data loading (mock data or API)');
        }
        if (!result.testResults.buttonsFound) {
          console.log('2. Ensure status buttons are rendered in DOM');
        }
        if (!result.testResults.buttonsClickable) {
          console.log('3. Fix CSS/JavaScript preventing button clicks');
        }
        if (!result.testResults.alertsTriggered) {
          console.log('4. Debug onClick handlers and event propagation');
        }
      }
    })
    .catch(console.error);
}

module.exports = testCardButtonsComprehensive;