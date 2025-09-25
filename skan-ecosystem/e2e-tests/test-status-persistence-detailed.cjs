/**
 * CRITICAL TEST: Comprehensive status persistence verification 
 * This test will verify that order status changes persist across refreshes
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3002',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function comprehensiveStatusTest() {
  console.log('🔍 CRITICAL TEST: Comprehensive Status Persistence Analysis...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Capture ALL console messages for deep analysis
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
      
      // Show critical messages
      if (text.includes('🔄') || text.includes('BUTTON CLICKED') || text.includes('Mock orders') || 
          text.includes('API') || text.includes('status') || text.includes('pending') ||
          text.includes('Preserving') || text.includes('Direct API')) {
        console.log(`🖥️  [${msg.type().toUpperCase()}]:`, text);
      }
    });
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Step 1: Login and wait for orders to load...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    
    // Wait for orders to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Step 2: Analyzing initial order states...');
    const initialState = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.order-card'));
      return cards.map(card => {
        const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
        const stationLane = card.closest('.station-lane');
        let column = 'Unknown';
        
        if (stationLane) {
          const classList = Array.from(stationLane.classList);
          const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
          if (stationClass) {
            column = stationClass.replace('station-', '');
          }
        }
        
        return { orderNum, column, element: cards.indexOf(card) };
      });
    });

    console.log('📋 Initial Order States:');
    initialState.forEach(order => {
      console.log(`   ${order.orderNum}: ${order.column}`);
    });

    if (initialState.length === 0) {
      console.log('❌ No orders found - cannot perform status persistence test');
      return;
    }

    // Find first order that can be moved (has a status button)
    const testOrderIndex = 0;
    const testOrder = initialState[testOrderIndex];
    console.log(`🎯 Step 3: Testing with order: ${testOrder.orderNum} (currently in ${testOrder.column})`);

    // Get the order card and its status button
    const orderCard = await page.$('.order-card');
    const statusButton = await orderCard.$('.status-button-clean');
    
    if (!statusButton) {
      console.log('❌ No status button found - cannot test status changes');
      return;
    }

    console.log('🔥 Step 4: Clicking status button to change order status...');
    await statusButton.click();
    
    // Wait for immediate UI update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check immediate status after button click
    const afterClickState = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.order-card'));
      return cards.map(card => {
        const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
        const stationLane = card.closest('.station-lane');
        let column = 'Unknown';
        
        if (stationLane) {
          const classList = Array.from(stationLane.classList);
          const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
          if (stationClass) {
            column = stationClass.replace('station-', '');
          }
        }
        
        return { orderNum, column };
      });
    });

    console.log('📊 Step 5: States after button click:');
    afterClickState.forEach(order => {
      const initialOrder = initialState.find(o => o.orderNum === order.orderNum);
      const moved = initialOrder && initialOrder.column !== order.column;
      console.log(`   ${order.orderNum}: ${initialOrder?.column} → ${order.column} ${moved ? '✅ MOVED' : '❌ NO CHANGE'}`);
    });

    // Wait for API call to complete (give it time)
    console.log('⏳ Step 6: Waiting for API call to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔄 Step 7: Testing MANUAL refresh - this should preserve changes...');
    const refreshButton = await page.$('.refresh-button');
    if (refreshButton) {
      await refreshButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for refresh
    } else {
      console.log('⚠️ No refresh button found, using page reload');
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Check state after manual refresh
    const afterManualRefreshState = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.order-card'));
      return cards.map(card => {
        const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
        const stationLane = card.closest('.station-lane');
        let column = 'Unknown';
        
        if (stationLane) {
          const classList = Array.from(stationLane.classList);
          const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
          if (stationClass) {
            column = stationClass.replace('station-', '');
          }
        }
        
        return { orderNum, column };
      });
    });

    console.log('📊 Step 8: States after MANUAL refresh:');
    afterManualRefreshState.forEach(order => {
      const initialOrder = initialState.find(o => o.orderNum === order.orderNum);
      const afterClickOrder = afterClickState.find(o => o.orderNum === order.orderNum);
      const persistedChange = afterClickOrder && afterClickOrder.column === order.column;
      const bouncedBack = initialOrder && initialOrder.column === order.column;
      
      console.log(`   ${order.orderNum}: ${initialOrder?.column} → ${afterClickOrder?.column} → ${order.column} ${
        persistedChange ? '✅ PERSISTED' : bouncedBack ? '❌ BOUNCED BACK' : '🤔 UNKNOWN'
      }`);
    });

    console.log('⏳ Step 9: Waiting for AUTO-refresh cycle (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 12000)); // Wait for auto-refresh

    // Check state after auto-refresh
    const afterAutoRefreshState = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.order-card'));
      return cards.map(card => {
        const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
        const stationLane = card.closest('.station-lane');
        let column = 'Unknown';
        
        if (stationLane) {
          const classList = Array.from(stationLane.classList);
          const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
          if (stationClass) {
            column = stationClass.replace('station-', '');
          }
        }
        
        return { orderNum, column };
      });
    });

    console.log('📊 Step 10: States after AUTO-refresh:');
    afterAutoRefreshState.forEach(order => {
      const initialOrder = initialState.find(o => o.orderNum === order.orderNum);
      const afterClickOrder = afterClickState.find(o => o.orderNum === order.orderNum);
      const afterManualOrder = afterManualRefreshState.find(o => o.orderNum === order.orderNum);
      const persistedChange = afterClickOrder && afterClickOrder.column === order.column;
      const bouncedBack = initialOrder && initialOrder.column === order.column;
      
      console.log(`   ${order.orderNum}: Initial(${initialOrder?.column}) → Click(${afterClickOrder?.column}) → Manual(${afterManualOrder?.column}) → Auto(${order.column}) ${
        persistedChange ? '✅ STILL PERSISTED' : bouncedBack ? '❌ BOUNCED BACK ON AUTO' : '🤔 UNKNOWN'
      }`);
    });

    // Analysis
    console.log('\n' + '='.repeat(80));
    console.log('📈 COMPREHENSIVE STATUS PERSISTENCE ANALYSIS');
    console.log('='.repeat(80));

    // Check for critical console messages
    const criticalMessages = consoleMessages.filter(msg => 
      msg.text.includes('API update error') || 
      msg.text.includes('Reverting optimistic') ||
      msg.text.includes('API failed') ||
      msg.text.includes('pending status') ||
      msg.text.includes('Mock orders loaded')
    );

    console.log('🔍 Critical Console Messages:');
    criticalMessages.forEach(msg => {
      console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
    });

    // Determine the root cause
    const testOrderInitial = initialState[testOrderIndex];
    const testOrderAfterClick = afterClickState.find(o => o.orderNum === testOrderInitial.orderNum);
    const testOrderAfterManual = afterManualRefreshState.find(o => o.orderNum === testOrderInitial.orderNum);
    const testOrderAfterAuto = afterAutoRefreshState.find(o => o.orderNum === testOrderInitial.orderNum);

    const immediateChangeWorked = testOrderAfterClick && testOrderAfterClick.column !== testOrderInitial.column;
    const manualRefreshPersisted = testOrderAfterManual && testOrderAfterClick && testOrderAfterManual.column === testOrderAfterClick.column;
    const autoRefreshPersisted = testOrderAfterAuto && testOrderAfterClick && testOrderAfterAuto.column === testOrderAfterClick.column;

    console.log('📊 ROOT CAUSE ANALYSIS:');
    console.log(`   ✅ Immediate UI update: ${immediateChangeWorked ? 'WORKS' : 'BROKEN'}`);
    console.log(`   ${manualRefreshPersisted ? '✅' : '❌'} Manual refresh persistence: ${manualRefreshPersisted ? 'WORKS' : 'BROKEN'}`);
    console.log(`   ${autoRefreshPersisted ? '✅' : '❌'} Auto refresh persistence: ${autoRefreshPersisted ? 'WORKS' : 'BROKEN'}`);

    if (immediateChangeWorked && !autoRefreshPersisted) {
      console.log('🚨 PROBLEM IDENTIFIED: Auto-refresh is overriding status changes!');
      console.log('🔧 LIKELY CAUSE: API calls failing or server not persisting changes');
    } else if (!immediateChangeWorked) {
      console.log('🚨 PROBLEM IDENTIFIED: Status button not working at all!');
    } else if (autoRefreshPersisted) {
      console.log('🎉 SYSTEM WORKING: Status changes persist correctly!');
    }

    // Keep browser open for manual inspection
    console.log('\n🔍 Keeping browser open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

comprehensiveStatusTest().catch(console.error);