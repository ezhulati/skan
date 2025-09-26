const { chromium } = require('playwright');

async function testToggleDiagnostic() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    // Enable console logging to see what's happening
    page.on('console', msg => {
        console.log(`[BROWSER]: ${msg.text()}`);
    });

    try {
        console.log('\n🔍 DIAGNOSTIC TEST: Toggle Button Investigation');
        console.log('=' .repeat(60));
        
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
        await page.waitForTimeout(2000);

        console.log('\n📍 Step 1: Open Notification Settings');
        
        // Click notification bell
        const bellButton = page.locator('button').filter({ hasText: '🔔' }).first();
        await bellButton.click();
        await page.waitForTimeout(1000);

        console.log('\n📍 Step 2: Locate Audio Toggle Button');
        
        // Find the audio toggle with more debugging
        const audioSection = page.locator('text=🔊 Zërat e Njoftimeve');
        const audioVisible = await audioSection.isVisible();
        console.log(`Audio section visible: ${audioVisible}`);
        
        if (audioVisible) {
            // Get the parent container of the audio toggle
            const audioContainer = audioSection.locator('..').locator('..');
            const audioToggleButton = audioContainer.locator('button').last();
            
            console.log('\n📍 Step 3: Analyze Button State BEFORE Click');
            
            // Check if button exists and is clickable
            const buttonExists = await audioToggleButton.count();
            console.log(`Button exists: ${buttonExists > 0}`);
            
            if (buttonExists > 0) {
                const buttonText = await audioToggleButton.textContent();
                const buttonVisible = await audioToggleButton.isVisible();
                const buttonEnabled = await audioToggleButton.isEnabled();
                const buttonStyles = await audioToggleButton.getAttribute('style');
                
                console.log(`Initial button text: "${buttonText}"`);
                console.log(`Button visible: ${buttonVisible}`);
                console.log(`Button enabled: ${buttonEnabled}`);
                console.log(`Button styles: ${buttonStyles}`);
                
                console.log('\n📍 Step 4: Click Button and Monitor Changes');
                
                // Click the button
                await audioToggleButton.click();
                console.log('🖱️ Button clicked');
                
                // Wait a moment for state change
                await page.waitForTimeout(1000);
                
                // Check state after click
                const newButtonText = await audioToggleButton.textContent();
                const newButtonStyles = await audioToggleButton.getAttribute('style');
                
                console.log(`New button text: "${newButtonText}"`);
                console.log(`New button styles: ${newButtonStyles}`);
                console.log(`Text changed: ${buttonText !== newButtonText}`);
                console.log(`Style changed: ${buttonStyles !== newButtonStyles}`);
                
                // Check localStorage to see if the value is being set
                const localStorageValue = await page.evaluate(() => {
                    return localStorage.getItem('skan-audio-enabled');
                });
                console.log(`LocalStorage value: ${localStorageValue}`);
                
                console.log('\n📍 Step 5: Try Clicking Again');
                
                // Click again to see if it toggles back
                await audioToggleButton.click();
                await page.waitForTimeout(1000);
                
                const finalButtonText = await audioToggleButton.textContent();
                const finalLocalStorageValue = await page.evaluate(() => {
                    return localStorage.getItem('skan-audio-enabled');
                });
                
                console.log(`Final button text: "${finalButtonText}"`);
                console.log(`Final localStorage: ${finalLocalStorageValue}`);
                
                // Summary
                console.log('\n🎯 DIAGNOSTIC SUMMARY:');
                console.log(`Button responds to clicks: ${buttonText !== newButtonText || newButtonText !== finalButtonText}`);
                console.log(`LocalStorage updates: ${localStorageValue !== finalLocalStorageValue}`);
                console.log(`Visual feedback working: ${buttonStyles !== newButtonStyles}`);
                
            } else {
                console.log('❌ No toggle button found');
            }
        } else {
            console.log('❌ Audio section not visible');
        }

        // Take screenshot for visual confirmation
        await page.screenshot({ path: 'diagnostic-toggle-test.png', fullPage: true });
        
        return { success: true };
        
    } catch (error) {
        console.error('\n❌ Diagnostic test failed:', error.message);
        await page.screenshot({ path: 'diagnostic-error.png', fullPage: true });
        return { success: false, error: error.message };
    } finally {
        console.log('\n🔚 Diagnostic completed. Browser closing in 3 seconds...');
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

// Run the diagnostic
testToggleDiagnostic()
    .then(result => {
        console.log('\n📊 DIAGNOSTIC COMPLETE');
        if (result.success) {
            console.log('✅ Test completed - check output above for toggle behavior analysis');
        } else {
            console.log('❌ Test failed:', result.error);
        }
    })
    .catch(console.error);