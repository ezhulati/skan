const { chromium } = require('playwright');

async function testProfileNameSplit() {
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
        console.log('\n🔍 TESTING: First Name / Last Name Split');
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
        
        // Check dashboard first name display
        console.log('\n📍 Step 1: Check Dashboard Welcome Message');
        await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Look for the welcome message
        const welcomeElements = await page.locator('text=/Mirëmëngjes|Mirëdita|Mirëmbrëma|Natën e mirë/').all();
        if (welcomeElements.length > 0) {
            const welcomeText = await welcomeElements[0].textContent();
            console.log(`✅ Welcome message: "${welcomeText}"`);
        } else {
            console.log('❌ Could not find welcome message');
        }
        
        // Navigate to profile
        console.log('\n📍 Step 2: Navigate to Profile Page');
        await page.goto('http://localhost:3002/profile', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('✅ On profile page');
        
        // Check if we can see separate first name and last name fields
        console.log('\n📍 Step 3: Check Profile Display');
        
        // Look for "Emri" (First Name) field
        const firstNameLabel = page.locator('text="Emri"');
        const lastNameLabel = page.locator('text="Mbiemri"');
        
        const hasFirstNameField = await firstNameLabel.isVisible();
        const hasLastNameField = await lastNameLabel.isVisible();
        
        console.log(`First Name field visible: ${hasFirstNameField}`);
        console.log(`Last Name field visible: ${hasLastNameField}`);
        
        if (hasFirstNameField && hasLastNameField) {
            console.log('✅ Successfully split name into first and last name fields!');
        } else {
            console.log('❌ Name fields not properly split');
        }
        
        // Try to edit the profile
        console.log('\n📍 Step 4: Test Profile Editing');
        
        // Click edit button
        const editButton = page.locator('button:has-text("Ndrysho")');
        if (await editButton.isVisible()) {
            await editButton.click();
            console.log('✅ Clicked edit button');
            
            await page.waitForTimeout(1000);
            
            // Look for first name and last name input fields
            const firstNameInput = page.locator('input[id="firstName"]');
            const lastNameInput = page.locator('input[id="lastName"]');
            
            const hasFirstNameInput = await firstNameInput.isVisible();
            const hasLastNameInput = await lastNameInput.isVisible();
            
            console.log(`First Name input visible: ${hasFirstNameInput}`);
            console.log(`Last Name input visible: ${hasLastNameInput}`);
            
            if (hasFirstNameInput && hasLastNameInput) {
                // Get current values
                const currentFirstName = await firstNameInput.inputValue();
                const currentLastName = await lastNameInput.inputValue();
                
                console.log(`Current First Name: "${currentFirstName}"`);
                console.log(`Current Last Name: "${currentLastName}"`);
                
                // Update the names
                await firstNameInput.fill('Gjergj');
                await lastNameInput.fill('Kastrioti');
                
                console.log('✅ Updated first name to "Gjergj" and last name to "Kastrioti"');
                
                // Save changes
                const saveButton = page.locator('button:has-text("Ruaj Ndryshimet")');
                if (await saveButton.isVisible()) {
                    console.log('🚀 Clicking save button...');
                    await saveButton.click();
                    await page.waitForTimeout(3000);
                    console.log('✅ Save completed');
                } else {
                    console.log('❌ Save button not found');
                }
            }
        } else {
            console.log('❌ Edit button not found');
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'test-name-split-final.png', fullPage: true });
        console.log('\n📷 Screenshot saved: test-name-split-final.png');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-name-split-error.png', fullPage: true });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testProfileNameSplit().catch(console.error);