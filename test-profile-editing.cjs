const { chromium } = require('playwright');

async function testProfileEditing() {
    const browser = await chromium.launch({ 
        headless: false, // Show browser for visibility
        slowMo: 500 // Slow down actions for observation
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging to catch any errors
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
        }
    });

    // Catch any uncaught exceptions
    page.on('pageerror', error => {
        console.log('[PAGE ERROR]:', error.message);
    });

    // Track network requests for API calls
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
        console.log('\n🚀 Starting Profile Name Editing Test');
        console.log('=' .repeat(50));
        
        // Step 1: Navigate to admin portal
        console.log('\n📍 Step 1: Navigating to http://localhost:3002');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
        
        // Take screenshot for initial state
        await page.screenshot({ path: 'test-profile-1-initial.png', fullPage: true });
        
        // Step 2: Check if already logged in or need to login
        const isLoggedIn = await page.locator('text=Dashboard').isVisible().catch(() => false) ||
                          await page.locator('text=Dashbordi').isVisible().catch(() => false);
        
        if (!isLoggedIn) {
            console.log('\n🔐 Step 2: Logging in with demo credentials');
            
            // Wait for login form
            await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
            
            // Fill login form
            const emailInput = page.locator('input[type="email"], input[name="email"]').first();
            const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
            
            await emailInput.fill('demo.beachbar@skan.al');
            await passwordInput.fill('BeachBarDemo2024!');
            
            // Click login button
            const loginButton = page.locator('button[type="submit"], button:has-text("Hyr"), button:has-text("Login")').first();
            await loginButton.click();
            
            // Wait for successful login
            await page.waitForURL(/dashboard|admin/, { timeout: 15000 });
            console.log('✅ Login successful');
        } else {
            console.log('✅ Already logged in');
        }
        
        // Step 3: Navigate to Profile page
        console.log('\n👤 Step 3: Navigating to Profile page');
        
        // Look for profile navigation - try different possible selectors
        const profileSelectors = [
            'a:has-text("Profili im")',
            'a:has-text("Profile")', 
            'a:has-text("Profil")',
            'nav a[href*="profile"]',
            '[data-testid="profile-link"]'
        ];
        
        let profileLink = null;
        for (const selector of profileSelectors) {
            try {
                profileLink = page.locator(selector).first();
                if (await profileLink.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (profileLink && await profileLink.isVisible()) {
            await profileLink.click();
            console.log('✅ Clicked profile navigation link');
        } else {
            // Try direct URL navigation
            console.log('⚠️  Profile link not found, trying direct URL navigation');
            await page.goto('http://localhost:3002/profile', { waitUntil: 'networkidle' });
        }
        
        // Wait for profile page to load
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-profile-2-profile-page.png', fullPage: true });
        
        // Step 4: Find and click edit button
        console.log('\n✏️  Step 4: Looking for blue edit button');
        
        const editButtonSelectors = [
            'button:has-text("Edit")',
            'button:has-text("Ndrysho")', 
            'button:has-text("Redakto")',
            'button.bg-blue-500, button.bg-blue-600, button.bg-indigo-500, button.bg-indigo-600',
            '[data-testid="edit-button"]',
            'button[aria-label*="edit"], button[aria-label*="Edit"]'
        ];
        
        let editButton = null;
        for (const selector of editButtonSelectors) {
            try {
                editButton = page.locator(selector).first();
                if (await editButton.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (editButton && await editButton.isVisible()) {
            console.log('✅ Found edit button');
            await editButton.click();
            console.log('✅ Clicked edit button');
        } else {
            console.log('❌ Edit button not found');
            console.log('🔍 Available buttons on page:');
            const buttons = await page.locator('button').all();
            for (let i = 0; i < Math.min(buttons.length, 10); i++) {
                const text = await buttons[i].textContent().catch(() => '');
                const classes = await buttons[i].getAttribute('class').catch(() => '');
                console.log(`   Button ${i + 1}: "${text}" (classes: ${classes})`);
            }
            throw new Error('Edit button not found');
        }
        
        // Wait for edit mode
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-profile-3-edit-mode.png', fullPage: true });
        
        // Step 5: Find name input field and check current value
        console.log('\n📝 Step 5: Testing name field editing');
        
        const nameInputSelectors = [
            'input[name="fullName"]',
            'input[name="name"]',
            'input[placeholder*="name"], input[placeholder*="Name"]',
            'input[placeholder*="emër"], input[placeholder*="Emër"]',
            '[data-testid="name-input"]'
        ];
        
        let nameInput = null;
        for (const selector of nameInputSelectors) {
            try {
                nameInput = page.locator(selector).first();
                if (await nameInput.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (nameInput && await nameInput.isVisible()) {
            const currentValue = await nameInput.inputValue();
            console.log(`✅ Found name input field with current value: "${currentValue}"`);
            
            // Test typing in the field
            await nameInput.fill('');
            await nameInput.fill('Gjergj Kastrioti Updated');
            
            const newValue = await nameInput.inputValue();
            console.log(`✅ Successfully updated name field to: "${newValue}"`);
            
            // Step 6: Find and click save button
            console.log('\n💾 Step 6: Looking for save button');
            
            const saveButtonSelectors = [
                'button:has-text("Ruaj Ndryshimet")',
                'button:has-text("Save Changes")',
                'button:has-text("Ruaj")',
                'button:has-text("Save")',
                'button[type="submit"]',
                '[data-testid="save-button"]'
            ];
            
            let saveButton = null;
            for (const selector of saveButtonSelectors) {
                try {
                    saveButton = page.locator(selector).first();
                    if (await saveButton.isVisible({ timeout: 2000 })) {
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (saveButton && await saveButton.isVisible()) {
                console.log('✅ Found save button');
                
                // Check if button is enabled
                const isEnabled = await saveButton.isEnabled();
                console.log(`✅ Save button is ${isEnabled ? 'enabled' : 'disabled'}`);
                
                if (isEnabled) {
                    // Clear previous API calls
                    apiCalls.length = 0;
                    
                    await saveButton.click();
                    console.log('✅ Clicked save button');
                    
                    // Wait for save operation
                    await page.waitForTimeout(3000);
                    
                    // Check for API calls
                    console.log('\n🌐 API Calls made during save:');
                    apiCalls.forEach(call => {
                        console.log(`   ${call.method} ${call.url} - Status: ${call.status}`);
                    });
                    
                    // Look for success/error messages
                    const messageSelectors = [
                        '.alert-success, .toast-success, .notification-success',
                        '.alert-error, .toast-error, .notification-error',
                        'text="Success"',
                        'text="Error"',
                        'text="Invalid token"',
                        '[role="alert"]'
                    ];
                    
                    let foundMessage = false;
                    for (const selector of messageSelectors) {
                        try {
                            const message = page.locator(selector).first();
                            if (await message.isVisible({ timeout: 2000 })) {
                                const text = await message.textContent();
                                console.log(`📧 Found message: "${text}"`);
                                foundMessage = true;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (!foundMessage) {
                        console.log('⚠️  No success/error messages found');
                    }
                    
                    // Take final screenshot
                    await page.screenshot({ path: 'test-profile-4-final.png', fullPage: true });
                    
                    // Verify if name actually changed by refreshing and checking
                    console.log('\n🔄 Step 7: Verifying save persistence');
                    await page.reload({ waitUntil: 'networkidle' });
                    await page.waitForTimeout(2000);
                    
                    // Find the name display (not in edit mode)
                    const nameDisplaySelectors = [
                        'text="Gjergj Kastrioti Updated"',
                        '[data-testid="user-name"]',
                        '.user-name',
                        'h1, h2, h3, h4, h5, h6'
                    ];
                    
                    let nameUpdated = false;
                    for (const selector of nameDisplaySelectors) {
                        try {
                            const element = page.locator(selector);
                            if (await element.isVisible({ timeout: 2000 })) {
                                const text = await element.textContent();
                                if (text && text.includes('Gjergj Kastrioti Updated')) {
                                    console.log('✅ Name successfully updated and persisted!');
                                    nameUpdated = true;
                                    break;
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (!nameUpdated) {
                        console.log('❌ Name change may not have persisted');
                    }
                    
                } else {
                    console.log('❌ Save button is disabled');
                }
            } else {
                console.log('❌ Save button not found');
                console.log('🔍 Available buttons in edit mode:');
                const buttons = await page.locator('button').all();
                for (let i = 0; i < Math.min(buttons.length, 10); i++) {
                    const text = await buttons[i].textContent().catch(() => '');
                    const classes = await buttons[i].getAttribute('class').catch(() => '');
                    console.log(`   Button ${i + 1}: "${text}" (classes: ${classes})`);
                }
            }
        } else {
            console.log('❌ Name input field not found');
            console.log('🔍 Available input fields:');
            const inputs = await page.locator('input').all();
            for (let i = 0; i < Math.min(inputs.length, 10); i++) {
                const name = await inputs[i].getAttribute('name').catch(() => '');
                const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '');
                const type = await inputs[i].getAttribute('type').catch(() => '');
                console.log(`   Input ${i + 1}: name="${name}" placeholder="${placeholder}" type="${type}"`);
            }
        }
        
        console.log('\n📊 Test Summary:');
        console.log('=' .repeat(50));
        console.log('✅ Successfully navigated to admin portal');
        console.log('✅ Successfully logged in');
        console.log('✅ Successfully navigated to profile page');
        console.log(`${editButton ? '✅' : '❌'} Found and clicked edit button`);
        console.log(`${nameInput ? '✅' : '❌'} Found name input field`);
        console.log(`${saveButton ? '✅' : '❌'} Found save button`);
        
        console.log('\n🖼️  Screenshots saved:');
        console.log('   - test-profile-1-initial.png (initial page)');
        console.log('   - test-profile-2-profile-page.png (profile page)'); 
        console.log('   - test-profile-3-edit-mode.png (edit mode)');
        console.log('   - test-profile-4-final.png (after save attempt)');
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        await page.screenshot({ path: 'test-profile-error.png', fullPage: true });
        console.log('📸 Error screenshot saved as test-profile-error.png');
    } finally {
        await page.waitForTimeout(5000); // Keep browser open for a moment
        await browser.close();
    }
}

// Run the test
testProfileEditing().catch(console.error);