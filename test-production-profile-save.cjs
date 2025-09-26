const { chromium } = require('playwright');

async function testProductionProfileSave() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Enable detailed logging
    page.on('console', msg => {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });

    // Track ALL network requests
    const networkRequests = [];
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData()
        });
    });

    // Track ALL responses
    const networkResponses = [];
    page.on('response', response => {
        networkResponses.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method(),
            headers: response.headers()
        });
    });

    try {
        console.log('\n🔍 PRODUCTION PROFILE SAVE TEST');
        console.log('=' .repeat(50));
        
        // Navigate to production admin portal
        await page.goto('https://admin-portal-skan.netlify.app', { waitUntil: 'networkidle' });
        
        // Login with demo credentials
        try {
            await page.waitForSelector('input[type="email"]', { timeout: 3000 });
            await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
            await page.fill('input[type="password"]', 'BeachBarDemo2024!');
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
            console.log('✅ Logged in successfully');
        } catch (e) {
            console.log('✅ Already logged in');
        }
        
        // Navigate to profile
        await page.goto('https://admin-portal-skan.netlify.app/profile', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('📍 On Profile Page');
        
        // Clear previous network logs
        networkRequests.length = 0;
        networkResponses.length = 0;
        
        // Find the name input field
        console.log('\n🔍 Looking for name input field...');
        
        // Try multiple strategies to find the name field
        let nameInput;
        
        // Strategy 1: Look for input with current name value
        const inputsWithValue = await page.locator('input[value*="Beach Bar"], input[value*="Manager"], input[value*="Demo"]').all();
        if (inputsWithValue.length > 0) {
            nameInput = inputsWithValue[0];
            console.log('✅ Found name input by value');
        }
        
        // Strategy 2: First text input
        if (!nameInput) {
            nameInput = page.locator('input[type="text"]').first();
            console.log('✅ Using first text input');
        }
        
        // Strategy 3: Any input that's not email/password
        if (!nameInput) {
            nameInput = page.locator('input').filter({ hasNot: page.locator('input[type="email"], input[type="password"]') }).first();
            console.log('✅ Using first non-auth input');
        }
        
        const isNameInputVisible = await nameInput.isVisible();
        console.log(`Name input visible: ${isNameInputVisible}`);
        
        if (isNameInputVisible) {
            // Get current value
            const currentValue = await nameInput.inputValue();
            console.log(`Current name value: "${currentValue}"`);
            
            // Clear and enter new value
            await nameInput.fill('');
            await nameInput.fill('Gjergj Kastrioti');
            
            // Verify the input worked
            const newValue = await nameInput.inputValue();
            console.log(`✅ New name value: "${newValue}"`);
            
            // Look for save button
            console.log('\n💾 Looking for save button...');
            
            // Try multiple save button strategies
            let saveButton;
            
            // Strategy 1: Albanian text
            saveButton = page.locator('button:has-text("Ruaj"), button:has-text("Save")');
            if (await saveButton.count() > 0) {
                console.log('Found save button by text');
            } else {
                // Strategy 2: Form submit button
                saveButton = page.locator('form button[type="submit"], form button:not([type="button"])').first();
                console.log('Found save button by form submit');
            }
            
            const isSaveButtonVisible = await saveButton.isVisible();
            console.log(`Save button visible: ${isSaveButtonVisible}`);
            
            if (isSaveButtonVisible) {
                const isEnabled = await saveButton.isEnabled();
                console.log(`Save button enabled: ${isEnabled}`);
                
                if (isEnabled) {
                    console.log('\n🚀 Clicking save button...');
                    
                    // Click save and wait for network activity
                    await Promise.all([
                        saveButton.click(),
                        page.waitForTimeout(5000) // Give time for API calls
                    ]);
                    
                    console.log('\n🌐 Network Activity During Save:');
                    console.log('REQUESTS:');
                    networkRequests.forEach((req, i) => {
                        if (req.url.includes('/api/') || req.url.includes('api.skan.al')) {
                            console.log(`  ${i+1}. ${req.method} ${req.url}`);
                            if (req.postData) {
                                console.log(`     Data: ${req.postData}`);
                            }
                        }
                    });
                    
                    console.log('\nRESPONSES:');
                    networkResponses.forEach((res, i) => {
                        if (res.url.includes('/api/') || res.url.includes('api.skan.al')) {
                            console.log(`  ${i+1}. ${res.method} ${res.url} - Status: ${res.status}`);
                        }
                    });
                    
                    // Check for success/error messages
                    await page.waitForTimeout(2000);
                    
                    // Look for any feedback messages
                    const successSelectors = [
                        'text=/success/i',
                        'text=/sukses/i', 
                        'text=/saved/i',
                        'text=/ruajtur/i',
                        '.alert-success',
                        '.success',
                        '[role="alert"]'
                    ];
                    
                    const errorSelectors = [
                        'text=/error/i',
                        'text=/gabim/i',
                        'text=/invalid/i',
                        '.alert-error',
                        '.error',
                        '.alert-danger'
                    ];
                    
                    console.log('\n📧 Checking for feedback messages...');
                    
                    for (const selector of successSelectors) {
                        try {
                            const element = page.locator(selector);
                            if (await element.isVisible()) {
                                const text = await element.textContent();
                                console.log(`✅ Success message: "${text}"`);
                            }
                        } catch (e) {
                            // Silent continue
                        }
                    }
                    
                    for (const selector of errorSelectors) {
                        try {
                            const element = page.locator(selector);
                            if (await element.isVisible()) {
                                const text = await element.textContent();
                                console.log(`❌ Error message: "${text}"`);
                            }
                        } catch (e) {
                            // Silent continue
                        }
                    }
                    
                } else {
                    console.log('❌ Save button is disabled');
                }
            } else {
                console.log('❌ Save button not found');
            }
        } else {
            console.log('❌ Name input field not found');
        }
        
        // Final screenshot
        await page.screenshot({ path: 'production-profile-test.png', fullPage: true });
        console.log('\n📷 Screenshot saved: production-profile-test.png');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'production-profile-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testProductionProfileSave().catch(console.error);