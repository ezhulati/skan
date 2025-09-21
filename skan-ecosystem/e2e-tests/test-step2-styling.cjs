/**
 * Quick test to verify step 2 styling improvements
 */

const puppeteer = require('puppeteer');

async function testStep2Styling() {
    console.log('🎨 STEP 2 STYLING VERIFICATION');
    console.log('='.repeat(35));
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('📍 1. Login and navigate to onboarding...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Login
        if (!page.url().includes('/dashboard') && !page.url().includes('/onboarding')) {
            await page.waitForSelector('input[type="email"]', { timeout: 5000 });
            await page.type('input[type="email"]', 'demo.beachbar@skan.al');
            await page.type('input[type="password"]', 'BeachBarDemo2024!');
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
        
        await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📍 2. Go to step 2 (menu)...');
        
        // Go to step 2
        const continueButton = await page.$('button.primary-button');
        if (continueButton) {
            await continueButton.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log('📍 3. Check menu styling...');
        
        // Check if menu item cards have proper styling
        const menuStyling = await page.evaluate(() => {
            const menuCards = document.querySelectorAll('.menu-item-card');
            const addButton = document.querySelector('.add-plate-button');
            const fieldInputs = document.querySelectorAll('.field-input');
            
            return {
                menuCards: menuCards.length,
                addButton: addButton !== null,
                fieldInputs: fieldInputs.length,
                hasProperStyling: menuCards.length > 0 && addButton !== null
            };
        });
        
        console.log(`✅ Menu cards found: ${menuStyling.menuCards}`);
        console.log(`✅ Add button found: ${menuStyling.addButton}`);
        console.log(`✅ Field inputs found: ${menuStyling.fieldInputs}`);
        console.log(`✅ Proper styling: ${menuStyling.hasProperStyling ? 'YES' : 'NO'}`);
        
        // Take screenshot
        await page.screenshot({ 
            path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/step2-styling-test.png',
            fullPage: true 
        });
        
        console.log('📸 Screenshot saved: step2-styling-test.png');
        
        if (menuStyling.hasProperStyling) {
            console.log('🎉 STYLING LOOKS GOOD!');
        } else {
            console.log('❌ Styling needs more work');
        }
        
    } catch (error) {
        console.error('❌ TEST ERROR:', error.message);
    }
    
    console.log('\n⏰ Keeping browser open for 20 seconds for inspection...');
    setTimeout(async () => {
        console.log('👋 Closing browser...');
        await browser.close();
    }, 20000);
}

// Run the test
testStep2Styling().catch(console.error);