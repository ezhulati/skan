/**
 * Debug TV Mode - Check if cards actually move between lanes
 */

const puppeteer = require('puppeteer');

async function debugTVMode() {
  console.log('🔍 DEBUG TV MODE CARD MOVEMENT');
  console.log('===============================');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 2000,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type=\"password\"]', 'BeachBarDemo2024!');
    await page.click('button[type=\"submit\"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check current layout mode
    console.log('📊 Checking layout mode...');
    const layoutInfo = await page.evaluate(() => {
      const deviceIndicator = document.querySelector('[style*="bottom: 10px"]');
      const tvMode = document.querySelector('.kds-tv-mode');
      const tabletMode = document.querySelector('.kds-tablet-mode');
      const phoneMode = document.querySelector('.kds-phone-mode');
      
      return {
        deviceIndicator: deviceIndicator ? deviceIndicator.textContent : 'not found',
        tvMode: tvMode ? 'found' : 'not found',
        tabletMode: tabletMode ? 'found' : 'not found',
        phoneMode: phoneMode ? 'found' : 'not found',
        windowWidth: window.innerWidth
      };
    });
    
    console.log('📱 Layout Info:', layoutInfo);
    
    // Check station lanes in TV mode
    if (layoutInfo.tvMode === 'found') {
      console.log('📋 Checking station lanes...');
      const stationInfo = await page.evaluate(() => {
        const stations = document.querySelectorAll('.station-lane');
        const stationData = [];
        
        stations.forEach(station => {
          const header = station.querySelector('.station-header');
          const orders = station.querySelectorAll('.order-card');
          stationData.push({
            stationClass: station.className,
            header: header ? header.textContent : 'no header',
            orderCount: orders.length,
            orderIds: Array.from(orders).map(card => {
              const orderNum = card.querySelector('.order-number');
              return orderNum ? orderNum.textContent : 'no id';
            })
          });
        });
        
        return stationData;
      });
      
      console.log('🏠 Station Info:');
      stationInfo.forEach((station, i) => {
        console.log(`   Station ${i + 1}: ${station.header} (${station.orderCount} orders)`);
        console.log(`      Class: ${station.stationClass}`);
        console.log(`      Orders: ${station.orderIds.join(', ')}`);
      });
      
      // Try clicking a button and see what happens
      console.log('\n🖱️ Clicking status button...');
      const buttonExists = await page.$('.status-button');
      if (buttonExists) {
        await page.click('.status-button');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check stations again
        console.log('📋 Checking stations after button click...');
        const stationInfoAfter = await page.evaluate(() => {
          const stations = document.querySelectorAll('.station-lane');
          const stationData = [];
          
          stations.forEach(station => {
            const header = station.querySelector('.station-header');
            const orders = station.querySelectorAll('.order-card');
            stationData.push({
              header: header ? header.textContent : 'no header',
              orderCount: orders.length,
              orderIds: Array.from(orders).map(card => {
                const orderNum = card.querySelector('.order-number');
                return orderNum ? orderNum.textContent : 'no id';
              })
            });
          });
          
          return stationData;
        });
        
        console.log('🏠 Station Info AFTER Click:');
        stationInfoAfter.forEach((station, i) => {
          console.log(`   Station ${i + 1}: ${station.header} (${station.orderCount} orders)`);
          console.log(`      Orders: ${station.orderIds.join(', ')}`);
        });
        
        // Compare before and after
        const changed = JSON.stringify(stationInfo) !== JSON.stringify(stationInfoAfter);
        console.log(`\n🎯 MOVEMENT DETECTED: ${changed ? 'YES' : 'NO'}`);
        
      } else {
        console.log('❌ No status buttons found!');
      }
      
    } else {
      console.log('❌ TV mode not active!');
    }
    
    // Keep browser open for inspection
    console.log('\n👀 Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the debug
if (require.main === module) {
  debugTVMode().catch(console.error);
}

module.exports = debugTVMode;