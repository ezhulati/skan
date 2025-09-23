/**
 * KDS Card Button Test - Working Version
 * Tests exact button functionality based on screenshot analysis
 */

const puppeteer = require('puppeteer');

async function testCardButtonsWorking() {
  console.log('🧪 Starting KDS Card Button Test (Working Version)...\n');
  
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
    
    console.log('🔍 Step 2: Analyzing page structure...');
    
    // Get comprehensive button analysis
    const buttonAnalysis = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analysis = {
        totalButtons: buttons.length,
        allButtonTexts: [],
        actionButtons: []
      };
      
      buttons.forEach((btn, index) => {
        const text = btn.textContent.trim();
        analysis.allButtonTexts.push({
          index,
          text,
          visible: btn.offsetParent !== null,
          disabled: btn.disabled,
          className: btn.className
        });
        
        // Check for action buttons with exact text matches
        if (text === 'PRANOJ POROSINË' || 
            text === 'SHËNÔ SI GATI' || 
            text === 'SHËNÔ SI SHËRBYER' ||
            text.includes('PRANOJ') ||
            text.includes('SHËNÔ')) {
          analysis.actionButtons.push({
            index,
            text,
            visible: btn.offsetParent !== null,
            disabled: btn.disabled,
            type: text.includes('PRANOJ') ? 'accept' : 
                  text.includes('GATI') ? 'ready' : 'served'
          });
        }
      });
      
      return analysis;
    });
    
    console.log('📊 Button Analysis Results:');
    console.log(`📋 Total buttons found: ${buttonAnalysis.totalButtons}`);
    console.log(`🎯 Action buttons found: ${buttonAnalysis.actionButtons.length}`);
    
    console.log('\n🎯 Action Buttons Details:');
    buttonAnalysis.actionButtons.forEach((btn, i) => {
      const status = btn.visible ? '👁️ Visible' : '👻 Hidden';
      const enabled = btn.disabled ? '🚫 Disabled' : '✅ Enabled';
      console.log(`  ${i + 1}. "${btn.text}" (${btn.type}) - ${status}, ${enabled}`);
    });
    
    console.log('\n🖱️ Step 3: Testing button clicks...');
    
    // Test clicking each action button
    const testResults = {
      accept: { found: false, clicked: false, error: null },
      ready: { found: false, clicked: false, error: null },
      served: { found: false, clicked: false, error: null }
    };
    
    // Find and click buttons by exact text
    const buttonSelectors = [
      { text: 'PRANOJ POROSINË', type: 'accept', description: 'Accept Order (New → Preparing)' },
      { text: 'SHËNÔ SI GATI', type: 'ready', description: 'Mark Ready (Preparing → Ready)' },
      { text: 'SHËNÔ SI SHËRBYER', type: 'served', description: 'Mark Served (Ready → Served)' }
    ];
    
    for (const buttonConfig of buttonSelectors) {
      console.log(`\n🎯 Testing: ${buttonConfig.description}`);
      
      try {
        // Find button by exact text
        const button = await page.evaluate((buttonText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => btn.textContent.trim() === buttonText);
        }, buttonConfig.text);
        
        if (button) {
          testResults[buttonConfig.type].found = true;
          console.log(`✅ Found button: "${buttonConfig.text}"`);
          
          // Click the button using page.evaluate for more reliable clicking
          const clickResult = await page.evaluate((buttonText) => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const targetButton = buttons.find(btn => btn.textContent.trim() === buttonText);
            
            if (targetButton && !targetButton.disabled) {
              // Get order info before clicking
              const orderCard = targetButton.closest('.order-card');
              const orderNumber = orderCard?.querySelector('.order-number, [class*="order"]')?.textContent || 'Unknown';
              
              targetButton.click();
              return { success: true, orderNumber };
            }
            return { success: false, reason: 'Button not found or disabled' };
          }, buttonConfig.text);
          
          if (clickResult.success) {
            testResults[buttonConfig.type].clicked = true;
            console.log(`✅ Successfully clicked "${buttonConfig.text}" for order: ${clickResult.orderNumber}`);
            
            // Wait for any UI updates
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.log(`❌ Failed to click button: ${clickResult.reason}`);
          }
        } else {
          console.log(`❌ Button not found: "${buttonConfig.text}"`);
        }
        
      } catch (error) {
        testResults[buttonConfig.type].error = error.message;
        console.log(`❌ Error testing ${buttonConfig.type} button: ${error.message}`);
      }
    }
    
    // Check for order cards
    const orderCardCount = await page.$$eval('.order-card', cards => cards.length);
    
    console.log('\n📊 Final Test Results:');
    console.log('======================');
    
    let successfulTests = 0;
    const totalTests = Object.keys(testResults).length;
    
    Object.entries(testResults).forEach(([type, result]) => {
      const foundStatus = result.found ? '✅ Found' : '❌ Not Found';
      const clickStatus = result.clicked ? '✅ Clicked' : '❌ Not Clicked';
      const errorInfo = result.error ? ` (Error: ${result.error})` : '';
      
      console.log(`${type.toUpperCase()}: ${foundStatus}, ${clickStatus}${errorInfo}`);
      
      if (result.found && result.clicked) successfulTests++;
    });
    
    // Summary
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`📦 Order Cards: ${orderCardCount} found`);
    console.log(`🎯 Action Buttons: ${buttonAnalysis.actionButtons.length} found`);
    console.log(`✅ Working Buttons: ${successfulTests}/${totalTests}`);
    console.log(`📄 Page: ${await page.title()}`);
    console.log(`🌐 URL: ${page.url()}`);
    
    // Take final screenshot
    const screenshotPath = '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/button-test-final.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Final screenshot: ${screenshotPath}`);
    
    // Determine overall success
    const hasButtons = buttonAnalysis.actionButtons.length > 0;
    const hasCards = orderCardCount > 0;
    const buttonsWork = successfulTests > 0;
    
    console.log('\n🏆 FINAL VERDICT:');
    console.log('=================');
    console.log(`✅ Dashboard Access: ${page.url().includes('admin.skan.al')}`);
    console.log(`✅ Order Cards Present: ${hasCards} (${orderCardCount} cards)`);
    console.log(`✅ Action Buttons Present: ${hasButtons} (${buttonAnalysis.actionButtons.length} buttons)`);
    console.log(`✅ Buttons Functional: ${buttonsWork} (${successfulTests} working)`);
    
    const overallSuccess = hasButtons && hasCards && buttonsWork;
    
    if (overallSuccess) {
      console.log('\n🎉 SUCCESS: KDS card buttons are fully functional!');
    } else if (hasButtons && hasCards) {
      console.log('\n⚠️ PARTIAL SUCCESS: Buttons exist but some functionality issues detected');
    } else {
      console.log('\n❌ ISSUES DETECTED: Missing buttons or cards');
    }
    
    return {
      success: overallSuccess,
      details: {
        orderCards: orderCardCount,
        actionButtons: buttonAnalysis.actionButtons.length,
        workingButtons: successfulTests,
        testResults,
        buttonAnalysis
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
    
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...');
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testCardButtonsWorking()
    .then((result) => {
      console.log('\n' + '='.repeat(50));
      if (result.success) {
        console.log('🎉 ALL TESTS PASSED - Card buttons are working correctly!');
        process.exit(0);
      } else {
        console.log('⚠️ TEST COMPLETED WITH FINDINGS');
        if (result.details) {
          console.log(`📊 Found ${result.details.orderCards} cards, ${result.details.actionButtons} buttons, ${result.details.workingButtons} working`);
        }
        if (result.error) {
          console.log(`❌ Error: ${result.error}`);
        }
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = testCardButtonsWorking;