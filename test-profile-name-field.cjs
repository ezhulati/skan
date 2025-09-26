const { chromium } = require('playwright');

async function testProfileNameField() {
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
        }
    });

    // Track API calls
    const apiCalls = [];
    page.on('response', response => {
        if (response.url().includes('/api/') || response.url().includes('api.skan.al')) {
            apiCalls.push({
                url: response.url(),
                status: response.status(),
                method: response.request().method()
            });
        }
    });

    try {
        console.log('\n🔍 FOCUSED TEST: Profile Name Field Editing');
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
            console.log('✅ Already logged in or login not needed');
        }
        
        // Navigate to profile
        await page.goto('http://localhost:3002/profile', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('\n📍 On Profile Page');
        
        // Find and click edit button
        const editButton = page.locator('button:has-text("Ruaj Ndryshimet")').first();
        const isEditButtonVisible = await editButton.isVisible();
        
        if (!isEditButtonVisible) {
            // Look for a different edit button
            const blueEditButton = page.locator('button').filter({ hasText: /edit|ndrysho|redakto/i }).first();
            if (await blueEditButton.isVisible()) {
                await blueEditButton.click();
                console.log('✅ Clicked edit button');
            }
        } else {
            console.log('✅ Already in edit mode');
        }
        
        await page.waitForTimeout(1000);
        
        // Now look specifically for the name field in the "Informacionet Personale" section
        console.log('\n🔍 Looking for name input field...');
        
        // Try to find the input field by its position near "Emri i Plotë" label
        const nameInput = page.locator('input').nth(0); // First input field (from screenshot, this is the name field)
        
        const isNameInputVisible = await nameInput.isVisible();
        console.log(`Name input visible: ${isNameInputVisible}`);
        
        if (isNameInputVisible) {
            // Get current value
            const currentValue = await nameInput.inputValue();
            console.log(`✅ Current name value: "${currentValue}"`);
            
            // Clear and enter new value
            await nameInput.fill('');
            await nameInput.fill('Gjergj Kastrioti Updated');
            
            // Verify the input worked
            const newValue = await nameInput.inputValue();
            console.log(`✅ New name value: "${newValue}"`);
            
            // Now look for the save button
            console.log('\n💾 Looking for save button...');
            const saveButton = page.locator('button:has-text("Ruaj Ndryshimet")');
            const isSaveButtonVisible = await saveButton.isVisible();
            
            console.log(`Save button visible: ${isSaveButtonVisible}`);
            
            if (isSaveButtonVisible) {
                const isEnabled = await saveButton.isEnabled();
                console.log(`Save button enabled: ${isEnabled}`);
                
                if (isEnabled) {
                    // Clear API calls before save
                    apiCalls.length = 0;
                    
                    console.log('🚀 Clicking save button...');
                    await saveButton.click();
                    
                    // Wait for API response
                    await page.waitForTimeout(3000);
                    
                    console.log('\n🌐 API Calls during save:');
                    apiCalls.forEach(call => {
                        console.log(`   ${call.method} ${call.url} - Status: ${call.status}`);
                    });
                    
                    // Check for success/error messages
                    const successMessage = page.locator('text=/success|sukses/i');
                    const errorMessage = page.locator('text=/error|gabim|invalid token/i');
                    
                    const hasSuccess = await successMessage.isVisible().catch(() => false);
                    const hasError = await errorMessage.isVisible().catch(() => false);
                    
                    console.log(`\n📧 Success message visible: ${hasSuccess}`);
                    console.log(`❌ Error message visible: ${hasError}`);
                    
                    if (hasError) {
                        const errorText = await errorMessage.textContent();
                        console.log(`❌ Error message: "${errorText}"`);
                    }
                    
                    // Check if we're still in edit mode or if it saved
                    await page.waitForTimeout(2000);
                    const stillInEditMode = await saveButton.isVisible();
                    console.log(`\n🔄 Still in edit mode: ${stillInEditMode}`);
                    
                    // Test verification by refreshing page
                    console.log('\n🔄 Refreshing page to verify persistence...');
                    await page.reload({ waitUntil: 'networkidle' });
                    await page.waitForTimeout(2000);
                    
                    // Check if name persisted
                    const displayedName = page.locator('text="Gjergj Kastrioti Updated"');
                    const namePersisted = await displayedName.isVisible().catch(() => false);
                    console.log(`✅ Name persisted after refresh: ${namePersisted}`);
                    
                } else {
                    console.log('❌ Save button is disabled');
                }
            } else {
                console.log('❌ Save button not found');
            }
        } else {
            console.log('❌ Name input field not found');
            
            // Let's examine all visible inputs
            console.log('\n🔍 All visible inputs on page:');
            const allInputs = await page.locator('input').all();
            for (let i = 0; i < allInputs.length; i++) {
                const type = await allInputs[i].getAttribute('type').catch(() => '');
                const name = await allInputs[i].getAttribute('name').catch(() => '');
                const placeholder = await allInputs[i].getAttribute('placeholder').catch(() => '');
                const value = await allInputs[i].inputValue().catch(() => '');
                console.log(`   Input ${i}: type="${type}" name="${name}" placeholder="${placeholder}" value="${value}"`);
            }
        }
        
        // Final screenshot
        await page.screenshot({ path: 'test-name-field-final.png', fullPage: true });
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-name-field-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testProfileNameField().catch(console.error);