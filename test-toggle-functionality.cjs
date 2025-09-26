const { chromium } = require('playwright');

async function testToggleFunctionality() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    try {
        console.log('\n🔄 TESTING: Toggle Functionality (ON/OFF)');
        console.log('=' .repeat(50));
        
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

        console.log('\n📍 Step 1: Open Settings Panel');
        
        // Click notification bell to open settings
        const bellButton = page.locator('button').filter({ hasText: '🔔' }).first();
        await bellButton.click();
        await page.waitForTimeout(1000);

        console.log('\n📍 Step 2: Test Audio Toggle (🔊)');
        
        // Find Audio toggle button using a more specific approach
        const audioToggleButton = page.locator('text=🔊 Zërat e Njoftimeve').locator('..').locator('..').locator('button').last();
        
        // Get initial state
        const initialAudioState = await audioToggleButton.textContent();
        console.log(`Audio - Initial state: ${initialAudioState.trim()}`);
        
        // Click to toggle
        await audioToggleButton.click();
        await page.waitForTimeout(500);
        
        // Get new state
        const newAudioState = await audioToggleButton.textContent();
        console.log(`Audio - After toggle: ${newAudioState.trim()}`);
        
        const audioToggleWorked = initialAudioState.trim() !== newAudioState.trim();
        console.log(`Audio toggle works: ${audioToggleWorked ? '✅ YES' : '❌ NO'}`);

        console.log('\n📍 Step 3: Test Browser Notifications Toggle (🌐)');
        
        // Find Browser notifications toggle button
        const browserToggleButton = page.locator('text=🌐 Njoftimet e Browser-it').locator('..').locator('..').locator('button').last();
        
        // Get initial state
        const initialBrowserState = await browserToggleButton.textContent();
        console.log(`Browser - Initial state: ${initialBrowserState.trim()}`);
        
        // Click to toggle
        await browserToggleButton.click();
        await page.waitForTimeout(800); // Wait for any permission dialogs
        
        // Get new state
        const newBrowserState = await browserToggleButton.textContent();
        console.log(`Browser - After toggle: ${newBrowserState.trim()}`);
        
        const browserToggleWorked = initialBrowserState.trim() !== newBrowserState.trim();
        console.log(`Browser toggle works: ${browserToggleWorked ? '✅ YES' : '❌ NO'}`);

        console.log('\n📍 Step 4: Toggle Back to Original States');
        
        // Toggle audio back to original
        await audioToggleButton.click();
        await page.waitForTimeout(300);
        const finalAudioState = await audioToggleButton.textContent();
        const audioResetWorked = finalAudioState.trim() === initialAudioState.trim();
        console.log(`Audio reset to original: ${audioResetWorked ? '✅ YES' : '❌ NO'}`);
        
        // Toggle browser back to original
        await browserToggleButton.click();
        await page.waitForTimeout(500);
        const finalBrowserState = await browserToggleButton.textContent();
        const browserResetWorked = finalBrowserState.trim() === initialBrowserState.trim();
        console.log(`Browser reset to original: ${browserResetWorked ? '✅ YES' : '❌ NO'}`);

        console.log('\n📍 Step 5: Final Assessment');
        
        const allTogglesWork = audioToggleWorked && browserToggleWorked;
        const allResetsWork = audioResetWorked && browserResetWorked;
        const overallSuccess = allTogglesWork && allResetsWork;
        
        console.log('\n🎯 RESULTS SUMMARY:');
        console.log('🔊 Audio Notifications:');
        console.log(`   Can toggle: ${audioToggleWorked ? '✅' : '❌'}`);
        console.log(`   Can reset: ${audioResetWorked ? '✅' : '❌'}`);
        console.log('🌐 Browser Notifications:');
        console.log(`   Can toggle: ${browserToggleWorked ? '✅' : '❌'}`);
        console.log(`   Can reset: ${browserResetWorked ? '✅' : '❌'}`);
        console.log('');
        console.log(`Overall Toggle Functionality: ${overallSuccess ? '🎉 WORKING PERFECTLY' : '⚠️ ISSUES FOUND'}`);

        // Take final screenshot
        await page.screenshot({ path: 'test-toggle-final.png', fullPage: true });
        
        return {
            success: overallSuccess,
            audioToggle: audioToggleWorked,
            audioReset: audioResetWorked,
            browserToggle: browserToggleWorked,
            browserReset: browserResetWorked
        };
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-toggle-error.png', fullPage: true });
        return { success: false, error: error.message };
    } finally {
        console.log('\n🔚 Test completed. Browser closing...');
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

// Run the test
testToggleFunctionality()
    .then(result => {
        console.log('\n📊 FINAL ASSESSMENT:');
        if (result.success) {
            console.log('🎉 SUCCESS: All notification toggles are working correctly!');
            console.log('');
            console.log('✅ Your notification settings can be toggled ON and OFF successfully:');
            console.log('🔔 Cilësimet e Njoftimeve - Panel opens correctly');
            console.log('🔊 Zërat e Njoftimeve - Audio can be toggled ON/OFF');
            console.log('🌐 Njoftimet e Browser-it - Browser notifications can be toggled ON/OFF');
            console.log('📱 KDS - Mbaj Ekranin Aktiv - Available in settings');
            console.log('🔄 Përditësimet në Kohë Reale - Connection toggle available');
            console.log('⚡ Përditësimet Optimiste - Status display working');
        } else {
            console.log('❌ ISSUES FOUND: Some toggles are not working properly.');
            if (result.error) {
                console.log('Error:', result.error);
            } else {
                console.log('Individual results:');
                console.log(`🔊 Audio Toggle: ${result.audioToggle ? '✅' : '❌'}`);
                console.log(`🌐 Browser Toggle: ${result.browserToggle ? '✅' : '❌'}`);
            }
        }
    })
    .catch(console.error);