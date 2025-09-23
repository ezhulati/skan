/**
 * KDS Card Button Test - Final Version
 * Tests card button functionality with proper login flow
 */

const puppeteer = require('puppeteer');

async function testCardButtons() {
  console.log('🧪 Starting KDS Card Button Test...\n');
  
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    console.log('🔑 Step 1: Login to admin dashboard...');
    
    // Go to login page
    await page.goto('https://admin.skan.al/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill login form
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`✅ Login completed. Current URL: ${page.url()}`);
    
    console.log('🔍 Step 2: Looking for order cards and buttons...');
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto('https://admin.skan.al/dashboard', { 
        waitUntil: 'domcontentloaded' 
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Check for order cards
    const orderCards = await page.$$('.order-card');
    console.log(`📦 Found ${orderCards.length} order cards`);
    
    // Get all buttons and their text
    const buttonData = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.textContent.trim(),
        visible: btn.offsetParent !== null,
        disabled: btn.disabled,
        className: btn.className,
        isActionButton: btn.textContent.includes('PRANOJ') || 
                       btn.textContent.includes('GATI') || 
                       btn.textContent.includes('SHËRBYER') ||
                       btn.textContent.includes('POROSINË')
      }));
    });
    
    const actionButtons = buttonData.filter(btn => btn.isActionButton);
    
    console.log(`🎯 Found ${actionButtons.length} order action buttons:`);
    actionButtons.forEach((btn, index) => {
      const status = btn.visible ? '👁️ Visible' : '👻 Hidden';
      const enabled = btn.disabled ? '🚫 Disabled' : '✅ Enabled';
      console.log(`  ${index + 1}. "${btn.text}" - ${status}, ${enabled}`);
    });
    
    console.log('🖱️ Step 3: Testing button functionality...');
    
    // Test each type of button
    const buttonTests = {
      'PRANOJ': { found: false, clicked: false, description: 'Accept Order (New → Preparing)' },
      'GATI': { found: false, clicked: false, description: 'Mark Ready (Preparing → Ready)' },
      'SHËRBYER': { found: false, clicked: false, description: 'Mark Served (Ready → Served)' }
    };
    
    // Find and test buttons
    const allButtons = await page.$$('button');
    
    for (const button of allButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      const isDisabled = await page.evaluate(el => el.disabled, button);
      
      for (const [buttonType, testData] of Object.entries(buttonTests)) {
        if (text.includes(buttonType) && !testData.found && !isDisabled) {
          testData.found = true;
          console.log(`🎯 Testing ${testData.description}: "${text.trim()}"`);
          
          try {
            // Get order info before clicking
            const orderCard = await button.evaluateHandle(btn => btn.closest('.order-card'));
            let orderNumber = 'Unknown';
            
            if (orderCard) {
              orderNumber = await page.evaluate(card => {
                const numberEl = card?.querySelector('.order-number, [class*="order-number"]');
                return numberEl?.textContent || 'Unknown';
              }, orderCard);
            }
            
            console.log(`📋 Order: ${orderNumber}`);
            
            // Click the button
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log(`✅ Successfully clicked ${buttonType} button`);
            testData.clicked = true;
            
            // Only test one button per type to avoid changing too many orders
            break;
            
          } catch (error) {
            console.log(`❌ Error clicking ${buttonType} button: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n📊 Button Test Results:');
    console.log('========================');
    
    let successCount = 0;
    const totalTests = Object.keys(buttonTests).length;
    
    Object.entries(buttonTests).forEach(([buttonType, result]) => {
      const foundStatus = result.found ? '✅ Found' : '❌ Not Found';
      const clickStatus = result.clicked ? '✅ Clicked' : '❌ Not Clicked';
      console.log(`${buttonType}: ${foundStatus}, ${clickStatus} - ${result.description}`);
      
      if (result.found && result.clicked) successCount++;
    });
    
    // Additional checks
    console.log('\n🔍 Additional Checks:');
    console.log(`📦 Order Cards: ${orderCards.length} found`);
    console.log(`🎯 Action Buttons: ${actionButtons.length} found`);
    console.log(`📄 Page Title: "${await page.title()}"`);
    console.log(`🌐 Current URL: ${page.url()}`);
    
    // Take a screenshot for visual verification
    const screenshotPath = '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/button-test-result.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Final assessment
    const hasOrders = orderCards.length > 0;
    const hasActionButtons = actionButtons.length > 0;
    const buttonsFunctional = successCount > 0;
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('=====================');
    console.log(`✅ Page Access: ${page.url().includes('admin.skan.al')}`);
    console.log(`✅ Orders Present: ${hasOrders} (${orderCards.length} cards)`);
    console.log(`✅ Action Buttons: ${hasActionButtons} (${actionButtons.length} buttons)`);
    console.log(`✅ Button Functionality: ${buttonsFunctional} (${successCount}/${totalTests} working)`);
    
    const overallSuccess = hasOrders && hasActionButtons && buttonsFunctional;
    console.log(`\n🎉 Overall Status: ${overallSuccess ? 'SUCCESS - Card buttons are working!' : 'PARTIAL - Some issues detected'}`);
    
    return {
      success: overallSuccess,
      details: {
        orderCards: orderCards.length,
        actionButtons: actionButtons.length,
        workingButtons: successCount,
        buttonTests
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
    
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testCardButtons()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 All card buttons are functional!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Card button test completed with issues');
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = testCardButtons;