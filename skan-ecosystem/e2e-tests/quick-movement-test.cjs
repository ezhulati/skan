/**
 * Quick Card Movement Test - Fast verification
 */

const puppeteer = require('puppeteer');

async function quickMovementTest() {
  console.log('🚀 QUICK CARD MOVEMENT TEST');
  console.log('===========================');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 500,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Quick login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type=\"password\"]', 'BeachBarDemo2024!');
    await page.click('button[type=\"submit\"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check initial card distribution
    console.log('📊 Checking initial card distribution...');
    const initialDistribution = await page.evaluate(() => {
      const cards = document.querySelectorAll('.order-card');
      const distribution = {};
      
      cards.forEach(card => {
        const statusElement = card.querySelector('.order-status');
        const status = statusElement ? statusElement.textContent.trim() : 'unknown';
        distribution[status] = (distribution[status] || 0) + 1;
      });
      
      return {
        total: cards.length,
        distribution: distribution
      };
    });
    
    console.log(`📋 Initial: ${initialDistribution.total} cards, Distribution:`, initialDistribution.distribution);
    
    if (initialDistribution.total === 0) {
      console.log('❌ No cards found!');
      return false;
    }
    
    // Click a button
    console.log('🖱️ Clicking first status button...');
    const buttonExists = await page.$('.status-button');
    if (!buttonExists) {
      console.log('❌ No buttons found!');
      return false;
    }
    
    await page.click('.status-button');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check final card distribution
    console.log('📊 Checking final card distribution...');
    const finalDistribution = await page.evaluate(() => {
      const cards = document.querySelectorAll('.order-card');
      const distribution = {};
      
      cards.forEach(card => {
        const statusElement = card.querySelector('.order-status');
        const status = statusElement ? statusElement.textContent.trim() : 'unknown';
        distribution[status] = (distribution[status] || 0) + 1;
      });
      
      return {
        total: cards.length,
        distribution: distribution
      };
    });
    
    console.log(`📋 Final: ${finalDistribution.total} cards, Distribution:`, finalDistribution.distribution);
    
    // Compare distributions
    const distributionChanged = JSON.stringify(initialDistribution.distribution) !== JSON.stringify(finalDistribution.distribution);
    
    console.log('\n🎯 RESULTS:');
    console.log(`✅ Cards Found: ${initialDistribution.total > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Button Clicked: YES`);
    console.log(`✅ Distribution Changed: ${distributionChanged ? 'YES' : 'NO'}`);
    
    if (distributionChanged) {
      console.log('🎉 SUCCESS: Card movement detected!');
      return true;
    } else {
      console.log('❌ FAILED: No card movement detected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  quickMovementTest()
    .then((success) => {
      console.log('\n' + '='.repeat(50));
      if (success) {
        console.log('🎉 CARD MOVEMENT - WORKING!');
      } else {
        console.log('❌ CARD MOVEMENT - NOT WORKING');
      }
    })
    .catch(console.error);
}

module.exports = quickMovementTest;