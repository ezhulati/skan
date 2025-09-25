const { chromium } = require('playwright');

/**
 * Test notification buttons in SKAN admin portal
 * Tests audio and browser notification toggle buttons for proper functionality
 */

async function testNotificationButtons() {
  console.log('🧪 SKAN Admin Portal - Notification Buttons Test');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down actions for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Listen for console messages and alerts
  let consoleMessages = [];
  let alertMessages = [];
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`📄 Console: ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('dialog', async dialog => {
    const message = dialog.message();
    alertMessages.push(message);
    console.log(`🚨 Alert: ${message}`);
    await dialog.accept();
  });

  try {
    console.log('1️⃣  Navigating to admin portal...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('2️⃣  Checking if login is required...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    
    if (isLoginPage) {
      console.log('3️⃣  Login required - attempting login...');
      
      // Fill login form
      await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
      await page.fill('input[type="password"]', 'BeachBarDemo2024!');
      
      // Click login button
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Hyr")');
      await page.waitForTimeout(3000);
      
      console.log('   ✅ Login attempt completed');
    } else {
      console.log('3️⃣  Already logged in or no login required');
    }

    console.log('4️⃣  Looking for notification settings panel...');
    
    // Wait for page to load completely
    await page.waitForTimeout(2000);
    
    // Try different selectors for notification settings
    const selectors = [
      'text=Cilësimet e Njoftimeve',
      'text=Notification Settings',
      '[data-testid="notification-settings"]',
      '.notification-settings',
      'div:has-text("Cilësimet e Njoftimeve")',
      'div:has-text("Notification Settings")'
    ];
    
    let notificationPanel = null;
    for (const selector of selectors) {
      try {
        notificationPanel = page.locator(selector);
        if (await notificationPanel.count() > 0) {
          console.log(`   ✅ Found notification panel with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!notificationPanel || await notificationPanel.count() === 0) {
      console.log('   🔍 Searching for notification buttons directly...');
      
      // Search for the specific alert messages to find the buttons
      const audioButton = page.locator('button, div, span').filter({ 
        hasText: /audio|zë|🔊/i 
      }).first();
      
      const browserButton = page.locator('button, div, span').filter({ 
        hasText: /browser|shfletues|🌐/i 
      }).first();
      
      if (await audioButton.count() > 0 || await browserButton.count() > 0) {
        console.log('   ✅ Found notification buttons directly');
      } else {
        console.log('   📋 Taking screenshot to see current page state...');
        await page.screenshot({ path: 'notification-test-page.png', fullPage: true });
        
        console.log('   📝 Dumping page content for analysis...');
        const bodyText = await page.locator('body').textContent();
        console.log('   Page contains:', bodyText.substring(0, 500) + '...');
        
        throw new Error('Could not find notification settings or buttons');
      }
    }

    console.log('5️⃣  Testing Audio Notifications button...');
    
    // Find audio notification button by the alert message it should show
    const audioButtons = await page.locator('button, div[role="button"], span[role="button"]').all();
    let audioButtonFound = false;
    
    for (const button of audioButtons) {
      const text = await button.textContent();
      if (text && (text.includes('Audio') || text.includes('Zë') || text.includes('🔊'))) {
        console.log(`   🎯 Testing audio button with text: "${text}"`);
        
        // Clear previous alerts
        alertMessages = [];
        
        await button.click();
        await page.waitForTimeout(1000);
        
        // Check if the expected alert appeared
        const expectedAudioAlert = "🔊 AUDIO BUTTON CLICKED! This proves the click handler is working!";
        if (alertMessages.some(msg => msg.includes("AUDIO BUTTON CLICKED"))) {
          console.log('   ✅ Audio button click handler WORKING - Alert appeared!');
          audioButtonFound = true;
          break;
        }
      }
    }
    
    if (!audioButtonFound) {
      console.log('   ⚠️  Audio button not found or not working - trying generic approach...');
      
      // Try clicking any button that might be the audio toggle
      const allButtons = await page.locator('button, [role="button"]').all();
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        alertMessages = [];
        await allButtons[i].click();
        await page.waitForTimeout(500);
        
        if (alertMessages.some(msg => msg.includes("AUDIO BUTTON CLICKED"))) {
          console.log('   ✅ Found and tested audio button successfully!');
          audioButtonFound = true;
          break;
        }
      }
    }

    console.log('6️⃣  Testing Browser Notifications button...');
    
    const browserButtons = await page.locator('button, div[role="button"], span[role="button"]').all();
    let browserButtonFound = false;
    
    for (const button of browserButtons) {
      const text = await button.textContent();
      if (text && (text.includes('Browser') || text.includes('Shfletues') || text.includes('🌐'))) {
        console.log(`   🎯 Testing browser button with text: "${text}"`);
        
        // Clear previous alerts
        alertMessages = [];
        
        await button.click();
        await page.waitForTimeout(1000);
        
        // Check if the expected alert appeared
        const expectedBrowserAlert = "🌐 BROWSER NOTIFICATIONS BUTTON CLICKED! This proves the click handler is working!";
        if (alertMessages.some(msg => msg.includes("BROWSER NOTIFICATIONS BUTTON CLICKED"))) {
          console.log('   ✅ Browser button click handler WORKING - Alert appeared!');
          browserButtonFound = true;
          break;
        }
      }
    }
    
    if (!browserButtonFound) {
      console.log('   ⚠️  Browser button not found or not working - trying generic approach...');
      
      // Try clicking remaining buttons
      const allButtons = await page.locator('button, [role="button"]').all();
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        alertMessages = [];
        await allButtons[i].click();
        await page.waitForTimeout(500);
        
        if (alertMessages.some(msg => msg.includes("BROWSER NOTIFICATIONS BUTTON CLICKED"))) {
          console.log('   ✅ Found and tested browser button successfully!');
          browserButtonFound = true;
          break;
        }
      }
    }

    console.log('7️⃣  Testing button state changes...');
    
    // Try to find toggle buttons and test their state changes
    const toggleButtons = await page.locator('button:has-text("ON"), button:has-text("OFF"), button:has-text("Po"), button:has-text("Jo")').all();
    
    if (toggleButtons.length > 0) {
      console.log(`   Found ${toggleButtons.length} potential toggle buttons`);
      
      for (let i = 0; i < toggleButtons.length; i++) {
        const initialText = await toggleButtons[i].textContent();
        console.log(`   Testing toggle button ${i + 1} - Initial state: "${initialText}"`);
        
        await toggleButtons[i].click();
        await page.waitForTimeout(1000);
        
        const newText = await toggleButtons[i].textContent();
        console.log(`   After click - New state: "${newText}"`);
        
        if (initialText !== newText) {
          console.log('   ✅ Button state changed successfully!');
        } else {
          console.log('   ⚠️  Button state did not change');
        }
      }
    } else {
      console.log('   ⚠️  No toggle buttons with ON/OFF states found');
    }

    console.log('8️⃣  Final Results Summary:');
    console.log('='.repeat(40));
    
    const results = {
      audioButtonWorking: audioButtonFound,
      browserButtonWorking: browserButtonFound,
      totalAlerts: alertMessages.length,
      consoleMessages: consoleMessages.length,
      alertMessages: alertMessages
    };
    
    console.log(`   Audio Button: ${audioButtonFound ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   Browser Button: ${browserButtonFound ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   Total Alerts: ${alertMessages.length}`);
    console.log(`   Console Messages: ${consoleMessages.length}`);
    
    if (alertMessages.length > 0) {
      console.log('\n   Alert Messages Received:');
      alertMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg}`);
      });
    }
    
    if (consoleMessages.length > 0) {
      console.log('\n   Console Messages (last 5):');
      consoleMessages.slice(-5).forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg}`);
      });
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'notification-test-final.png', fullPage: true });
    
    return results;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: 'notification-test-error.png', fullPage: true });
    
    return {
      error: error.message,
      audioButtonWorking: false,
      browserButtonWorking: false,
      totalAlerts: alertMessages.length,
      alertMessages: alertMessages
    };
    
  } finally {
    console.log('\n🔚 Closing browser...');
    await browser.close();
  }
}

// Run the test
testNotificationButtons()
  .then(results => {
    console.log('\n📊 FINAL TEST RESULTS:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(results, null, 2));
    
    if (results.audioButtonWorking && results.browserButtonWorking) {
      console.log('\n🎉 SUCCESS: Both notification buttons are working correctly!');
      process.exit(0);
    } else {
      console.log('\n⚠️  WARNING: Some buttons may not be working as expected');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });