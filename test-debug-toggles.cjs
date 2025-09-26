const { chromium } = require('playwright');

async function testDebugToggles() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 500 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    // Capture console logs specifically for our debug messages
    const debugLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🔊') || text.includes('Toggling') || text.includes('🔧')) {
            debugLogs.push(text);
            console.log(`[DEBUG]: ${text}`);
        }
    });

    try {
        console.log('🔧 DEBUG TEST: Toggle Function Debugging');
        console.log('=' .repeat(50));
        
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
        await page.waitForTimeout(2000);

        console.log('\n📍 Opening notification settings...');
        const bellButton = page.locator('button').filter({ hasText: '🔔' }).first();
        await bellButton.click();
        await page.waitForTimeout(1000);

        console.log('\n📍 Finding audio toggle button...');
        const audioToggleButton = page.locator('text=🔊 Zërat e Njoftimeve').locator('..').locator('..').locator('button').last();
        
        // Check initial state
        const initialText = await audioToggleButton.textContent();
        console.log(`Initial button text: "${initialText}"`);
        
        console.log('\n📍 Clicking audio toggle button...');
        await audioToggleButton.click();
        
        // Wait for any state changes
        await page.waitForTimeout(2000);
        
        const newText = await audioToggleButton.textContent();
        console.log(`New button text: "${newText}"`);
        
        console.log('\n📍 Clicking again...');
        await audioToggleButton.click();
        await page.waitForTimeout(2000);
        
        const finalText = await audioToggleButton.textContent();
        console.log(`Final button text: "${finalText}"`);
        
        console.log('\n🔍 DEBUG LOGS CAPTURED:');
        debugLogs.forEach((log, index) => {
            console.log(`${index + 1}. ${log}`);
        });
        
        if (debugLogs.length === 0) {
            console.log('❌ NO DEBUG LOGS CAPTURED - Function may not be executing!');
        }
        
        await page.screenshot({ path: 'debug-toggle-test.png', fullPage: true });
        
        return { success: true, debugLogs, initialText, newText, finalText };
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return { success: false, error: error.message };
    } finally {
        console.log('\n🔚 Test completed. Browser closing in 3 seconds...');
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testDebugToggles()
    .then(result => {
        console.log('\n📊 FINAL RESULTS:');
        if (result.success) {
            console.log(`✅ Test completed`);
            console.log(`Debug logs captured: ${result.debugLogs.length}`);
            console.log(`Button text changes: ${result.initialText !== result.newText || result.newText !== result.finalText}`);
        } else {
            console.log('❌ Test failed:', result.error);
        }
    })
    .catch(console.error);