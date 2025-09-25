const { chromium } = require('playwright');

/**
 * PRECISE test for notification buttons in SKAN admin portal
 * Tests the exact toggle buttons structure from DashboardPage.tsx
 */

async function testNotificationButtonsPrecise() {
  console.log('🎯 PRECISE NOTIFICATION BUTTONS TEST');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
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
    console.log(`📄 Console: ${message}`);
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
      await page.waitForTimeout(4000); // Wait longer for dashboard to load
      console.log('   ✅ Login completed');
    } else {
      console.log('2️⃣  Already logged in');
    }

    console.log('3️⃣  Looking for notification settings section...');
    
    // Scroll down to make sure notification settings are visible
    await page.evaluate(() => {
      const element = document.querySelector('h3');
      if (element && element.textContent.includes('Cilësimet e Njoftimeve')) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Take a screenshot first to see the current state
    await page.screenshot({ path: 'precise-test-before.png', fullPage: true });

    // Look for the notification settings header
    const notificationHeader = page.locator('h3:has-text("🔔 Cilësimet e Njoftimeve")');
    const headerCount = await notificationHeader.count();
    
    if (headerCount === 0) {
      console.log('   ❌ Notification settings header "🔔 Cilësimet e Njoftimeve" not found');
      
      // Try to find any element with "Cilësimet e Njoftimeve"
      const altHeader = page.locator(':text("Cilësimet e Njoftimeve")');
      if (await altHeader.count() > 0) {
        console.log('   ✅ Found alternative notification header');
      } else {
        console.log('   ❌ No notification settings found at all');
        throw new Error('Notification settings section not found');
      }
    } else {
      console.log('   ✅ Found notification settings header');
    }

    console.log('4️⃣  Testing Audio Notifications button (🔊 Zërat e Njoftimeve)...');
    
    // Look for the specific audio notification toggle
    // The structure is: div.toggle-item > button with "ON"/"OFF" text
    // And the parent div contains "🔊 Zërat e Njoftimeve"
    
    const audioToggleItem = page.locator('div.toggle-item:has-text("🔊 Zërat e Njoftimeve")');
    const audioToggleCount = await audioToggleItem.count();
    
    if (audioToggleCount === 0) {
      console.log('   ❌ Audio toggle item not found');
      
      // Try alternative selectors
      const altAudioToggle = page.locator(':text("🔊 Zërat e Njoftimeve")').locator('xpath=ancestor::div').locator('button');
      if (await altAudioToggle.count() > 0) {
        console.log('   ✅ Found audio toggle with alternative selector');
        const audioButton = altAudioToggle.first();
        
        // Clear alerts and click
        alertMessages = [];
        const initialText = await audioButton.textContent();
        console.log(`   📍 Audio button initial state: "${initialText}"`);
        
        await audioButton.click();
        await page.waitForTimeout(2000);
        
        if (alertMessages.some(msg => msg.includes("🔊 AUDIO BUTTON CLICKED"))) {
          console.log('   ✅ AUDIO BUTTON WORKING! Alert received.');
          
          const finalText = await audioButton.textContent();
          console.log(`   📍 Audio button final state: "${finalText}"`);
          
          if (initialText !== finalText) {
            console.log('   ✅ Button state changed correctly!');
          }
        } else {
          console.log('   ❌ Audio button did not trigger expected alert');
        }
      } else {
        console.log('   ❌ Could not find audio toggle button');
      }
    } else {
      console.log('   ✅ Found audio toggle item');
      
      const audioButton = audioToggleItem.locator('button').first();
      
      // Clear alerts and click
      alertMessages = [];
      const initialText = await audioButton.textContent();
      console.log(`   📍 Audio button initial state: "${initialText}"`);
      
      await audioButton.click();
      await page.waitForTimeout(2000);
      
      if (alertMessages.some(msg => msg.includes("🔊 AUDIO BUTTON CLICKED"))) {
        console.log('   ✅ AUDIO BUTTON WORKING! Alert received.');
        
        const finalText = await audioButton.textContent();
        console.log(`   📍 Audio button final state: "${finalText}"`);
        
        if (initialText !== finalText) {
          console.log('   ✅ Button state changed correctly!');
        }
      } else {
        console.log('   ❌ Audio button did not trigger expected alert');
      }
    }

    console.log('5️⃣  Testing Browser Notifications button (🌐 Njoftimet e Browser-it)...');
    
    const browserToggleItem = page.locator('div.toggle-item:has-text("🌐 Njoftimet e Browser-it")');
    const browserToggleCount = await browserToggleItem.count();
    
    if (browserToggleCount === 0) {
      console.log('   ❌ Browser toggle item not found');
      
      // Try alternative selectors
      const altBrowserToggle = page.locator(':text("🌐 Njoftimet e Browser-it")').locator('xpath=ancestor::div').locator('button');
      if (await altBrowserToggle.count() > 0) {
        console.log('   ✅ Found browser toggle with alternative selector');
        const browserButton = altBrowserToggle.first();
        
        // Clear alerts and click
        alertMessages = [];
        const initialText = await browserButton.textContent();
        console.log(`   📍 Browser button initial state: "${initialText}"`);
        
        await browserButton.click();
        await page.waitForTimeout(2000);
        
        if (alertMessages.some(msg => msg.includes("🌐 BROWSER NOTIFICATIONS BUTTON CLICKED"))) {
          console.log('   ✅ BROWSER NOTIFICATIONS BUTTON WORKING! Alert received.');
          
          const finalText = await browserButton.textContent();
          console.log(`   📍 Browser button final state: "${finalText}"`);
          
          if (initialText !== finalText) {
            console.log('   ✅ Button state changed correctly!');
          }
        } else {
          console.log('   ❌ Browser button did not trigger expected alert');
        }
      } else {
        console.log('   ❌ Could not find browser toggle button');
      }
    } else {
      console.log('   ✅ Found browser toggle item');
      
      const browserButton = browserToggleItem.locator('button').first();
      
      // Clear alerts and click
      alertMessages = [];
      const initialText = await browserButton.textContent();
      console.log(`   📍 Browser button initial state: "${initialText}"`);
      
      await browserButton.click();
      await page.waitForTimeout(2000);
      
      if (alertMessages.some(msg => msg.includes("🌐 BROWSER NOTIFICATIONS BUTTON CLICKED"))) {
        console.log('   ✅ BROWSER NOTIFICATIONS BUTTON WORKING! Alert received.');
        
        const finalText = await browserButton.textContent();
        console.log(`   📍 Browser button final state: "${finalText}"`);
        
        if (initialText !== finalText) {
          console.log('   ✅ Button state changed correctly!');
        }
      } else {
        console.log('   ❌ Browser button did not trigger expected alert');
      }
    }

    console.log('6️⃣  Checking console messages for additional debug info...');
    
    const relevantConsoleMessages = consoleMessages.filter(msg => 
      msg.includes('AUDIO') || msg.includes('BROWSER') || msg.includes('TOGGLE') || 
      msg.includes('notifications') || msg.includes('🔊') || msg.includes('🌐')
    );
    
    if (relevantConsoleMessages.length > 0) {
      console.log('   📋 Relevant console messages:');
      relevantConsoleMessages.forEach((msg, i) => {
        console.log(`      ${i + 1}. ${msg}`);
      });
    } else {
      console.log('   📋 No relevant console messages found');
    }

    // Take final screenshot
    await page.screenshot({ path: 'precise-test-after.png', fullPage: true });

    console.log('7️⃣  FINAL RESULTS:');
    console.log('='.repeat(50));
    
    const audioWorking = alertMessages.some(msg => msg.includes("🔊 AUDIO BUTTON CLICKED"));
    const browserWorking = alertMessages.some(msg => msg.includes("🌐 BROWSER NOTIFICATIONS BUTTON CLICKED"));
    
    const results = {
      audioButtonWorking: audioWorking,
      browserButtonWorking: browserWorking,
      totalAlerts: alertMessages.length,
      alertMessages: alertMessages,
      relevantConsoleMessages: relevantConsoleMessages,
      testComplete: true
    };
    
    console.log(`   🔊 Audio Button: ${audioWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   🌐 Browser Button: ${browserWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   📊 Total Alerts: ${alertMessages.length}`);
    console.log(`   📄 Relevant Console Messages: ${relevantConsoleMessages.length}`);
    
    return results;

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'precise-test-error.png', fullPage: true });
    
    return {
      error: error.message,
      audioButtonWorking: false,
      browserButtonWorking: false,
      testComplete: false
    };
    
  } finally {
    console.log('\n🔚 Test completed. Keeping browser open for 3 seconds...');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// Run the precise test
testNotificationButtonsPrecise()
  .then(results => {
    console.log('\n🎯 PRECISE TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(JSON.stringify(results, null, 2));
    
    const success = results.audioButtonWorking && results.browserButtonWorking;
    
    if (success) {
      console.log('\n🎉 SUCCESS: Both notification buttons are 100% functional!');
      console.log('   ✅ Audio notifications toggle button works correctly');
      console.log('   ✅ Browser notifications toggle button works correctly');
      console.log('   ✅ Alert debugging messages appeared as expected');
      console.log('   ✅ Click handlers are functioning properly');
      process.exit(0);
    } else {
      console.log('\n⚠️  NOTIFICATION BUTTON STATUS:');
      console.log(`   🔊 Audio Button: ${results.audioButtonWorking ? 'WORKING' : 'NOT WORKING'}`);
      console.log(`   🌐 Browser Button: ${results.browserButtonWorking ? 'WORKING' : 'NOT WORKING'}`);
      
      if (results.alertMessages && results.alertMessages.length > 0) {
        console.log('\n   📨 Alert Messages Received:');
        results.alertMessages.forEach((msg, i) => {
          console.log(`      ${i + 1}. ${msg}`);
        });
      }
      
      process.exit(results.testComplete ? 1 : 2);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(3);
  });