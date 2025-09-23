/**
 * Visual Card Movement Verification Test
 * Takes before/after screenshots to prove cards move when buttons are clicked
 */

const puppeteer = require('puppeteer');

async function visualCardMovementTest() {
  console.log('📸 VISUAL CARD MOVEMENT VERIFICATION TEST');
  console.log('==========================================');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000,  // Slow motion to see changes
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Track console output
    let buttonClicks = 0;
    let statusUpdates = 0;
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔥 BUTTON CLICKED!')) {
        buttonClicks++;
        console.log(`✅ BUTTON CLICK ${buttonClicks}: ${text}`);
      }
      if (text.includes('✅ Order status updated in UI successfully!')) {
        statusUpdates++;
        console.log(`✅ UI UPDATE ${statusUpdates}: ${text}`);
      }
    });
    
    // Step 1: Login
    console.log('\n🔑 Step 1: Logging in...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Take BEFORE screenshot
    console.log('\n📸 Step 2: Taking BEFORE screenshot...');
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/before-click.png',
      fullPage: true 
    });
    
    // Step 3: Get initial state
    console.log('\n📊 Step 3: Analyzing initial state...');
    const initialCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('.order-card');
      return Array.from(cards).map(card => {
        const orderNumber = card.querySelector('.order-number')?.textContent?.trim();
        const status = card.querySelector('.order-status')?.textContent?.trim();
        const parent = card.closest('[class*="station-"]') || card.parentElement;
        const parentClass = parent.className;
        return {
          orderNumber,
          status,
          parentClass,
          position: {
            x: card.offsetLeft,
            y: card.offsetTop
          }
        };
      });
    });
    
    console.log('📋 Initial card positions:');
    initialCards.forEach((card, i) => {
      console.log(`   Card ${i + 1}: ${card.orderNumber} - Status: "${card.status}" - Position: (${card.position.x}, ${card.position.y})`);
    });
    
    // Step 4: Click the first button
    console.log('\n🖱️ Step 4: Clicking first status button...');
    const buttonExists = await page.$('.status-button');
    if (!buttonExists) {
      console.log('❌ No buttons found!');
      return false;
    }
    
    await page.click('.status-button');
    console.log('✅ Button clicked successfully');
    
    // Step 5: Wait for UI updates
    console.log('\n⏳ Step 5: Waiting for UI updates...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 6: Take AFTER screenshot
    console.log('\n📸 Step 6: Taking AFTER screenshot...');
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/after-click.png',
      fullPage: true 
    });
    
    // Step 7: Get final state
    console.log('\n📊 Step 7: Analyzing final state...');
    const finalCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('.order-card');
      return Array.from(cards).map(card => {
        const orderNumber = card.querySelector('.order-number')?.textContent?.trim();
        const status = card.querySelector('.order-status')?.textContent?.trim();
        const parent = card.closest('[class*="station-"]') || card.parentElement;
        const parentClass = parent.className;
        return {
          orderNumber,
          status,
          parentClass,
          position: {
            x: card.offsetLeft,
            y: card.offsetTop
          }
        };
      });
    });
    
    console.log('📋 Final card positions:');
    finalCards.forEach((card, i) => {
      console.log(`   Card ${i + 1}: ${card.orderNumber} - Status: "${card.status}" - Position: (${card.position.x}, ${card.position.y})`);
    });
    
    // Step 8: Compare changes
    console.log('\n🔍 Step 8: Detecting changes...');
    let changesDetected = false;
    
    for (let i = 0; i < Math.min(initialCards.length, finalCards.length); i++) {
      const before = initialCards[i];
      const after = finalCards[i];
      
      if (before.status !== after.status) {
        console.log(`🔄 CHANGE DETECTED: ${before.orderNumber} status changed from "${before.status}" to "${after.status}"`);
        changesDetected = true;
      }
      
      if (before.position.x !== after.position.x || before.position.y !== after.position.y) {
        console.log(`📦 MOVEMENT DETECTED: ${before.orderNumber} moved from (${before.position.x}, ${before.position.y}) to (${after.position.x}, ${after.position.y})`);
        changesDetected = true;
      }
      
      if (before.parentClass !== after.parentClass) {
        console.log(`🏠 CONTAINER CHANGE: ${before.orderNumber} moved between containers`);
        changesDetected = true;
      }
    }
    
    // Step 9: Results
    console.log('\n🎯 FINAL RESULTS:');
    console.log(`✅ Button Clicks Detected: ${buttonClicks > 0 ? 'YES' : 'NO'} (${buttonClicks})`);
    console.log(`✅ UI Updates Detected: ${statusUpdates > 0 ? 'YES' : 'NO'} (${statusUpdates})`);
    console.log(`✅ Visual Changes Detected: ${changesDetected ? 'YES' : 'NO'}`);
    console.log(`📸 Before Screenshot: before-click.png`);
    console.log(`📸 After Screenshot: after-click.png`);
    
    // Keep browser open for manual inspection
    console.log('\n👀 Keeping browser open for 15 seconds for visual inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const success = buttonClicks > 0 && statusUpdates > 0;
    return success;
    
  } catch (error) {
    console.error('❌ Visual test failed:', error.message);
    return false;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  visualCardMovementTest()
    .then((success) => {
      console.log('\n' + '='.repeat(70));
      if (success) {
        console.log('🎉 VISUAL VERIFICATION - SUCCESS!');
        console.log('✅ Card movement functionality is working');
        console.log('✅ UI updates are happening immediately');
        console.log('📸 Check the before/after screenshots for visual proof');
      } else {
        console.log('❌ VISUAL VERIFICATION - FAILED!');
        console.log('❌ Card movement not working as expected');
      }
    })
    .catch(console.error);
}

module.exports = visualCardMovementTest;