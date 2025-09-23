#!/usr/bin/env node

/**
 * ROOT CAUSE ANALYSIS: KDS Order Card Movement Issue
 *
 * This test systematically investigates why order cards are not moving
 * between status lanes when buttons are clicked in the Kitchen Display System.
 *
 * Investigation Areas:
 * 1. Button click registration and event handling
 * 2. handleStatusUpdate function execution
 * 3. React state updates (orders array)
 * 4. API calls and responses
 * 5. Component re-rendering and lane filtering
 * 6. Auto-refresh interference with optimistic updates
 */

const { chromium } = require('playwright');

async function runRootCauseAnalysis() {
  console.log('\n🔍 SKAN.AL KDS ROOT CAUSE ANALYSIS');
  console.log('=====================================');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down for debugging
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 } // TV mode size
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (
      text.includes('🔥') ||
      text.includes('BUTTON CLICKED') ||
      text.includes('Order') ||
      text.includes('status')
    ) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  // Monitor network requests
  const networkLogs = [];
  page.on('request', request => {
    if (request.url().includes('orders') || request.url().includes('status')) {
      networkLogs.push({
        type: 'REQUEST',
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('orders') || response.url().includes('status')) {
      networkLogs.push({
        type: 'RESPONSE',
        status: response.status(),
        url: response.url(),
        timestamp: new Date().toISOString()
      });
    }
  });

  try {
    console.log('\n1️⃣ LOADING ADMIN DASHBOARD...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="email"]').count() > 0;

    if (isLoginPage) {
      console.log('🔐 LOGGING IN...');
      await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
      await page.fill('input[type="password"]', 'BeachBarDemo2024!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
    }

    console.log('✅ Dashboard loaded successfully');

    console.log('\n2️⃣ ANALYZING INITIAL STATE...');

    // Wait for orders to load
    await page.waitForTimeout(3000);

    // Get initial order count in each lane
    const stationLanes = ['new', 'preparing', 'ready', 'served'];
    const initialState = {};

    for (const lane of stationLanes) {
      const laneSelector = `.station-${lane} .order-card`;
      const count = await page.locator(laneSelector).count();
      initialState[lane] = count;
      console.log(`📊 ${lane.toUpperCase()} lane: ${count} orders`);
    }

    console.log('\n3️⃣ INSPECTING FIRST ORDER CARD...');

    // Find first order card with a status button
    const firstOrderCard = page.locator('.order-card').first();
    const orderCardExists = await firstOrderCard.count() > 0;

    if (!orderCardExists) {
      console.log('❌ ERROR: No order cards found! Dashboard may be empty or using mock data.');
      return;
    }

    // Get order details
    const orderNumber = await firstOrderCard.locator('.order-number').textContent();
    const currentStatusElement = await firstOrderCard.locator('.order-status');
    const currentStatusText = await currentStatusElement.textContent();

    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`📊 Current Status: ${currentStatusText}`);

    // Check if status button exists
    const statusButton = firstOrderCard.locator('.status-button');
    const buttonExists = await statusButton.count() > 0;

    if (!buttonExists) {
      console.log('❌ ERROR: No status button found on order card!');
      return;
    }

    const buttonText = await statusButton.textContent();
    console.log(`🎯 Button Text: ${buttonText}`);

    console.log('\n4️⃣ CLICKING STATUS BUTTON & MONITORING CHANGES...');

    // Clear network logs before action
    networkLogs.length = 0;

    // Intercept console logs for detailed tracking
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        timestamp: new Date().toISOString(),
        text: msg.text(),
        type: msg.type()
      });
    });

    // Click the status button
    console.log('👆 CLICKING STATUS BUTTON...');
    await statusButton.click();

    // Wait for potential state changes
    await page.waitForTimeout(2000);

    console.log('\n5️⃣ ANALYZING POST-CLICK STATE...');

    // Check console logs for handleStatusUpdate execution
    const statusUpdateLogs = consoleLogs.filter(log =>
      log.text.includes('🔥 BUTTON CLICKED') ||
      log.text.includes('handleStatusUpdate') ||
      log.text.includes('Order status updated')
    );

    console.log(`📝 Status Update Logs (${statusUpdateLogs.length}):`);
    statusUpdateLogs.forEach(log => {
      console.log(`  ${log.timestamp}: ${log.text}`);
    });

    // Check network requests
    console.log(`🌐 Network Requests (${networkLogs.length}):`);
    networkLogs.forEach(log => {
      console.log(`  ${log.timestamp}: ${log.type} ${log.method || log.status} ${log.url}`);
    });

    // Check if order moved between lanes
    const finalState = {};
    let orderMoved = false;

    for (const lane of stationLanes) {
      const laneSelector = `.station-${lane} .order-card`;
      const count = await page.locator(laneSelector).count();
      finalState[lane] = count;

      if (finalState[lane] !== initialState[lane]) {
        orderMoved = true;
        console.log(
          `🔄 ${lane.toUpperCase()} lane: ${initialState[lane]} → ${finalState[lane]} ${
            finalState[lane] > initialState[lane] ? '(+)' : '(-)'
          }`
        );
      } else {
        console.log(`📊 ${lane.toUpperCase()} lane: ${count} orders (no change)`);
      }
    }

    console.log('\n6️⃣ INVESTIGATING ORDER STATUS MAPPING...');

    // Check if the specific order is still in its original lane
    const orderStillExists = await page.locator(`.order-card:has-text("${orderNumber}")`).count() > 0;

    if (orderStillExists) {
      const updatedOrderCard = page.locator(`.order-card:has-text("${orderNumber}")`);
      const newStatusText = await updatedOrderCard.locator('.order-status').textContent();
      console.log(`📋 Order ${orderNumber} status: ${currentStatusText} → ${newStatusText}`);
    } else {
      console.log(`✅ Order ${orderNumber} is no longer in its original position.`);
    }

    console.log('\n7️⃣ SUMMARY OF FINDINGS');
    console.log('------------------------');
    console.log('Initial Lane Counts:', initialState);
    console.log('Final Lane Counts:', finalState);
    console.log('Order Moved:', orderMoved ? 'YES' : 'NO');

    console.log('\nConsole Logs Captured:');
    consoleLogs.forEach(log => console.log(`  ${log.timestamp}: ${log.text}`));

    console.log('\nNetwork Logs Captured:');
    networkLogs.forEach(log => console.log(`  ${log.timestamp}: ${log.type} ${log.method || log.status} ${log.url}`));

    console.log('\n🎯 Analysis Complete');
  } catch (error) {
    console.error('\n❌ ERROR DURING ROOT CAUSE ANALYSIS:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the analysis
runRootCauseAnalysis().catch(console.error);
