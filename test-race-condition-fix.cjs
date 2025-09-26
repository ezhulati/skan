const { chromium } = require('playwright');

async function testRaceConditionFix() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 800 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    // Capture console logs specifically for our debug messages
    const debugLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🔧') || text.includes('🔊') || text.includes('Toggling')) {
            debugLogs.push(text);
            console.log(`[DEBUG]: ${text}`);
        }
    });

    try {
        console.log('🔧 RACE CONDITION FIX TEST: Testing useEffect initialization control');
        console.log('='.repeat(70));
        
        // Navigate and login quickly
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
        
        try {
            await page.waitForSelector('input[type="email"]', { timeout: 3000 });
            await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
            await page.fill('input[type="password"]', 'BeachBarDemo2024!');
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
        } catch (e) {
            console.log('✅ Already logged in');
        }
        
        await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle' });
        
        console.log('\n📍 Step 1: Wait for Component Initialization (looking for useEffect logs)');
        await page.waitForTimeout(3000); // Give time for useEffect to run
        
        console.log('\n📍 Step 2: Check Initial Debug Logs');
        const useEffectLogs = debugLogs.filter(log => log.includes('🔧 useEffect'));
        console.log(`useEffect logs captured: ${useEffectLogs.length}`);
        useEffectLogs.forEach((log, index) => {
            console.log(`${index + 1}. ${log}`);
        });
        
        // Check if we have the expected pattern: first-time init but not multiple inits
        const firstTimeInit = debugLogs.find(log => log.includes('First-time initialization'));
        const skipMessages = debugLogs.filter(log => log.includes('Already initialized, skipping'));
        
        console.log(`\n📊 INITIALIZATION ANALYSIS:`);
        console.log(`✅ First-time initialization logged: ${!!firstTimeInit}`);
        console.log(`✅ Skip messages found: ${skipMessages.length}`);
        
        if (firstTimeInit && skipMessages.length > 0) {
            console.log('🎉 SUCCESS: useEffect race condition prevention is working!');
            console.log('   - First initialization happened correctly');
            console.log('   - Subsequent runs were skipped as expected');
        } else if (firstTimeInit && skipMessages.length === 0) {
            console.log('✅ PARTIAL SUCCESS: useEffect ran once without duplicates');
            console.log('   - This could mean React.StrictMode is not enabled or race condition was resolved');
        } else {
            console.log('❌ ISSUE: Unexpected initialization pattern');
        }
        
        console.log('\n📍 Step 3: Open Notification Settings to Test Toggles');
        
        const bellButton = page.locator('button').filter({ hasText: '🔔' }).first();
        await bellButton.click();
        await page.waitForTimeout(1000);

        console.log('\n📍 Step 4: Test Audio Toggle (should work now)');
        
        const audioToggleButton = page.locator('text=🔊 Zërat e Njoftimeve').locator('..').locator('..').locator('button').last();
        
        // Get initial state
        const initialText = await audioToggleButton.textContent();
        console.log(`Initial button text: "${initialText.trim()}"`);
        
        // Clear the debug logs before toggle test
        debugLogs.length = 0;
        
        // Click to toggle
        console.log('\n📍 Step 5: Click Toggle Button');
        await audioToggleButton.click();
        await page.waitForTimeout(2000); // Wait for state update
        
        // Get new state
        const newText = await audioToggleButton.textContent();
        console.log(`New button text: "${newText.trim()}"`);
        
        // Analyze toggle logs
        const toggleLogs = debugLogs.filter(log => log.includes('🔊 Audio toggle'));
        console.log(`\n📊 TOGGLE ANALYSIS:`);
        console.log(`Toggle function logs: ${toggleLogs.length}`);
        toggleLogs.forEach(log => console.log(`   ${log}`));
        
        const textChanged = initialText.trim() !== newText.trim();
        console.log(`Button text changed: ${textChanged ? '✅ YES' : '❌ NO'}`);
        
        // Test localStorage persistence
        const localStorageValue = await page.evaluate(() => {
            return localStorage.getItem('skan-audio-enabled');
        });
        console.log(`LocalStorage value: ${localStorageValue}`);
        
        console.log('\n📍 Step 6: Test Toggle Back');
        
        // Clear logs again
        debugLogs.length = 0;
        
        await audioToggleButton.click();
        await page.waitForTimeout(2000);
        
        const finalText = await audioToggleButton.textContent();
        console.log(`Final button text: "${finalText.trim()}"`);
        
        const finalLocalStorageValue = await page.evaluate(() => {
            return localStorage.getItem('skan-audio-enabled');
        });
        console.log(`Final localStorage: ${finalLocalStorageValue}`);
        
        const secondToggleWorked = newText.trim() !== finalText.trim();
        console.log(`Second toggle worked: ${secondToggleWorked ? '✅ YES' : '❌ NO'}`);
        
        console.log('\n🎯 FINAL ASSESSMENT:');
        
        const raceConditionFixed = firstTimeInit && (skipMessages.length > 0 || useEffectLogs.length === 1);
        const togglesWork = textChanged && secondToggleWorked;
        const persistenceWorks = localStorageValue !== finalLocalStorageValue;
        
        if (raceConditionFixed && togglesWork && persistenceWorks) {
            console.log('🎉 SUCCESS: All fixes are working correctly!');
            console.log('   ✅ Race condition prevented');
            console.log('   ✅ Toggles change UI state');
            console.log('   ✅ localStorage persistence works');
        } else {
            console.log('⚠️ PARTIAL SUCCESS or ISSUES FOUND:');
            console.log(`   Race condition fixed: ${raceConditionFixed ? '✅' : '❌'}`);
            console.log(`   Toggles work: ${togglesWork ? '✅' : '❌'}`);
            console.log(`   Persistence works: ${persistenceWorks ? '✅' : '❌'}`);
        }
        
        return { 
            success: raceConditionFixed && togglesWork && persistenceWorks,
            raceConditionFixed,
            togglesWork,
            persistenceWorks,
            debugLogs: debugLogs.slice()
        };
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return { success: false, error: error.message };
    } finally {
        console.log('\n🔚 Test completed. Browser closing in 3 seconds...');
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testRaceConditionFix()
    .then(result => {
        console.log('\n📊 RACE CONDITION FIX TEST RESULTS:');
        if (result.success) {
            console.log('🎉 SUCCESS: Race condition fixed and toggles are working!');
        } else if (result.error) {
            console.log('❌ Test failed:', result.error);
        } else {
            console.log('⚠️ Issues found - check detailed output above');
        }
    })
    .catch(console.error);