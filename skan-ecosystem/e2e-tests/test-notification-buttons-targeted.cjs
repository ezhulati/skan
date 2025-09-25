const { chromium } = require('playwright');

/**
 * Targeted test for notification buttons in SKAN admin portal
 * Specifically looks for the "Cilësimet e Njoftimeve" section and tests both buttons
 */

async function testNotificationButtonsTargeted() {
  console.log('🎯 TARGETED NOTIFICATION BUTTONS TEST');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ 
    headless: false, // Show browser for visibility
    slowMo: 500 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Track alerts and console messages
  let alertMessages = [];
  let consoleMessages = [];
  
  page.on('console', msg => {
    const message = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(message);
    if (msg.text().includes('AUDIO') || msg.text().includes('BROWSER') || msg.text().includes('TOGGLE')) {
      console.log(`📄 Console: ${message}`);
    }
  });
  
  page.on('dialog', async dialog => {
    const message = dialog.message();
    alertMessages.push(message);
    console.log(`🚨 ALERT: ${message}`);
    await dialog.accept();
  });

  try {
    console.log('1️⃣  Navigating to admin portal...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Handle login if needed
    if (await page.locator('input[type="email"]').count() > 0) {
      console.log('2️⃣  Logging in...');
      await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
      await page.fill('input[type="password"]', 'BeachBarDemo2024!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      console.log('   ✅ Login completed');
    } else {
      console.log('2️⃣  Already logged in');
    }

    console.log('3️⃣  Looking for Notification Settings section...');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Look for the notification settings header
    const notificationHeader = page.locator('text=🔔 Cilësimet e Njoftimeve');
    const headerCount = await notificationHeader.count();
    
    if (headerCount === 0) {
      console.log('   ❌ Notification settings header not found');
      
      // Try alternative selectors
      const alternatives = [
        'text=Cilësimet e Njoftimeve',
        'text=Notification Settings',
        ':text("🔔")',
        '.notification-settings'
      ];
      
      let found = false;
      for (const selector of alternatives) {
        if (await page.locator(selector).count() > 0) {
          console.log(`   ✅ Found alternative selector: ${selector}`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        // Scroll down to find it
        console.log('   🔍 Scrolling to find notification settings...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        if (await notificationHeader.count() > 0) {
          console.log('   ✅ Found notification settings after scrolling');
        } else {
          throw new Error('Notification settings section not found after scrolling');
        }
      }
    } else {
      console.log('   ✅ Found notification settings header');
    }

    console.log('4️⃣  Testing Audio Notifications button...');
    
    // Clear previous alerts
    alertMessages = [];
    
    // Find the audio toggle button - it should be near the notification header
    // Look for button with green/gray background that has audio-related content
    const audioButton = page.locator('button').filter({
      has: page.locator(':text-is("Po"), :text-is("Jo"), :text-is("ON"), :text-is("OFF")')
    }).first();
    
    // Also try finding it by the onClick handler pattern
    const possibleAudioButtons = page.locator('button').filter({
      hasNot: page.locator('text=Fillo')
    });
    
    let audioTestSuccess = false;
    const audioButtonCount = await possibleAudioButtons.count();
    console.log(`   Found ${audioButtonCount} potential buttons to test`);
    
    // Test buttons systematically
    for (let i = 0; i < Math.min(audioButtonCount, 10); i++) {
      try {
        const button = possibleAudioButtons.nth(i);
        const buttonText = await button.textContent();
        console.log(`   Testing button ${i + 1}: "${buttonText}"`);
        
        // Clear alerts before clicking
        alertMessages = [];
        
        await button.click();
        await page.waitForTimeout(1000);
        
        // Check if this triggered the audio alert
        if (alertMessages.some(msg => msg.includes("🔊 AUDIO BUTTON CLICKED"))) {
          console.log('   ✅ AUDIO BUTTON FOUND AND WORKING!');
          audioTestSuccess = true;
          break;
        }
      } catch (e) {
        // Continue to next button
        console.log(`   ⚠️  Button ${i + 1} not clickable`);
      }
    }
    
    if (!audioTestSuccess) {
      console.log('   ❌ Audio button not found or not working');
    }

    console.log('5️⃣  Testing Browser Notifications button...');
    
    // Clear previous alerts
    alertMessages = [];
    
    let browserTestSuccess = false;
    
    // Test remaining buttons for browser notifications
    for (let i = 0; i < Math.min(audioButtonCount, 10); i++) {
      try {
        const button = possibleAudioButtons.nth(i);
        const buttonText = await button.textContent();
        console.log(`   Testing button ${i + 1}: "${buttonText}"`);
        
        // Clear alerts before clicking
        alertMessages = [];
        
        await button.click();
        await page.waitForTimeout(1000);
        
        // Check if this triggered the browser notification alert
        if (alertMessages.some(msg => msg.includes("🌐 BROWSER NOTIFICATIONS BUTTON CLICKED"))) {
          console.log('   ✅ BROWSER NOTIFICATIONS BUTTON FOUND AND WORKING!');
          browserTestSuccess = true;
          break;
        }
      } catch (e) {
        // Continue to next button
        console.log(`   ⚠️  Button ${i + 1} not clickable`);
      }
    }
    
    if (!browserTestSuccess) {
      console.log('   ❌ Browser notifications button not found or not working');
    }

    console.log('6️⃣  Testing button state changes...');
    
    // Take screenshot of notification section
    await page.screenshot({ path: 'notification-section-screenshot.png', fullPage: true });
    
    // Look for toggle buttons specifically
    const toggleButtons = await page.locator('button').filter({
      hasText: /^(Po|Jo|ON|OFF)$/
    }).all();
    
    console.log(`   Found ${toggleButtons.length} toggle-style buttons`);
    
    let stateChangeSuccess = false;
    
    for (let i = 0; i < toggleButtons.length; i++) {
      try {
        const button = toggleButtons[i];
        const initialText = await button.textContent();
        console.log(`   Toggle button ${i + 1} initial state: "${initialText}"`);
        
        await button.click();
        await page.waitForTimeout(1000);
        
        const newText = await button.textContent();
        console.log(`   Toggle button ${i + 1} new state: "${newText}"`);
        
        if (initialText !== newText) {
          console.log('   ✅ Button state changed successfully!');
          stateChangeSuccess = true;
        }
      } catch (e) {
        console.log(`   ⚠️  Toggle button ${i + 1} error: ${e.message}`);
      }
    }

    console.log('7️⃣  FINAL RESULTS:');
    console.log('='.repeat(40));
    
    const results = {
      audioButtonWorking: audioTestSuccess,
      browserButtonWorking: browserTestSuccess,
      stateChanges: stateChangeSuccess,
      totalAlerts: alertMessages.length,
      alertMessages: alertMessages,
      consoleMessages: consoleMessages.filter(msg => 
        msg.includes('AUDIO') || msg.includes('BROWSER') || msg.includes('TOGGLE')
      )
    };
    
    console.log(`   🔊 Audio Button: ${audioTestSuccess ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   🌐 Browser Button: ${browserTestSuccess ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   🔄 State Changes: ${stateChangeSuccess ? '✅ WORKING' : '❌ NOT DETECTED'}`);
    console.log(`   📊 Total Alerts: ${alertMessages.length}`);
    
    if (alertMessages.length > 0) {
      console.log('\n   📨 Alert Messages:');
      alertMessages.forEach((msg, i) => {
        console.log(`      ${i + 1}. ${msg}`);
      });
    }
    
    return results;

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'notification-test-error-targeted.png', fullPage: true });
    
    return {
      error: error.message,
      audioButtonWorking: false,
      browserButtonWorking: false,
      stateChanges: false
    };
    
  } finally {
    await page.waitForTimeout(3000); // Keep browser open for observation
    await browser.close();
  }
}

// Run the targeted test
testNotificationButtonsTargeted()
  .then(results => {
    console.log('\n🎯 TARGETED TEST COMPLETE');
    console.log('='.repeat(50));
    console.log(JSON.stringify(results, null, 2));
    
    const success = results.audioButtonWorking && results.browserButtonWorking;
    
    if (success) {
      console.log('\n🎉 SUCCESS: Both notification buttons are working correctly!');
      console.log('   - Alert popups appeared as expected');
      console.log('   - Click handlers are functioning properly');
      process.exit(0);
    } else {
      console.log('\n⚠️  ISSUES DETECTED:');
      if (!results.audioButtonWorking) console.log('   - Audio button not working');
      if (!results.browserButtonWorking) console.log('   - Browser notifications button not working');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });