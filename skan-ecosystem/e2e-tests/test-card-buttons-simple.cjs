/**
 * Simple KDS Card Button Test
 * Quick verification that card buttons exist and are clickable
 */

const puppeteer = require('puppeteer');

async function testCardButtonsSimple() {
  console.log('🧪 Starting Simple KDS Card Button Test...\n');
  
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    console.log('🔗 Navigating to admin dashboard...');
    await page.goto('https://admin.skan.al', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    // Wait a bit for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔍 Searching for order card buttons...');
    
    // Find all buttons on the page
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.textContent.trim(),
        visible: btn.offsetParent !== null,
        disabled: btn.disabled,
        className: btn.className
      }));
    });
    
    console.log(`📋 Found ${allButtons.length} total buttons on page`);
    
    // Filter for order action buttons
    const actionButtons = allButtons.filter(btn => 
      btn.text.includes('PRANOJ') || 
      btn.text.includes('GATI') || 
      btn.text.includes('SHËRBYER') ||
      btn.text.includes('POROSINË')
    );
    
    console.log('\n🎯 Order Action Buttons Found:');
    actionButtons.forEach((btn, index) => {
      const status = btn.visible ? '👁️ Visible' : '👻 Hidden';
      const enabled = btn.disabled ? '🚫 Disabled' : '✅ Enabled';
      console.log(`  ${index + 1}. "${btn.text}" - ${status}, ${enabled}`);
    });
    
    // Test clicking buttons if they exist
    if (actionButtons.length > 0) {
      console.log('\n🖱️ Testing button clicks...');
      
      // Find clickable buttons on the page
      const clickableButtons = await page.$$('button:not([disabled])');
      let clickedButtons = 0;
      
      for (const button of clickableButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        
        if (text.includes('PRANOJ') || text.includes('GATI') || text.includes('SHËRBYER')) {
          console.log(`🖱️ Clicking button: "${text.trim()}"`);
          
          try {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`✅ Successfully clicked "${text.trim()}"`);
            clickedButtons++;
            
            // Only test one button to avoid changing too many states
            break;
            
          } catch (clickError) {
            console.log(`❌ Failed to click "${text.trim()}": ${clickError.message}`);
          }
        }
      }
      
      console.log(`\n🎯 Clicked ${clickedButtons} buttons successfully`);
      
    } else {
      console.log('\n⚠️ No order action buttons found');
    }
    
    // Check for order cards
    const orderCards = await page.$$('.order-card');
    console.log(`\n📦 Found ${orderCards.length} order cards on page`);
    
    // Check page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`\n📄 Page: "${title}" at ${url}`);
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Page loaded: ${url.includes('admin.skan.al')}`);
    console.log(`✅ Buttons found: ${allButtons.length > 0}`);
    console.log(`✅ Action buttons: ${actionButtons.length}`);
    console.log(`✅ Order cards: ${orderCards.length}`);
    
    const success = actionButtons.length > 0 && orderCards.length > 0;
    console.log(`\n🎉 Overall Status: ${success ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
    
    return success;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testCardButtonsSimple()
    .then((success) => {
      console.log(success ? '\n🎉 Test completed successfully!' : '\n⚠️ Test completed with issues');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = testCardButtonsSimple;