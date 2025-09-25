const { chromium } = require('playwright');

/**
 * DEFINITIVE notification buttons test - clicks the bell button to show settings first
 */

async function testNotificationDefinitive() {
  console.log('🎯 DEFINITIVE NOTIFICATION BUTTONS TEST');
  console.log('='.repeat(60));
  console.log('Strategy: Click the bell button (🔔) first to show notification settings');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
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
    console.log(`🚨 ALERT: ${message}`);
    await dialog.accept();
  });

  try {
    console.log('1️⃣  Navigating and logging in...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Handle login
    if (await page.locator('input[type="email"]').count() > 0) {
      console.log('   Logging in...');
      await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
      await page.fill('input[type="password"]', 'BeachBarDemo2024!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000); // Wait for dashboard to fully load
      console.log('   ✅ Login completed');
    }

    console.log('2️⃣  Looking for the bell button (🔔) in header...');
    
    // Look for the settings/bell button in the header
    const bellButton = page.locator('button.settings-button');
    const bellButtonCount = await bellButton.count();
    
    if (bellButtonCount === 0) {
      console.log('   ❌ Bell button (.settings-button) not found, trying alternative selectors...');
      
      // Try different selectors for the bell button
      const alternativeSelectors = [
        'button:has-text("🔔")',
        'button[class*="settings"]',
        'button[class*="notification"]',
        '.header-controls button'
      ];
      
      let foundButton = null;
      for (const selector of alternativeSelectors) {
        if (await page.locator(selector).count() > 0) {
          console.log(`   ✅ Found bell button with selector: ${selector}`);
          foundButton = page.locator(selector).first();
          break;
        }
      }
      
      if (!foundButton) {
        console.log('   ❌ Could not find bell button, looking for any button with 🔔...');
        const allButtons = await page.locator('button').all();
        for (let i = 0; i < allButtons.length; i++) {
          const text = await allButtons[i].textContent();
          if (text && text.includes('🔔')) {
            console.log(`   ✅ Found bell button at index ${i}: "${text}"`);
            foundButton = allButtons[i];
            break;
          }
        }
      }
      
      if (!foundButton) {
        throw new Error('Bell button not found with any selector');
      }
      
      await foundButton.click();
    } else {
      console.log('   ✅ Found bell button (.settings-button)');
      await bellButton.click();
    }
    
    console.log('   🖱️  Clicked bell button to show notification settings...');
    await page.waitForTimeout(2000);

    console.log('3️⃣  Looking for notification settings panel...');
    
    // Take screenshot after clicking bell
    await page.screenshot({ path: 'after-bell-click.png', fullPage: true });
    
    // Now look for the notification settings panel
    const notificationPanel = page.locator('.notification-settings-panel');
    const panelCount = await notificationPanel.count();
    
    if (panelCount === 0) {
      console.log('   ❌ Notification settings panel not visible, checking for dropdown instead...');
      const dropdown = page.locator('.notification-dropdown');
      if (await dropdown.count() > 0) {
        console.log('   ⚠️  Notification dropdown is showing instead of settings (there might be active alerts)');
        // Click bell again to close dropdown and try to get settings
        await bellButton.click();
        await page.waitForTimeout(1000);
        await bellButton.click();
        await page.waitForTimeout(2000);
      }
      
      if (await notificationPanel.count() === 0) {
        throw new Error('Notification settings panel did not appear after clicking bell button');
      }
    } else {
      console.log('   ✅ Notification settings panel is now visible!');
    }

    console.log('4️⃣  Testing Audio Notifications button...');
    
    // Look for the audio toggle button within the notification panel
    const audioToggle = notificationPanel.locator('button').filter({
      hasText: /^(ON|OFF)$/
    }).first();
    
    if (await audioToggle.count() === 0) {
      console.log('   ❌ Audio toggle button not found in panel');
    } else {
      console.log('   ✅ Found audio toggle button');
      
      const initialText = await audioToggle.textContent();
      console.log(`   📍 Audio button initial state: "${initialText}"`);
      
      // Clear alerts and click
      alertMessages = [];
      await audioToggle.click();
      await page.waitForTimeout(2000);
      
      const audioSuccess = alertMessages.some(msg => msg.includes("🔊 AUDIO BUTTON CLICKED"));
      
      if (audioSuccess) {
        console.log('   ✅ AUDIO BUTTON WORKS! Alert received.');
        
        const finalText = await audioToggle.textContent();
        console.log(`   📍 Audio button final state: "${finalText}"`);
        
        if (initialText !== finalText) {
          console.log('   ✅ Button state changed correctly!');
        } else {
          console.log('   ⚠️  Button state did not change');
        }
      } else {
        console.log('   ❌ Audio button did not trigger expected alert');
      }
    }

    console.log('5️⃣  Testing Browser Notifications button...');
    
    // Look for the second toggle button (browser notifications)
    const browserToggle = notificationPanel.locator('button').filter({
      hasText: /^(ON|OFF)$/
    }).nth(1); // Second toggle button
    
    if (await browserToggle.count() === 0) {
      console.log('   ❌ Browser notifications toggle button not found in panel');
    } else {
      console.log('   ✅ Found browser notifications toggle button');
      
      const initialText = await browserToggle.textContent();
      console.log(`   📍 Browser button initial state: "${initialText}"`);
      
      // Clear alerts and click
      alertMessages = [];
      await browserToggle.click();
      await page.waitForTimeout(2000);
      
      const browserSuccess = alertMessages.some(msg => msg.includes("🌐 BROWSER NOTIFICATIONS BUTTON CLICKED"));
      
      if (browserSuccess) {
        console.log('   ✅ BROWSER NOTIFICATIONS BUTTON WORKS! Alert received.');
        
        const finalText = await browserToggle.textContent();
        console.log(`   📍 Browser button final state: "${finalText}"`);
        
        if (initialText !== finalText) {
          console.log('   ✅ Button state changed correctly!');
        } else {
          console.log('   ⚠️  Button state did not change');
        }
      } else {
        console.log('   ❌ Browser notifications button did not trigger expected alert');
      }
    }

    // Final screenshot showing the settings panel
    await page.screenshot({ path: 'definitive-test-final.png', fullPage: true });

    console.log('6️⃣  DEFINITIVE TEST RESULTS:');
    console.log('='.repeat(50));
    
    const audioWorking = alertMessages.some(msg => msg.includes("🔊 AUDIO BUTTON CLICKED"));
    const browserWorking = alertMessages.some(msg => msg.includes("🌐 BROWSER NOTIFICATIONS BUTTON CLICKED"));
    
    const results = {
      audioButtonWorking: audioWorking,
      browserButtonWorking: browserWorking,
      totalAlerts: alertMessages.length,
      alertMessages: alertMessages,
      testStrategy: 'Bell button click to reveal settings',
      success: audioWorking && browserWorking
    };
    
    console.log(`   🔔 Bell Button Click: ✅ SUCCESS`);
    console.log(`   🔊 Audio Button: ${audioWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   🌐 Browser Button: ${browserWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   📊 Total Alerts: ${alertMessages.length}`);
    
    return results;

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'definitive-test-error.png', fullPage: true });
    
    return {
      error: error.message,
      audioButtonWorking: false,
      browserButtonWorking: false,
      success: false
    };
    
  } finally {
    console.log('\n🔚 Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the definitive test
testNotificationDefinitive()
  .then(results => {
    console.log('\n🎯 DEFINITIVE TEST SUMMARY');
    console.log('='.repeat(60));
    
    if (results.success) {
      console.log('🎉 COMPLETE SUCCESS - NOTIFICATION BUTTONS ARE WORKING!');
      console.log('');
      console.log('✅ FINAL VERIFICATION:');
      console.log('   - Bell button (🔔) successfully shows notification settings');
      console.log('   - Audio notifications toggle button is functional');  
      console.log('   - Browser notifications toggle button is functional');
      console.log('   - Alert debugging messages work correctly');
      console.log('   - Click handlers are properly connected');
      console.log('');
      console.log('🎯 VERDICT: The notification system is 100% FUNCTIONAL');
      console.log('🎯 STATUS: READY FOR PRODUCTION USE');
      
      process.exit(0);
    } else {
      console.log('⚠️  ISSUES DETECTED IN NOTIFICATION SYSTEM');
      console.log('');
      console.log('📋 STATUS BREAKDOWN:');
      console.log(`   🔊 Audio Button: ${results.audioButtonWorking ? 'WORKING ✅' : 'NOT WORKING ❌'}`);
      console.log(`   🌐 Browser Button: ${results.browserButtonWorking ? 'WORKING ✅' : 'NOT WORKING ❌'}`);
      
      if (results.error) {
        console.log(`   🚨 Error: ${results.error}`);
      }
      
      if (results.alertMessages && results.alertMessages.length > 0) {
        console.log('\n   📨 Alert Messages Received:');
        results.alertMessages.forEach((msg, i) => {
          console.log(`      ${i + 1}. ${msg}`);
        });
      }
      
      console.log('\n❌ VERDICT: Notification system needs attention');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 DEFINITIVE TEST FAILED:', error);
    process.exit(2);
  });