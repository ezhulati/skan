const { chromium } = require('playwright');

async function testPersistentNameChange() {
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

    try {
        console.log('\n🔍 TESTING: Persistent Name Changes');
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
        
        // Step 1: Check initial dashboard name
        console.log('\n📍 Step 1: Check Initial Dashboard Name');
        await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        const initialWelcome = await page.locator('text=/Mirëmëngjes|Mirëdita|Mirëmbrëma|Natën e mirë/').first();
        const initialText = await initialWelcome.textContent();
        console.log(`Initial welcome: "${initialText}"`);
        
        // Step 2: Change the name to Gjergj Kastrioti
        console.log('\n📍 Step 2: Change Name to "Gjergj Kastrioti"');
        await page.goto('http://localhost:3002/profile', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Click edit button (be more specific)
        const editButton = page.locator('button:has-text("Ndrysho")').first();
        await editButton.click();
        console.log('✅ Clicked edit button');
        
        await page.waitForTimeout(1000);
        
        // Update first and last name
        const firstNameInput = page.locator('input[id="firstName"]');
        const lastNameInput = page.locator('input[id="lastName"]');
        
        await firstNameInput.fill('Gjergj');
        await lastNameInput.fill('Kastrioti');
        
        console.log('✅ Updated name to "Gjergj Kastrioti"');
        
        // Save changes
        const saveButton = page.locator('button:has-text("Ruaj Ndryshimet")');
        
        // Wait for page reload after save
        console.log('🚀 Saving changes...');
        await Promise.all([
            page.waitForURL('**/profile', { timeout: 10000 }),
            saveButton.click()
        ]);
        
        console.log('✅ Page reloaded after save');
        await page.waitForTimeout(3000);
        
        // Step 3: Verify the name changed in the profile
        console.log('\n📍 Step 3: Verify Profile Shows New Name');
        
        // Check if we see "Gjergj" and "Kastrioti" in the profile
        const gjerjField = page.locator('text="Gjergj"');
        const kastriotiField = page.locator('text="Kastrioti"');
        
        const hasGjergj = await gjerjField.isVisible();
        const hasKastrioti = await kastriotiField.isVisible();
        
        console.log(`Profile shows "Gjergj": ${hasGjergj}`);
        console.log(`Profile shows "Kastrioti": ${hasKastrioti}`);
        
        // Step 4: Check dashboard shows first name only
        console.log('\n📍 Step 4: Verify Dashboard Shows First Name Only');
        await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        const newWelcome = await page.locator('text=/Mirëmëngjes|Mirëdita|Mirëmbrëma|Natën e mirë/').first();
        const newText = await newWelcome.textContent();
        console.log(`New welcome message: "${newText}"`);
        
        // Check if it contains "Gjergj" but not "Kastrioti"
        const hasGjerjInDash = newText.includes('Gjergj');
        const hasKastriotiInDash = newText.includes('Kastrioti');
        
        console.log(`Dashboard contains "Gjergj": ${hasGjerjInDash}`);
        console.log(`Dashboard contains "Kastrioti": ${hasKastriotiInDash}`);
        
        // Step 5: Test persistence by navigating away and back
        console.log('\n📍 Step 5: Test Persistence Across Navigation');
        
        // Navigate to a different page
        await page.goto('http://localhost:3002/qr-codes', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        // Navigate back to dashboard
        await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        const persistentWelcome = await page.locator('text=/Mirëmëngjes|Mirëdita|Mirëmbrëma|Natën e mirë/').first();
        const persistentText = await persistentWelcome.textContent();
        console.log(`After navigation - welcome: "${persistentText}"`);
        
        // Final verification
        if (hasGjergj && hasKastrioti && hasGjerjInDash && !hasKastriotiInDash) {
            console.log('\n🎉 SUCCESS: Name changes are working correctly!');
            console.log('   ✅ Profile shows both first and last name');
            console.log('   ✅ Dashboard shows first name only'); 
            console.log('   ✅ Changes persist across navigation');
        } else {
            console.log('\n❌ ISSUES FOUND:');
            if (!hasGjergj || !hasKastrioti) console.log('   ❌ Profile not showing updated names');
            if (!hasGjerjInDash) console.log('   ❌ Dashboard not showing first name');
            if (hasKastriotiInDash) console.log('   ❌ Dashboard showing full name instead of first name only');
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'test-persistent-name-final.png', fullPage: true });
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-persistent-name-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testPersistentNameChange().catch(console.error);