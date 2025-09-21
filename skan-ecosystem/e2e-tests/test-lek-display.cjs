// Test script to verify Albanian Lek pricing display
const puppeteer = require('puppeteer');

async function testLekDisplay() {
  console.log('🇦🇱 Testing Albanian Lek pricing display...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 390, height: 844 } // iPhone 12 Pro size
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the customer ordering page
    console.log('📱 Opening customer ordering page...');
    await page.goto('https://order.skan.al/beach-bar-durres/a1/menu', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for menu to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for Lek pricing
    console.log('💰 Checking Albanian Lek pricing...');
    
    // Look for Albanian Beer pricing
    const albanianBeerPrice = await page.$eval('body', el => {
      const text = el.textContent;
      const beerMatch = text.match(/350.*Lek|350.*lek|350 Lek|Birrë.*350/i);
      return beerMatch ? beerMatch[0] : null;
    });
    
    // Look for Greek Salad pricing  
    const greekSaladPrice = await page.$eval('body', el => {
      const text = el.textContent;
      const saladMatch = text.match(/900.*Lek|900.*lek|900 Lek|Sallatë.*900/i);
      return saladMatch ? saladMatch[0] : null;
    });
    
    // Check for currency symbol
    const hasCurrency = await page.$eval('body', el => {
      const text = el.textContent;
      return text.includes('ALL') || text.includes('Lek') || text.includes('lek');
    });
    
    // Take a screenshot
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/lek-pricing-test.png',
      fullPage: true 
    });
    
    console.log('\n✅ TEST RESULTS:');
    console.log('================');
    console.log(`Albanian Beer: ${albanianBeerPrice || 'NOT FOUND'}`);
    console.log(`Greek Salad: ${greekSaladPrice || 'NOT FOUND'}`);
    console.log(`Lek Currency: ${hasCurrency ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`Screenshot saved: lek-pricing-test.png`);
    
    if (albanianBeerPrice && greekSaladPrice && hasCurrency) {
      console.log('\n🎉 SUCCESS: Albanian Lek pricing is working correctly!');
      console.log('🔗 The customer app is now displaying Albanian Lek prices');
      console.log('📊 Example: Albanian Beer shows 350 Lek (was €3.50)');
      console.log('📊 Example: Greek Salad shows 900 Lek (was €8.50)');
    } else {
      console.log('\n❌ ISSUE: Albanian Lek pricing may not be displaying correctly');
      console.log('💡 Check the screenshot for visual verification');
    }
    
  } catch (error) {
    console.error('❌ Error testing Lek display:', error.message);
  }
  
  await browser.close();
}

testLekDisplay().catch(console.error);