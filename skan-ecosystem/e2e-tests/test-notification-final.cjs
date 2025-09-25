const { chromium } = require('playwright');

/**
 * FINAL notification buttons test - scroll to find notification settings
 */

async function testNotificationFinal() {
  console.log('🎯 FINAL NOTIFICATION BUTTONS TEST');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Track alerts
  let alertMessages = [];
  
  page.on('dialog', async dialog => {
    const message = dialog.message();
    alertMessages.push(message);
    console.log(`🚨 ALERT DETECTED: ${message}`);
    await dialog.accept();
  });

  try {
    console.log('1️⃣  Navigating and logging in...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Handle login if needed
    if (await page.locator('input[type="email"]').count() > 0) {
      console.log('   Logging in...');
      await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
      await page.fill('input[type="password"]', 'BeachBarDemo2024!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000); // Wait for dashboard to fully load
    }

    console.log('2️⃣  Scrolling to find notification settings...');
    
    // Scroll to bottom to ensure all content is loaded
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // Take screenshot after scrolling
    await page.screenshot({ path: 'after-scroll.png', fullPage: true });

    console.log('3️⃣  Looking for notification buttons using multiple strategies...');
    
    // Strategy 1: Look for the heading text
    let notificationSection = page.locator('text=🔔 Cilësimet e Njoftimeve');
    if (await notificationSection.count() === 0) {
      console.log('   Strategy 1 failed, trying alternative text...');
      // Strategy 2: Look for just the bell icon
      notificationSection = page.locator('text=🔔');
      if (await notificationSection.count() === 0) {
        console.log('   Strategy 2 failed, trying notification text...');
        // Strategy 3: Look for notification in Albanian
        notificationSection = page.locator('text=Cilësimet e Njoftimeve');
      }
    }
    
    if (await notificationSection.count() > 0) {
      console.log('   ✅ Found notification section!');
      
      // Scroll to notification section
      await notificationSection.scrollIntoView({ behavior: 'smooth' });
      await page.waitForTimeout(2000);
    } else {
      console.log('   ⚠️  Notification section not found, searching for buttons directly...');
    }

    console.log('4️⃣  Testing Audio Notifications button...');
    
    // Look for button containing "ON" or "OFF" near audio text
    const audioButtons = await page.locator('button').all();
    let audioSuccess = false;
    
    console.log(`   Found ${audioButtons.length} buttons total`);
    
    for (let i = 0; i < audioButtons.length; i++) {
      try {
        const button = audioButtons[i];
        const buttonText = await button.textContent();
        
        // Check if this looks like a toggle button (ON/OFF)
        if (buttonText && (buttonText.includes('ON') || buttonText.includes('OFF'))) {
          console.log(`   Testing button ${i + 1}: "${buttonText}"`);
          
          // Clear alerts and click
          alertMessages = [];
          await button.click();
          await page.waitForTimeout(1500);
          
          // Check if this was the audio button
          if (alertMessages.some(msg => msg.includes("🔊 AUDIO BUTTON CLICKED"))) {
            console.log('   ✅ FOUND AUDIO BUTTON - IT WORKS!');
            audioSuccess = true;
            break;
          }
        }
      } catch (e) {
        // Continue to next button
      }
    }
    
    if (!audioSuccess) {
      console.log('   ❌ Audio button not found or not working');
    }

    console.log('5️⃣  Testing Browser Notifications button...');
    
    let browserSuccess = false;
    
    for (let i = 0; i < audioButtons.length; i++) {
      try {
        const button = audioButtons[i];
        const buttonText = await button.textContent();
        
        // Check if this looks like a toggle button (ON/OFF)
        if (buttonText && (buttonText.includes('ON') || buttonText.includes('OFF'))) {
          console.log(`   Testing button ${i + 1}: "${buttonText}"`);
          
          // Clear alerts and click
          alertMessages = [];
          await button.click();
          await page.waitForTimeout(1500);
          
          // Check if this was the browser notification button
          if (alertMessages.some(msg => msg.includes("🌐 BROWSER NOTIFICATIONS BUTTON CLICKED"))) {
            console.log('   ✅ FOUND BROWSER NOTIFICATIONS BUTTON - IT WORKS!');
            browserSuccess = true;
            break;
          }
        }
      } catch (e) {
        // Continue to next button
      }
    }
    
    if (!browserSuccess) {
      console.log('   ❌ Browser notifications button not found or not working');
    }

    // Final screenshot
    await page.screenshot({ path: 'final-notification-test.png', fullPage: true });

    console.log('6️⃣  FINAL RESULTS:');
    console.log('='.repeat(50));
    
    const results = {
      audioButtonWorking: audioSuccess,
      browserButtonWorking: browserSuccess,
      totalAlerts: alertMessages.length,
      alertMessages: alertMessages
    };
    
    console.log(`   🔊 Audio Button: ${audioSuccess ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   🌐 Browser Button: ${browserSuccess ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   📊 Total Alerts: ${alertMessages.length}`);
    
    if (alertMessages.length > 0) {
      console.log('\n   📨 All Alert Messages:');
      alertMessages.forEach((msg, i) => {
        console.log(`      ${i + 1}. ${msg}`);
      });
    }
    
    return results;

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'final-test-error.png', fullPage: true });
    
    return {
      error: error.message,
      audioButtonWorking: false,
      browserButtonWorking: false
    };
    
  } finally {
    console.log('\n🔚 Keeping browser open for 5 seconds to observe...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the final test
testNotificationFinal()
  .then(results => {
    console.log('\n🎯 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    
    const bothWorking = results.audioButtonWorking && results.browserButtonWorking;
    const oneWorking = results.audioButtonWorking || results.browserButtonWorking;
    
    if (bothWorking) {
      console.log('🎉 COMPLETE SUCCESS: Both notification buttons are 100% functional!');
      console.log('   ✅ Audio notifications toggle: WORKING');
      console.log('   ✅ Browser notifications toggle: WORKING');
      console.log('   ✅ Alert debugging messages: WORKING');
      console.log('   ✅ Click handlers: PROPERLY FUNCTIONING');
      console.log('\n✅ VERDICT: The notification buttons are working correctly.');
      console.log('✅ The user can safely proceed with confidence.');
    } else if (oneWorking) {
      console.log('⚠️  PARTIAL SUCCESS: One button working, one not working');
      console.log(`   🔊 Audio Button: ${results.audioButtonWorking ? 'WORKING ✅' : 'NOT WORKING ❌'}`);
      console.log(`   🌐 Browser Button: ${results.browserButtonWorking ? 'WORKING ✅' : 'NOT WORKING ❌'}`);
      console.log('\n⚠️  VERDICT: There may be an issue with one of the buttons.');
    } else {
      console.log('❌ NO SUCCESS: Neither button worked as expected');
      console.log('   🔊 Audio Button: NOT WORKING ❌');
      console.log('   🌐 Browser Button: NOT WORKING ❌');
      console.log('\n❌ VERDICT: The notification buttons are not functioning properly.');
      
      if (results.error) {
        console.log(`❌ ERROR: ${results.error}`);
      }
    }
    
    process.exit(bothWorking ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(2);
  });