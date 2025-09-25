/**
 * Test to verify order status update persistence
 * Tests that cards stay in their new lanes after status button clicks
 * CRITICAL: This test must reproduce and fix the bounce-back issue
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3002',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false, // Keep visible to see the bounce-back
  TIMEOUT: 30000,
  AUTO_REFRESH_INTERVAL: 10000 // Dashboard auto-refreshes every 10 seconds
};

async function testStatusPersistence() {
  console.log('🧪 Starting Status Persistence Test...');
  console.log(`📱 Admin URL: ${CONFIG.ADMIN_URL}`);
  console.log('🎯 GOAL: Verify cards stay in new lanes after status update');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log('🖥️  PAGE:', msg.text()));
    page.on('pageerror', error => console.log('❌ PAGE ERROR:', error.message));
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Navigating to admin portal...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });

    // Login
    console.log('🔐 Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.TIMEOUT });
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Find order cards in NEW status
    console.log('🔍 Looking for NEW orders to test status update...');
    const newOrders = await page.$$('.orders-column[data-status="3"] .order-card');
    
    if (newOrders.length === 0) {
      console.log('⚠️  No NEW orders found. Creating mock test scenario...');
      // For now, let's test with any available order
      const allOrders = await page.$$('.order-card');
      if (allOrders.length === 0) {
        console.log('❌ No orders found at all. Cannot test status persistence.');
        return;
      }
      console.log(`📋 Found ${allOrders.length} total orders. Will test with first available.`);
    }

    // Get the first NEW order card
    const targetCard = newOrders.length > 0 ? newOrders[0] : (await page.$$('.order-card'))[0];
    
    if (!targetCard) {
      console.log('❌ No target card found for testing');
      return;
    }

    // Get card details before status update
    console.log('📊 Getting initial card state...');
    const initialState = await page.evaluate((card) => {
      const orderNumber = card.querySelector('.order-number')?.textContent || 'Unknown';
      const currentStatus = card.closest('.orders-column')?.dataset.status || 'Unknown';
      const statusText = card.querySelector('.order-status')?.textContent || 'Unknown';
      
      return {
        orderNumber,
        currentStatus, 
        statusText,
        cardId: card.id || 'no-id'
      };
    }, targetCard);

    console.log('📋 Initial Card State:', initialState);

    // Find and click the status update button (should move to PREPARING)
    console.log('🎯 Looking for status update button...');
    const statusButton = await targetCard.$('.status-button, button[data-action]');
    
    if (!statusButton) {
      console.log('❌ No status button found on card');
      return;
    }

    // Take screenshot before update
    await page.screenshot({ path: path.join(__dirname, 'before-status-update.png') });
    console.log('📸 Screenshot saved: before-status-update.png');

    // THE CRITICAL TEST: Click status button and monitor for bounce-back
    console.log('🔥 CLICKING STATUS BUTTON - Starting critical test phase...');
    
    // Add function to monitor card position
    await page.evaluate(() => {
      window.cardPositionMonitor = {
        positions: [],
        startTime: Date.now(),
        log: function(event, orderNumber, status, columnStatus) {
          const entry = {
            timestamp: Date.now() - this.startTime,
            event,
            orderNumber,
            status,
            columnStatus,
            time: new Date().toISOString()
          };
          this.positions.push(entry);
          console.log(`📍 POSITION MONITOR: ${entry.timestamp}ms - ${event} - ${orderNumber} - Status: ${status} - Column: ${columnStatus}`);
        }
      };
    });

    // Monitor initial position
    await page.evaluate((initialState) => {
      window.cardPositionMonitor.log('INITIAL_POSITION', initialState.orderNumber, initialState.statusText, initialState.currentStatus);
    }, initialState);

    // Click the button
    await statusButton.click();
    console.log('✅ Status button clicked!');

    // Monitor position immediately after click
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.evaluate((initialState) => {
      const updatedCard = document.querySelector(`[data-order-number="${initialState.orderNumber}"]`);
      if (updatedCard) {
        const newColumn = updatedCard.closest('.orders-column')?.dataset.status || 'Unknown';
        const newStatus = updatedCard.querySelector('.order-status')?.textContent || 'Unknown';
        window.cardPositionMonitor.log('IMMEDIATE_AFTER_CLICK', initialState.orderNumber, newStatus, newColumn);
      }
    }, initialState);

    // Wait and monitor during the critical auto-refresh window
    console.log('⏰ Monitoring card position during auto-refresh cycle...');
    
    for (let i = 1; i <= 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second
      
      const currentState = await page.evaluate((initialState) => {
        const card = document.querySelector(`[data-order-number="${initialState.orderNumber}"]`);
        if (!card) {
          return { found: false };
        }
        
        const column = card.closest('.orders-column');
        const columnStatus = column?.dataset.status || 'Unknown';
        const statusText = card.querySelector('.order-status')?.textContent || 'Unknown';
        
        window.cardPositionMonitor.log(`CHECK_${i}`, initialState.orderNumber, statusText, columnStatus);
        
        return {
          found: true,
          columnStatus,
          statusText,
          timestamp: i
        };
      }, initialState);

      if (!currentState.found) {
        console.log(`❌ Card disappeared at ${i}s`);
        break;
      }

      if (currentState.columnStatus !== initialState.currentStatus) {
        console.log(`✅ Card moved to new column: ${currentState.columnStatus} at ${i}s`);
      }

      // Critical check at 10 seconds (auto-refresh time)
      if (i === 10) {
        console.log('🚨 CRITICAL CHECK: Auto-refresh should happen around now...');
        await page.screenshot({ path: path.join(__dirname, 'at-autorefresh-10s.png') });
      }
      
      // Extended monitoring to catch delayed bounce-back
      if (i === 12) {
        console.log('🔍 EXTENDED CHECK: Looking for delayed bounce-back...');
        await page.screenshot({ path: path.join(__dirname, 'after-autorefresh-12s.png') });
      }
    }

    // Final position check
    console.log('🏁 Final position verification...');
    const finalState = await page.evaluate((initialState) => {
      const card = document.querySelector(`[data-order-number="${initialState.orderNumber}"]`);
      if (!card) {
        window.cardPositionMonitor.log('FINAL_CHECK', initialState.orderNumber, 'NOT_FOUND', 'NOT_FOUND');
        return { found: false };
      }
      
      const column = card.closest('.orders-column');
      const columnStatus = column?.dataset.status || 'Unknown';
      const statusText = card.querySelector('.order-status')?.textContent || 'Unknown';
      
      window.cardPositionMonitor.log('FINAL_CHECK', initialState.orderNumber, statusText, columnStatus);
      
      return {
        found: true,
        columnStatus,
        statusText
      };
    }, initialState);

    // Get complete monitoring log
    const positionLog = await page.evaluate(() => window.cardPositionMonitor.positions);
    
    // Analysis
    console.log('\n📋 POSITION ANALYSIS:');
    console.log('='.repeat(70));
    
    let cardMoved = false;
    let cardBouncedBack = false;
    let newColumnStatus = null;
    
    positionLog.forEach((entry, index) => {
      console.log(`${entry.timestamp.toString().padStart(5)}ms | ${entry.event.padEnd(20)} | ${entry.status.padEnd(10)} | Column: ${entry.columnStatus}`);
      
      if (entry.columnStatus !== initialState.currentStatus && !cardMoved) {
        cardMoved = true;
        newColumnStatus = entry.columnStatus;
        console.log(`  → Card moved from ${initialState.currentStatus} to ${entry.columnStatus} ✅`);
      }
      
      if (cardMoved && entry.columnStatus === initialState.currentStatus && !cardBouncedBack) {
        cardBouncedBack = true;
        console.log(`  → Card bounced back to ${entry.columnStatus} ❌`);
      }
    });

    // Take final screenshot
    await page.screenshot({ path: path.join(__dirname, 'final-status-check.png') });

    // Results
    console.log('\n' + '='.repeat(70));
    console.log('🎯 STATUS PERSISTENCE TEST RESULTS:');
    console.log('='.repeat(70));
    
    console.log(`📊 Initial Status: ${initialState.currentStatus}`);
    console.log(`📊 Card Moved: ${cardMoved ? '✅ YES' : '❌ NO'}`);
    
    if (cardMoved) {
      console.log(`📊 New Status: ${newColumnStatus}`);
      console.log(`📊 Bounced Back: ${cardBouncedBack ? '❌ YES (BUG!)' : '✅ NO'}`);
    }
    
    console.log(`📊 Final Status: ${finalState.found ? finalState.columnStatus : 'NOT FOUND'}`);
    
    const testPassed = cardMoved && !cardBouncedBack;
    
    console.log('\n' + '='.repeat(70));
    console.log(`${testPassed ? '🎉 TEST PASSED!' : '❌ TEST FAILED!'}`);
    console.log('='.repeat(70));
    
    if (!testPassed) {
      console.log('\n🚨 ISSUES DETECTED:');
      if (!cardMoved) {
        console.log('  • Card never moved after button click');
      }
      if (cardBouncedBack) {
        console.log('  • Card bounced back to original position (auto-refresh bug)');
      }
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('  • Check API call timing in handleStatusUpdate');
      console.log('  • Verify pendingStatusUpdatesRef persistence'); 
      console.log('  • Add longer cache time for optimistic updates');
      console.log('  • Improve loadOrders merge logic');
    }

    // Save detailed log
    fs.writeFileSync(
      path.join(__dirname, 'status-persistence-log.json'), 
      JSON.stringify({ 
        testConfig: CONFIG, 
        initialState, 
        finalState, 
        positionLog,
        results: { cardMoved, cardBouncedBack, testPassed }
      }, null, 2)
    );

    console.log('\n📄 Detailed log saved to: status-persistence-log.json');

    if (!CONFIG.HEADLESS) {
      console.log('\n👁️  Browser kept open for inspection. Check the final card position.');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (page) {
      try {
        await page.screenshot({ path: path.join(__dirname, 'status-test-error.png') });
        console.log(`📸 Error screenshot saved`);
      } catch (screenshotError) {
        console.error('Could not save error screenshot:', screenshotError);
      }
    }
  } finally {
    if (!CONFIG.HEADLESS && browser) {
      console.log('\n🔍 Browser kept open for inspection. Press Ctrl+C when done.');
    } else if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testStatusPersistence().catch(console.error);
}

module.exports = { testStatusPersistence };