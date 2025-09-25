/**
 * Quick test to verify status persistence fix
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3002',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function quickStatusTest() {
  console.log('🧪 Quick Status Persistence Test...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Enable console logging - capture ALL console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔄') || text.includes('BUTTON CLICKED') || text.includes('Mock orders') || 
          text.includes('📊') || text.includes('Forced re-render') || text.includes('Changing order')) {
        console.log('🖥️  KEY:', text);
      }
    });
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Navigating and logging in...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get first order card
    const orderCard = await page.$('.order-card');
    if (!orderCard) {
      console.log('❌ No order card found');
      return;
    }

    console.log('📋 Getting card state before click...');
    const beforeClick = await page.evaluate((card) => {
      const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
      
      // Look for ResponsiveKDSLayout column structure
      const stationLane = card.closest('.station-lane');
      let column = 'Unknown';
      
      if (stationLane) {
        const classList = Array.from(stationLane.classList);
        // Debug: log all classes to see what we're getting
        console.log('🔍 Station classes found:', classList);
        const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
        console.log('🔍 Matched station class:', stationClass);
        if (stationClass) {
          column = stationClass.replace('station-', ''); // Extract status from station-new, station-preparing, etc.
        }
      }
      
      return { orderNum, column };
    }, orderCard);

    console.log(`📊 Before: ${beforeClick.orderNum} in column ${beforeClick.column}`);

    // Click status button
    const statusButton = await orderCard.$('.status-button-clean');
    if (!statusButton) {
      console.log('❌ No status button found');
      return;
    }

    console.log('🔥 CLICKING STATUS BUTTON...');
    
    // Add debug listener before clicking
    await page.evaluate(() => {
      console.log('📍 Adding debug click listener...');
    });
    
    await statusButton.click();
    
    // Give it a moment for handlers to process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Wait 2 seconds for immediate effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterClick = await page.evaluate((before) => {
      const card = document.querySelector('.order-card'); // Get first card
      if (!card) return { found: false };
      
      const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
      
      // Look for ResponsiveKDSLayout column structure
      const stationLane = card.closest('.station-lane');
      let column = 'Unknown';
      
      if (stationLane) {
        const classList = Array.from(stationLane.classList);
        // Debug: log all classes to see what we're getting
        console.log('🔍 Station classes found:', classList);
        const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
        console.log('🔍 Matched station class:', stationClass);
        if (stationClass) {
          column = stationClass.replace('station-', '');
        }
      }
      
      const moved = column !== before.column;
      
      return { found: true, orderNum, column, moved };
    }, beforeClick);

    console.log(`📊 After: ${afterClick.orderNum} in column ${afterClick.column} - Moved: ${afterClick.moved ? '✅' : '❌'}`);

    // Wait for auto-refresh cycle (12 seconds total)
    console.log('⏰ Waiting for auto-refresh to test persistence...');
    await new Promise(resolve => setTimeout(resolve, 12000));

    const afterRefresh = await page.evaluate((before) => {
      const card = document.querySelector('.order-card');
      if (!card) return { found: false };
      
      const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
      
      // Look for ResponsiveKDSLayout column structure
      const stationLane = card.closest('.station-lane');
      let column = 'Unknown';
      
      if (stationLane) {
        const classList = Array.from(stationLane.classList);
        // Debug: log all classes to see what we're getting
        console.log('🔍 Station classes found:', classList);
        const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
        console.log('🔍 Matched station class:', stationClass);
        if (stationClass) {
          column = stationClass.replace('station-', '');
        }
      }
      
      const stayed = column !== before.column; // Still in new column
      
      return { found: true, orderNum, column, stayed };
    }, beforeClick);

    console.log(`📊 After refresh: ${afterRefresh.orderNum} in column ${afterRefresh.column} - Stayed: ${afterRefresh.stayed ? '✅' : '❌'}`);

    // Results
    const success = afterClick.moved && afterRefresh.stayed;
    console.log('\n' + '='.repeat(50));
    console.log(`${success ? '🎉 SUCCESS!' : '❌ FAILED!'}`);
    console.log('='.repeat(50));

    if (!success) {
      if (!afterClick.moved) {
        console.log('❌ Card never moved after button click');
      }
      if (!afterRefresh.stayed) {
        console.log('❌ Card bounced back after auto-refresh');
      }
    }

    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

quickStatusTest().catch(console.error);