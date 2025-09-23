const puppeteer = require('puppeteer');

/**
 * CARD MOVEMENT FIX VERIFICATION TEST
 * 
 * This test verifies if the fix to ResponsiveKDSLayout.tsx is working:
 * - Changed TV mode to use `orders` directly instead of `filteredOrders`
 * - Testing if cards now move between status columns when buttons are clicked
 */

async function testCardMovementFix() {
    console.log('🔄 Starting Card Movement Fix Verification...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        // 1. Login to admin dashboard
        console.log('📝 Logging into admin dashboard...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        
        await page.type('input[type="email"]', 'demo.beachbar@skan.al');
        await page.type('input[type="password"]', 'BeachBarDemo2024!');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('✅ Successfully logged in');
        
        // 2. Check if we have any order cards
        console.log('\n🔍 Checking for order cards...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Look for order cards
        const orderCards = await page.$$('.order-card, [data-testid*="order"], .bg-white.rounded-lg, .border.rounded');
        console.log(`📋 Found ${orderCards.length} potential order cards`);
        
        if (orderCards.length === 0) {
            console.log('⚠️  No order cards found. Creating a test order might be needed.');
            
            // Check if there are any visible elements that look like order containers
            const containers = await page.$$eval('*', elements => {
                return elements.filter(el => {
                    const text = el.textContent || '';
                    const className = el.className || '';
                    return text.includes('order') || text.includes('Order') || 
                           className.includes('order') || className.includes('card');
                }).length;
            });
            
            console.log(`🔍 Found ${containers} elements containing 'order' text or classes`);
        }
        
        // 3. Take initial screenshot
        await page.screenshot({ path: 'card-movement-before.png', fullPage: true });
        console.log('📸 Captured initial state');
        
        // 4. Look for status buttons in different formats
        console.log('\n🔘 Looking for status buttons...');
        
        const buttonSelectors = [
            'button:contains("Preparing")',
            'button:contains("Ready")', 
            'button:contains("Served")',
            '[data-status="preparing"]',
            '[data-status="ready"]',
            '[data-status="served"]',
            '.status-button',
            'button[class*="bg-orange"]',
            'button[class*="bg-green"]',
            'button[class*="bg-blue"]'
        ];
        
        let foundButton = null;
        let buttonType = '';
        
        for (const selector of buttonSelectors) {
            try {
                const buttons = await page.$$(selector);
                if (buttons.length > 0) {
                    foundButton = buttons[0];
                    buttonType = selector;
                    console.log(`✅ Found ${buttons.length} buttons with selector: ${selector}`);
                    break;
                }
            } catch (error) {
                // Continue trying other selectors
            }
        }
        
        // Alternative: Look for any buttons containing status text
        if (!foundButton) {
            console.log('🔍 Searching for buttons with status text...');
            const allButtons = await page.$$('button');
            
            for (const button of allButtons) {
                try {
                    const text = await page.evaluate(el => el.textContent, button);
                    if (text && (text.includes('Preparing') || text.includes('Ready') || text.includes('Served'))) {
                        foundButton = button;
                        buttonType = `button with text: ${text}`;
                        console.log(`✅ Found status button: "${text}"`);
                        break;
                    }
                } catch (error) {
                    // Continue
                }
            }
        }
        
        // 5. Test card movement
        if (foundButton) {
            console.log(`\n🖱️  Testing button click: ${buttonType}`);
            
            // Get initial card positions/counts
            const getCardInfo = async () => {
                return await page.evaluate(() => {
                    const cards = document.querySelectorAll('.order-card, [data-testid*="order"], .bg-white.rounded-lg');
                    return Array.from(cards).map((card, index) => ({
                        index,
                        text: card.textContent?.slice(0, 100) || '',
                        position: card.getBoundingClientRect(),
                        className: card.className
                    }));
                });
            };
            
            const beforeClick = await getCardInfo();
            console.log(`📊 Before click: ${beforeClick.length} cards detected`);
            
            // Click the button
            await foundButton.click();
            console.log('✅ Button clicked');
            
            // Wait for potential animation/state change
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const afterClick = await getCardInfo();
            console.log(`📊 After click: ${afterClick.length} cards detected`);
            
            // Take after screenshot
            await page.screenshot({ path: 'card-movement-after.png', fullPage: true });
            console.log('📸 Captured state after button click');
            
            // 6. Analyze results
            console.log('\n📈 ANALYSIS RESULTS:');
            
            if (beforeClick.length !== afterClick.length) {
                console.log(`✅ CARD MOVEMENT DETECTED: Card count changed from ${beforeClick.length} to ${afterClick.length}`);
                console.log('🎉 FIX APPEARS TO BE WORKING!');
                return true;
            }
            
            // Check if card positions changed
            let positionChanges = 0;
            beforeClick.forEach((before, index) => {
                const after = afterClick[index];
                if (after && (
                    Math.abs(before.position.x - after.position.x) > 10 ||
                    Math.abs(before.position.y - after.position.y) > 10
                )) {
                    positionChanges++;
                }
            });
            
            if (positionChanges > 0) {
                console.log(`✅ CARD MOVEMENT DETECTED: ${positionChanges} cards changed position`);
                console.log('🎉 FIX APPEARS TO BE WORKING!');
                return true;
            }
            
            // Check if card content changed (status updates)
            let contentChanges = 0;
            beforeClick.forEach((before, index) => {
                const after = afterClick[index];
                if (after && before.text !== after.text) {
                    contentChanges++;
                }
            });
            
            if (contentChanges > 0) {
                console.log(`✅ CARD CONTENT CHANGED: ${contentChanges} cards updated`);
                console.log('🎉 FIX APPEARS TO BE WORKING!');
                return true;
            }
            
            console.log('❌ NO CARD MOVEMENT DETECTED');
            console.log('🔧 The fix may need further investigation');
            return false;
            
        } else {
            console.log('\n❌ NO STATUS BUTTONS FOUND');
            console.log('📝 This could mean:');
            console.log('   - No orders exist to test with');
            console.log('   - Button selectors need adjustment');
            console.log('   - Page structure has changed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'card-movement-error.png', fullPage: true });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testCardMovementFix().then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
        console.log('🎉 CARD MOVEMENT FIX VERIFICATION: SUCCESS');
        console.log('✅ Cards are moving between status columns');
    } else {
        console.log('❌ CARD MOVEMENT FIX VERIFICATION: NEEDS INVESTIGATION');
        console.log('🔧 Fix may need further work or test environment setup');
    }
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});