const { chromium } = require('playwright');

async function testAllNotificationSettings() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1500 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        permissions: ['notifications'] // Grant notification permission
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
        }
    });

    try {
        console.log('\n🔧 TESTING: All Notification Settings Toggle Functionality');
        console.log('=' .repeat(70));
        
        // Navigate and login
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
        
        // Login if needed
        try {
            await page.waitForSelector('input[type="email"]', { timeout: 3000 });
            await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
            await page.fill('input[type="password"]', 'BeachBarDemo2024!');
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
        } catch (e) {
            console.log('✅ Already logged in');
        }
        
        // Navigate to dashboard
        await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        console.log('\n📍 Step 1: Open Notification Settings Panel');
        
        // Find the notification bell button (🔔)
        const bellButton = page.locator('button').filter({ hasText: '🔔' }).first();
        await bellButton.click();
        console.log('✅ Clicked notification bell button');
        await page.waitForTimeout(1000);

        // Wait for notification settings panel to appear
        const notificationPanel = page.locator('text=🔔 Cilësimet e Njoftimeve').first();
        const panelVisible = await notificationPanel.isVisible({ timeout: 5000 });
        
        if (!panelVisible) {
            console.log('❌ Notification settings panel not visible');
            return { success: false, error: 'Panel not found' };
        }
        
        console.log('✅ Notification settings panel is visible');

        // Test Results Object
        const testResults = {
            audioNotifications: { initialState: null, toggledState: null, canToggle: false },
            browserNotifications: { initialState: null, toggledState: null, canToggle: false },
            wakeLocal: { initialState: null, toggledState: null, canToggle: false },
            realTimeUpdates: { initialState: null, toggledState: null, canToggle: false }
        };

        console.log('\n📍 Step 2: Test Audio Notifications Toggle (🔊)');
        
        // Find Audio Notifications toggle
        const audioToggleRow = page.locator('text=🔊 Zërat e Njoftimeve').locator('..').locator('..'); 
        const audioToggleButton = audioToggleRow.locator('button').last();
        
        // Get initial state
        const initialAudioText = await audioToggleButton.textContent();
        testResults.audioNotifications.initialState = initialAudioText.trim();
        console.log(`Initial Audio State: ${testResults.audioNotifications.initialState}`);
        
        // Click to toggle
        await audioToggleButton.click();
        await page.waitForTimeout(500);
        
        // Get new state
        const newAudioText = await audioToggleButton.textContent();
        testResults.audioNotifications.toggledState = newAudioText.trim();
        testResults.audioNotifications.canToggle = testResults.audioNotifications.initialState !== testResults.audioNotifications.toggledState;
        
        console.log(`After Toggle: ${testResults.audioNotifications.toggledState}`);
        console.log(`Audio Toggle Works: ${testResults.audioNotifications.canToggle ? '✅ YES' : '❌ NO'}`);

        console.log('\n📍 Step 3: Test Browser Notifications Toggle (🌐)');
        
        // Find Browser Notifications toggle
        const browserToggleRow = page.locator('text=🌐 Njoftimet e Browser-it').locator('..').locator('..'); 
        const browserToggleButton = browserToggleRow.locator('button').last();
        
        // Get initial state
        const initialBrowserText = await browserToggleButton.textContent();
        testResults.browserNotifications.initialState = initialBrowserText.trim();
        console.log(`Initial Browser State: ${testResults.browserNotifications.initialState}`);
        
        // Click to toggle
        await browserToggleButton.click();
        await page.waitForTimeout(1000); // Longer wait for permission request
        
        // Get new state
        const newBrowserText = await browserToggleButton.textContent();
        testResults.browserNotifications.toggledState = newBrowserText.trim();
        testResults.browserNotifications.canToggle = testResults.browserNotifications.initialState !== testResults.browserNotifications.toggledState;
        
        console.log(`After Toggle: ${testResults.browserNotifications.toggledState}`);
        console.log(`Browser Toggle Works: ${testResults.browserNotifications.canToggle ? '✅ YES' : '❌ NO'}`);

        console.log('\n📍 Step 4: Test Wake Lock Toggle (📱)');
        
        // Find Wake Lock toggle
        const wakeLockToggleRow = page.locator('text=📱 KDS - Mbaj Ekranin Aktiv').locator('..').locator('..'); 
        const wakeLockToggleButton = wakeLockToggleRow.locator('button').last();
        
        // Get initial state
        const initialWakeLockText = await wakeLockToggleButton.textContent();
        testResults.wakeLocal.initialState = initialWakeLockText.trim();
        console.log(`Initial Wake Lock State: ${testResults.wakeLocal.initialState}`);
        
        // Click to toggle
        await wakeLockToggleButton.click();
        await page.waitForTimeout(500);
        
        // Get new state
        const newWakeLockText = await wakeLockToggleButton.textContent();
        testResults.wakeLocal.toggledState = newWakeLockText.trim();
        testResults.wakeLocal.canToggle = testResults.wakeLocal.initialState !== testResults.wakeLocal.toggledState;
        
        console.log(`After Toggle: ${testResults.wakeLocal.toggledState}`);
        console.log(`Wake Lock Toggle Works: ${testResults.wakeLocal.canToggle ? '✅ YES' : '❌ NO'}`);

        console.log('\n📍 Step 5: Test Real-Time Updates Toggle (🔄)');
        
        // Find Real-Time Updates toggle
        const realTimeToggleRow = page.locator('text=🔄 Përditësimet në Kohë Reale').locator('..').locator('..'); 
        const realTimeToggleButton = realTimeToggleRow.locator('button').last();
        
        // Get initial state
        const initialRealTimeText = await realTimeToggleButton.textContent();
        testResults.realTimeUpdates.initialState = initialRealTimeText.trim();
        console.log(`Initial Real-Time State: ${testResults.realTimeUpdates.initialState}`);
        
        // Click to toggle
        await realTimeToggleButton.click();
        await page.waitForTimeout(1000); // Wait for connection change
        
        // Get new state
        const newRealTimeText = await realTimeToggleButton.textContent();
        testResults.realTimeUpdates.toggledState = newRealTimeText.trim();
        testResults.realTimeUpdates.canToggle = testResults.realTimeUpdates.initialState !== testResults.realTimeUpdates.toggledState;
        
        console.log(`After Toggle: ${testResults.realTimeUpdates.toggledState}`);
        console.log(`Real-Time Toggle Works: ${testResults.realTimeUpdates.canToggle ? '✅ YES' : '❌ NO'}`);

        console.log('\n📍 Step 6: Test Toggle Back to Original States');
        
        // Toggle audio back
        await audioToggleButton.click();
        await page.waitForTimeout(300);
        const finalAudioText = await audioToggleButton.textContent();
        const audioToggledBack = finalAudioText.trim() === testResults.audioNotifications.initialState;
        console.log(`Audio toggled back: ${audioToggledBack ? '✅ YES' : '❌ NO'}`);
        
        // Toggle browser back
        await browserToggleButton.click();
        await page.waitForTimeout(500);
        const finalBrowserText = await browserToggleButton.textContent();
        const browserToggledBack = finalBrowserText.trim() === testResults.browserNotifications.initialState;
        console.log(`Browser toggled back: ${browserToggledBack ? '✅ YES' : '❌ NO'}`);
        
        // Toggle wake lock back
        await wakeLockToggleButton.click();
        await page.waitForTimeout(300);
        const finalWakeLockText = await wakeLockToggleButton.textContent();
        const wakeLockToggledBack = finalWakeLockText.trim() === testResults.wakeLocal.initialState;
        console.log(`Wake Lock toggled back: ${wakeLockToggledBack ? '✅ YES' : '❌ NO'}`);
        
        // Toggle real-time back
        await realTimeToggleButton.click();
        await page.waitForTimeout(800);
        const finalRealTimeText = await realTimeToggleButton.textContent();
        const realTimeToggledBack = finalRealTimeText.trim() === testResults.realTimeUpdates.initialState;
        console.log(`Real-Time toggled back: ${realTimeToggledBack ? '✅ YES' : '❌ NO'}`);

        // Final Assessment
        const allTogglesWork = 
            testResults.audioNotifications.canToggle &&
            testResults.browserNotifications.canToggle &&
            testResults.wakeLocal.canToggle &&
            testResults.realTimeUpdates.canToggle;

        const allToggleBack = audioToggledBack && browserToggledBack && wakeLockToggledBack && realTimeToggledBack;

        console.log('\n🎯 FINAL RESULTS');
        console.log('=' .repeat(50));
        console.log(`🔊 Audio Notifications: ${testResults.audioNotifications.canToggle ? '✅ WORKING' : '❌ BROKEN'}`);
        console.log(`🌐 Browser Notifications: ${testResults.browserNotifications.canToggle ? '✅ WORKING' : '❌ BROKEN'}`);
        console.log(`📱 Wake Lock (KDS): ${testResults.wakeLocal.canToggle ? '✅ WORKING' : '❌ BROKEN'}`);
        console.log(`🔄 Real-Time Updates: ${testResults.realTimeUpdates.canToggle ? '✅ WORKING' : '❌ BROKEN'}`);
        console.log('');
        console.log(`Toggle Back Functionality: ${allToggleBack ? '✅ WORKING' : '❌ BROKEN'}`);
        console.log('');
        console.log(`Overall Assessment: ${allTogglesWork && allToggleBack ? '🎉 ALL TOGGLES WORKING PERFECTLY' : '⚠️ SOME ISSUES FOUND'}`);

        // Take final screenshot
        await page.screenshot({ path: 'test-notification-settings-final.png', fullPage: true });
        
        return {
            success: allTogglesWork && allToggleBack,
            results: testResults,
            canToggleBack: allToggleBack,
            screenshot: 'test-notification-settings-final.png'
        };
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-notification-settings-error.png', fullPage: true });
        return { success: false, error: error.message };
    } finally {
        console.log('\n🔚 Test completed. Keeping browser open for 5 seconds...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// Run the test
testAllNotificationSettings()
    .then(result => {
        console.log('\n📊 TEST SUMMARY:');
        if (result.success) {
            console.log('🎉 SUCCESS: All notification settings can be toggled ON and OFF successfully!');
        } else {
            console.log('❌ FAILURE: Some notification settings are not working properly.');
            if (result.error) {
                console.log('Error:', result.error);
            }
        }
    })
    .catch(console.error);