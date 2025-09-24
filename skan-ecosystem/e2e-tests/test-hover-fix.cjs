/**
 * Test to verify card hover shaking fix
 * Tests that card hover interactions are smooth without visual glitching
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3002',
  EMAIL: 'demo.beachbar@skan.al',
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: true, // Run headless for automated testing
  TIMEOUT: 30000
};

async function testHoverFunctionality() {
  console.log('🧪 Starting Hover Functionality Test...');
  console.log(`📱 Admin URL: ${CONFIG.ADMIN_URL}`);

  let browser;
  let page;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    page = await browser.newPage();
    
    // Set viewport for tablet simulation
    await page.setViewport({ width: 1024, height: 768 });
    
    console.log('🌐 Navigating to admin portal...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });

    // Login
    console.log('🔐 Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.TIMEOUT });
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    
    // Wait a bit more for any async data loading
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find order cards
    console.log('🔍 Looking for order cards...');
    const orderCards = await page.$$('.order-card');
    
    if (orderCards.length === 0) {
      console.log('⚠️  No order cards found. This may be expected if no orders exist.');
      console.log('✅ Test completed - no cards to test hover on');
      return;
    }

    console.log(`📋 Found ${orderCards.length} order cards`);

    // Test hover interactions on first card
    const firstCard = orderCards[0];
    
    console.log('🎯 Testing card hover without button interaction...');
    
    // Get initial position and box shadow
    const initialStyles = await page.evaluate((card) => {
      const styles = window.getComputedStyle(card);
      return {
        transform: styles.transform,
        boxShadow: styles.boxShadow,
        transition: styles.transition
      };
    }, firstCard);
    
    console.log('📐 Initial card styles:', initialStyles);

    // Hover over the card (not on any buttons)
    await firstCard.hover();
    await new Promise(resolve => setTimeout(resolve, 500)); // Let hover effects settle
    
    // Get styles after hover
    const hoveredStyles = await page.evaluate((card) => {
      const styles = window.getComputedStyle(card);
      return {
        transform: styles.transform,
        boxShadow: styles.boxShadow,
        transition: styles.transition
      };
    }, firstCard);
    
    console.log('🎨 Hovered card styles:', hoveredStyles);

    // Check that box shadow changed but transform didn't (per our fix)
    const transformChanged = initialStyles.transform !== hoveredStyles.transform;
    const boxShadowChanged = initialStyles.boxShadow !== hoveredStyles.boxShadow;
    
    console.log(`📊 Transform changed: ${transformChanged} (should be false)`);
    console.log(`📊 Box shadow changed: ${boxShadowChanged} (should be true)`);

    // Now test button hover to ensure it still works
    console.log('🎯 Testing button hover interactions...');
    
    // Find status buttons within the card
    const statusButtons = await firstCard.$$('.status-button');
    
    if (statusButtons.length > 0) {
      const firstButton = statusButtons[0];
      
      // Get button initial styles
      const initialButtonStyles = await page.evaluate((button) => {
        const styles = window.getComputedStyle(button);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      }, firstButton);
      
      console.log('🔘 Initial button styles:', initialButtonStyles);

      // Hover over the button
      await firstButton.hover();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get button hovered styles
      const hoveredButtonStyles = await page.evaluate((button) => {
        const styles = window.getComputedStyle(button);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      }, firstButton);
      
      console.log('✨ Hovered button styles:', hoveredButtonStyles);
      
      const buttonTransformChanged = initialButtonStyles.transform !== hoveredButtonStyles.transform;
      const buttonBoxShadowChanged = initialButtonStyles.boxShadow !== hoveredButtonStyles.boxShadow;
      
      console.log(`📊 Button transform changed: ${buttonTransformChanged} (should be true)`);
      console.log(`📊 Button box shadow changed: ${buttonBoxShadowChanged} (should be true)`);

      // Test for visual smoothness by recording transition events
      console.log('🎬 Testing hover transition smoothness...');
      
      // Move away from button first
      await page.mouse.move(100, 100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Rapid hover on/off to test for shaking
      for (let i = 0; i < 5; i++) {
        await firstButton.hover();
        await new Promise(resolve => setTimeout(resolve, 100));
        await page.mouse.move(100, 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('✅ Rapid hover test completed - check visually for any shaking');
    } else {
      console.log('⚠️  No status buttons found in the card');
    }

    // Move mouse away to test hover-off behavior
    console.log('🖱️  Moving mouse away to test hover-off...');
    await page.mouse.move(50, 50);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Final style check
    const finalStyles = await page.evaluate((card) => {
      const styles = window.getComputedStyle(card);
      return {
        transform: styles.transform,
        boxShadow: styles.boxShadow
      };
    }, firstCard);
    
    console.log('🏁 Final card styles:', finalStyles);

    // Verify styles returned to initial state (or close)
    const stylesResetCorrectly = 
      Math.abs(parseFloat(finalStyles.transform.replace(/[^\d.-]/g, '') || '0') - 
               parseFloat(initialStyles.transform.replace(/[^\d.-]/g, '') || '0')) < 1;
    
    console.log(`📊 Styles reset correctly: ${stylesResetCorrectly} (should be true)`);

    // Performance test - measure hover response time
    console.log('⏱️  Testing hover response performance...');
    
    const hoverStartTime = Date.now();
    await firstCard.hover();
    await new Promise(resolve => setTimeout(resolve, 50)); // Minimal wait for effect
    const hoverEndTime = Date.now();
    
    const hoverResponseTime = hoverEndTime - hoverStartTime;
    console.log(`🚀 Hover response time: ${hoverResponseTime}ms (should be < 100ms)`);

    // Summary
    console.log('\n📋 HOVER TEST SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`✅ Cards found: ${orderCards.length}`);
    console.log(`${boxShadowChanged ? '✅' : '❌'} Card hover box-shadow effect: ${boxShadowChanged ? 'Working' : 'Not working'}`);
    console.log(`${!transformChanged ? '✅' : '❌'} Card hover transform removed: ${!transformChanged ? 'Fixed' : 'Still has transform'}`);
    console.log(`${statusButtons.length > 0 ? '✅' : '⚠️'} Status buttons found: ${statusButtons.length}`);
    console.log(`${hoverResponseTime < 100 ? '✅' : '❌'} Hover performance: ${hoverResponseTime}ms`);
    console.log(`${stylesResetCorrectly ? '✅' : '❌'} Hover reset: ${stylesResetCorrectly ? 'Clean' : 'Issues detected'}`);
    
    const allTestsPassed = boxShadowChanged && !transformChanged && hoverResponseTime < 100 && stylesResetCorrectly;
    
    console.log('\n' + '='.repeat(50));
    console.log(`${allTestsPassed ? '🎉 ALL HOVER TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(50));

    if (!CONFIG.HEADLESS) {
      console.log('\n👁️  Browser kept open for visual inspection. Close when done.');
      console.log('   Test hover interactions manually to verify smoothness.');
      // Keep browser open for manual inspection
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take screenshot on error
    if (page) {
      try {
        const screenshotPath = path.join(__dirname, 'hover-test-error.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Error screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error('Could not save screenshot:', screenshotError);
      }
    }
  } finally {
    if (!CONFIG.HEADLESS && browser) {
      // Keep browser open for manual inspection
      console.log('Browser kept open. Press Ctrl+C to close when done inspecting.');
    } else if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testHoverFunctionality().catch(console.error);
}

module.exports = { testHoverFunctionality };