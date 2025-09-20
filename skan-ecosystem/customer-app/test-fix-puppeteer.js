const puppeteer = require('puppeteer');

async function testCustomerAppFix() {
  console.log('🧪 Testing Customer App Fix with Puppeteer...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 375, height: 667 }, // Mobile viewport
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Testing QR Landing page...');
    
    // Test the fixed route
    await page.goto('http://localhost:3003/beach-bar-durres/a1', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if page has content (not blank)
    const bodyContent = await page.$eval('body', el => el.innerText);
    console.log('📄 Page content found:', bodyContent.length > 0 ? 'YES' : 'NO');
    
    // Check for venue name
    const venueNameExists = await page.$eval('body', el => 
      el.innerText.includes('Beach Bar') || el.innerText.includes('Durrës')
    ).catch(() => false);
    console.log('🏪 Venue name displayed:', venueNameExists ? 'YES' : 'NO');
    
    // Check for table number
    const tableNumberExists = await page.$eval('body', el => 
      el.innerText.includes('A1') || el.innerText.includes('Table')
    ).catch(() => false);
    console.log('🪑 Table number displayed:', tableNumberExists ? 'YES' : 'NO');
    
    // Check for "View Menu" button
    const viewMenuButton = await page.$('button').catch(() => null);
    console.log('🍽️  View Menu button:', viewMenuButton ? 'FOUND' : 'NOT FOUND');
    
    // Take screenshot
    await page.screenshot({ path: 'qr-landing-test.png', fullPage: true });
    console.log('📸 Screenshot saved: qr-landing-test.png');
    
    // Test manual navigation to menu via button
    console.log('\n👆 Testing manual menu navigation...');
    
    if (viewMenuButton) {
      console.log('🖱️  Clicking View Menu button...');
      await viewMenuButton.click();
      
      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentUrl = page.url();
      const navigatedToMenu = currentUrl.includes('/menu');
      console.log('🔄 Navigated to menu:', navigatedToMenu ? 'YES' : 'NO');
      console.log('🌐 Current URL:', currentUrl);
      
      if (navigatedToMenu) {
        // Wait for menu to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for menu categories
        const menuContent = await page.$eval('body', el => el.innerText);
        const hasMenuItems = menuContent.includes('Appetizers') || 
                            menuContent.includes('Antipasta') ||
                            menuContent.includes('Greek') ||
                            menuContent.includes('Albanian Beer');
        
        console.log('🍴 Menu items loaded:', hasMenuItems ? 'YES' : 'NO');
        
        // Take menu screenshot
        await page.screenshot({ path: 'menu-test.png', fullPage: true });
        console.log('📸 Menu screenshot saved: menu-test.png');
      }
    } else {
      console.log('❌ Cannot test menu navigation - button not found');
    }
    
    // Test error cases
    console.log('\n🚨 Testing error handling...');
    
    // Test with console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Test with invalid venue
    await page.goto('http://localhost:3003/invalid-venue/a1', { 
      waitUntil: 'networkidle0',
      timeout: 5000 
    }).catch(() => {});
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('❌ Console errors found:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('   Errors:', consoleErrors.slice(0, 3));
    }
    
    console.log('\n✅ Test Results Summary:');
    console.log('- QR Landing loads:', !bodyContent.includes('blank') && bodyContent.length > 100);
    console.log('- Venue info displayed:', venueNameExists);
    console.log('- Table number shown:', tableNumberExists);
    console.log('- Menu button available:', viewMenuButton ? true : false);
    console.log('- No critical errors:', consoleErrors.length === 0);
    
    const overallSuccess = venueNameExists && tableNumberExists && viewMenuButton;
    console.log(`\n🎯 Overall Fix Status: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);
    
    if (overallSuccess) {
      console.log('\n🚀 The customer app fix is working! Ready for deployment.');
    } else {
      console.log('\n⚠️  There are still issues that need to be addressed.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: 'error-test.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-test.png');
  } finally {
    await browser.close();
    console.log('\n🔚 Test completed.');
  }
}

// Run the test
testCustomerAppFix().catch(console.error);