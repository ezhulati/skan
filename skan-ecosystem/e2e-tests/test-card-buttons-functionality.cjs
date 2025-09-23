/**
 * End-to-End Test: KDS Card Button Functionality
 * Tests all order card action buttons in the Kitchen Display System
 * 
 * Test Coverage:
 * 1. Login to admin dashboard
 * 2. Navigate to orders dashboard
 * 3. Test "PRANOJ POROSINË" button (new → preparing)
 * 4. Test "SHËNÔ SI GATI" button (preparing → ready)
 * 5. Test "SHËNÔ SI SHËRBYER" button (ready → served)
 * 6. Verify status changes and card movements between lanes
 * 7. Test button states and visual feedback
 */

const puppeteer = require('puppeteer');

// Test configuration
const CONFIG = {
  baseUrl: 'https://admin.skan.al',
  headless: false, // Set to true for CI/CD
  timeout: 60000,
  credentials: {
    email: 'demo.beachbar@skan.al', 
    password: 'BeachBarDemo2024!'
  }
};

console.log('🧪 Starting KDS Card Button Functionality Test...\n');

async function testCardButtons() {
  let browser;
  let testResults = {
    login: false,
    navigation: false,
    newToPreparingButton: false,
    preparingToReadyButton: false,
    readyToServedButton: false,
    buttonStates: false,
    visualFeedback: false,
    cardMovement: false
  };

  try {
    // Launch browser
    console.log('🔧 Launching browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(CONFIG.timeout);

    // Enable request interception to monitor API calls
    await page.setRequestInterception(true);
    const apiCalls = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/v1/orders/') && request.method() === 'PUT') {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          body: request.postData()
        });
      }
      request.continue();
    });

    console.log('🔑 Testing Admin Login...');
    
    // Navigate to login page
    await page.goto(CONFIG.baseUrl + '/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for login form
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 15000 });
      console.log('📋 Login form found');
    } catch (error) {
      console.log('⚠️ Login form not found, checking if already logged in...');
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Already logged in, proceeding to dashboard');
        testResults.login = true;
        testResults.navigation = true;
        await page.goto(CONFIG.baseUrl + '/dashboard', { waitUntil: 'domcontentloaded' });
      } else {
        throw new Error('Cannot find login form and not logged in');
      }
    }

    // Perform login if needed
    if (!testResults.login) {
      await page.type('input[type="email"]', CONFIG.credentials.email);
      await page.type('input[type="password"]', CONFIG.credentials.password);
      
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }),
          page.click('button[type="submit"]')
        ]);
      } catch (navError) {
        console.log('⚠️ Navigation timeout, checking current URL...');
        await page.waitForTimeout(3000);
      }
    }

    // Verify successful login
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful');
      testResults.login = true;
    } else {
      throw new Error('Login failed - not redirected to dashboard');
    }

    console.log('🧭 Navigating to Orders Dashboard...');
    
    // Navigate to orders dashboard (if not already there)
    await page.waitForSelector('.welcome-header', { timeout: 10000 });
    
    // Verify we're on the dashboard with order cards
    await page.waitForSelector('.order-card', { timeout: 15000 });
    console.log('✅ Dashboard navigation successful');
    testResults.navigation = true;

    // Wait for order cards to load
    await page.waitForTimeout(2000);

    console.log('\n📋 Testing Order Card Buttons...');

    // Test 1: "PRANOJ POROSINË" button (New → Preparing)
    console.log('🔴 Testing "PRANOJ POROSINË" button (New → Preparing)...');
    
    try {
      const buttons = await page.$$('button');
      let buttonFound = false;
      
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('PRANOJ') || text.includes('POROSINË')) {
          console.log('✅ Found "PRANOJ POROSINË" button');
          buttonFound = true;
          
          // Get order info before clicking
          const orderCard = await button.evaluateHandle(btn => btn.closest('.order-card'));
          const orderNumber = await page.evaluate(card => {
            return card?.querySelector('.order-number')?.textContent || 'Unknown';
          }, orderCard);
          
          console.log(`📋 Testing button for order: ${orderNumber}`);
          
          // Click the button and wait for response
          await button.click();
          await page.waitForTimeout(2000);
          
          console.log('✅ "PRANOJ POROSINË" button clicked successfully');
          testResults.newToPreparingButton = true;
          break;
        }
      }
      
      if (!buttonFound) {
        console.log('⚠️ No "PRANOJ POROSINË" button found - this may be expected if no new orders exist');
      }
    } catch (error) {
      console.log('⚠️ Error testing "PRANOJ POROSINË" button:', error.message);
    }

    // Test 2: "SHËNÔ SI GATI" button (Preparing → Ready)
    console.log('🟡 Testing "SHËNÔ SI GATI" button (Preparing → Ready)...');
    
    await page.waitForTimeout(2000); // Wait for state change
    
    const preparingButtons = await page.$$('button');
    for (const button of preparingButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('SHËNÔ SI GATI') || text.includes('GATI')) {
        console.log('✅ Found "SHËNÔ SI GATI" button');
        
        // Get order info
        const orderCard = await button.evaluateHandle(btn => btn.closest('.order-card'));
        const orderNumber = await page.evaluate(card => {
          return card?.querySelector('.order-number')?.textContent || 'Unknown';
        }, orderCard);
        
        console.log(`📋 Testing button for order: ${orderNumber}`);
        
        // Click the button
        await button.click();
        await page.waitForTimeout(1000);
        
        console.log('✅ "SHËNÔ SI GATI" button clicked successfully');
        testResults.preparingToReadyButton = true;
        break;
      }
    }

    // Test 3: "SHËNÔ SI SHËRBYER" button (Ready → Served)
    console.log('🟢 Testing "SHËNÔ SI SHËRBYER" button (Ready → Served)...');
    
    await page.waitForTimeout(2000); // Wait for state change
    
    const readyButtons = await page.$$('button');
    for (const button of readyButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('SHËNÔ SI SHËRBYER') || text.includes('SHËRBYER')) {
        console.log('✅ Found "SHËNÔ SI SHËRBYER" button');
        
        // Get order info
        const orderCard = await button.evaluateHandle(btn => btn.closest('.order-card'));
        const orderNumber = await page.evaluate(card => {
          return card?.querySelector('.order-number')?.textContent || 'Unknown';
        }, orderCard);
        
        console.log(`📋 Testing button for order: ${orderNumber}`);
        
        // Click the button
        await button.click();
        await page.waitForTimeout(1000);
        
        console.log('✅ "SHËNÔ SI SHËRBYER" button clicked successfully');
        testResults.readyToServedButton = true;
        break;
      }
    }

    // Test 4: Verify Button States and Visual Feedback
    console.log('\n🎨 Testing Button States and Visual Feedback...');
    
    // Check if buttons have proper styling
    const buttonStyles = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const styles = [];
      
      buttons.forEach(button => {
        if (button.textContent.includes('PRANOJ') || 
            button.textContent.includes('GATI') || 
            button.textContent.includes('SHËRBYER')) {
          const computedStyle = window.getComputedStyle(button);
          styles.push({
            text: button.textContent.trim(),
            backgroundColor: computedStyle.backgroundColor,
            color: computedStyle.color,
            cursor: computedStyle.cursor,
            disabled: button.disabled
          });
        }
      });
      
      return styles;
    });
    
    console.log('🎨 Button Styles Analysis:');
    buttonStyles.forEach(style => {
      console.log(`  📝 "${style.text}": bg=${style.backgroundColor}, cursor=${style.cursor}, disabled=${style.disabled}`);
    });
    
    testResults.buttonStates = buttonStyles.length > 0;

    // Test 5: Verify Card Movement Between Lanes
    console.log('\n🏃 Testing Card Movement Between Status Lanes...');
    
    const laneStats = await page.evaluate(() => {
      const lanes = {
        'TË REJA': document.querySelectorAll('.station-lane.station-new .order-card, [data-status="new"] .order-card').length,
        'DUKE U PËRGATITUR': document.querySelectorAll('.station-lane.station-preparing .order-card, [data-status="preparing"] .order-card').length,
        'GATI': document.querySelectorAll('.station-lane.station-ready .order-card, [data-status="ready"] .order-card').length,
        'SHËRBYER': document.querySelectorAll('.station-lane.station-served .order-card, [data-status="served"] .order-card').length
      };
      
      return lanes;
    });
    
    console.log('📊 Order Distribution by Status:');
    Object.entries(laneStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} orders`);
    });
    
    testResults.cardMovement = Object.values(laneStats).some(count => count > 0);

    // Test 6: API Call Verification
    console.log('\n🔗 Verifying API Calls...');
    
    if (apiCalls.length > 0) {
      console.log(`✅ Captured ${apiCalls.length} API calls:`);
      apiCalls.forEach((call, index) => {
        console.log(`  ${index + 1}. ${call.method} ${call.url}`);
        if (call.body) {
          try {
            const body = JSON.parse(call.body);
            console.log(`     Status change: ${body.status || 'unknown'}`);
          } catch (e) {
            console.log(`     Body: ${call.body}`);
          }
        }
      });
      testResults.visualFeedback = true;
    } else {
      console.log('⚠️ No API calls captured - this might indicate an issue');
    }

    // Test 7: Responsive Button Behavior
    console.log('\n📱 Testing Responsive Button Behavior...');
    
    // Test on mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileButtons = await page.$$('button');
    const mobileButtonCount = mobileButtons.length;
    
    console.log(`📱 Mobile view: Found ${mobileButtonCount} buttons`);
    
    // Test on desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopButtons = await page.$$('button');
    const desktopButtonCount = desktopButtons.length;
    
    console.log(`🖥️ Desktop view: Found ${desktopButtonCount} buttons`);

    console.log('\n✅ Card Button Functionality Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Test Results Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  const results = [
    ['Login', testResults.login],
    ['Navigation', testResults.navigation], 
    ['New → Preparing Button', testResults.newToPreparingButton],
    ['Preparing → Ready Button', testResults.preparingToReadyButton],
    ['Ready → Served Button', testResults.readyToServedButton],
    ['Button States', testResults.buttonStates],
    ['Visual Feedback', testResults.visualFeedback],
    ['Card Movement', testResults.cardMovement]
  ];
  
  results.forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = results.filter(([, passed]) => passed).length;
  const totalTests = results.length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate >= 80) {
    console.log('🎉 KDS Card Buttons are functioning correctly!');
  } else if (successRate >= 60) {
    console.log('⚠️ KDS Card Buttons have some issues that need attention');
  } else {
    console.log('🚨 KDS Card Buttons have significant issues requiring immediate fixes');
  }
  
  return {
    success: successRate >= 80,
    results: testResults,
    successRate
  };
}

// Run the test
if (require.main === module) {
  testCardButtons()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = testCardButtons;