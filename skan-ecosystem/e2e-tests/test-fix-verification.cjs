#!/usr/bin/env node

/**
 * VERIFICATION TEST: KDS Order Card Movement Fix
 *
 * This test verifies that the infinite re-rendering issue has been resolved
 * and that order cards now properly move between status lanes when buttons are clicked.
 */

const { chromium } = require('playwright');

async function runFixVerification() {
  console.log('\n🔧 SKAN.AL KDS FIX VERIFICATION');
  console.log('===============================');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 } // TV mode size
  });

  const page = await context.newPage();

  // Count console logs to verify infinite re-rendering is fixed
  let consoleLogCount = 0;
  const logMessages = [];

  page.on('console', msg => {
    consoleLogCount++;
    const text = msg.text();
    logMessages.push(text);

    if (text.includes('🔥') || text.includes('BUTTON CLICKED')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    console.log('\n1️⃣ LOADING DASHBOARD...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login if needed
    const isLoginPage = await page.locator('input[type="email"]').count() > 0;

    if (isLoginPage) {
      await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
      await page.fill('input[type="password"]', 'BeachBarDemo2024!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
    }

    console.log('✅ Dashboard loaded successfully');

    console.log('\n2️⃣ CHECKING FOR INFINITE RE-RENDERING...');

    const initialLogCount = consoleLogCount;
    await page.waitForTimeout(3000); // Wait 3 seconds
    const finalLogCount = consoleLogCount;

    const logsDuringWait = finalLogCount - initialLogCount;
    console.log(`📊 Console logs during 3-second wait: ${logsDuringWait}`);

    if (logsDuringWait > 50) {
      console.log('❌ STILL FAILING: Excessive console logs detected (infinite re-rendering)');
      return;
    } else {
      console.log('✅ FIXED: No excessive re-rendering detected');
    }

    console.log('\n3️⃣ TESTING ORDER CARD MOVEMENT...');

    // Get initial lane counts
    const stationLanes = ['new', 'preparing', 'ready', 'served'];
    const initialCounts = {};

    for (const lane of stationLanes) {
      const count = await page.locator(`.station-${lane} .order-card`).count();
      initialCounts[lane] = count;
      console.log(`📊 Initial ${lane.toUpperCase()}: ${count} orders`);
    }

    // Find first order with a status button
    const firstOrderCard = page.locator('.order-card').first();
    const orderCardExists = await firstOrderCard.count() > 0;

    if (!orderCardExists) {
      console.log('❌ No order cards found for testing');
      return;
    }

    const orderNumber = await firstOrderCard.locator('.order-number').textContent();
    console.log(`🎯 Testing with order: ${orderNumber}`);

    // Click status button
    const statusButton = firstOrderCard.locator('.status-button');
    const buttonExists = await statusButton.count() > 0;

    if (!buttonExists) {
      console.log('❌ No status button found');
      return;
    }

    console.log('👆 Clicking status button...');
    await statusButton.click();

    // Wait for state changes
    await page.waitForTimeout(2000);

    console.log('\n4️⃣ VERIFYING CARD MOVEMENT...');

    // Check if lane counts changed
    let cardMoved = false;
    const finalCounts = {};

    for (const lane of stationLanes) {
      const count = await page.locator(`.station-${lane} .order-card`).count();
      finalCounts[lane] = count;

      if (finalCounts[lane] !== initialCounts[lane]) {
        cardMoved = true;
        const change = finalCounts[lane] > initialCounts[lane] ? '(+)' : '(-)';
        console.log(`🔄 ${lane.toUpperCase()}: ${initialCounts[lane]} → ${finalCounts[lane]} ${change}`);
      } else {
        console.log(`📊 ${lane.toUpperCase()}: ${count} orders (no change)`);
      }
    }

    if (cardMoved) {
      console.log('\n✅ SUCCESS: Order cards are now moving between lanes!');
    } else {
      console.log('\n❌ STILL FAILING: Order cards are not moving between lanes');
    }

    console.log('\n5️⃣ FINAL STATUS CHECK...');

    // Verify the specific order moved
    const orderStillInOriginalPosition = await page.locator(`.station-new .order-card:has-text("${orderNumber}")`).count() > 0;

    if (!orderStillInOriginalPosition && cardMoved) {
      console.log(`✅ Order ${orderNumber} successfully moved from original lane`);
    } else if (orderStillInOriginalPosition) {
      console.log(`⚠️  Order ${orderNumber} is still in original lane`);
    }

    console.log('\n🎉 FIX VERIFICATION COMPLETE');
    console.log('============================');

    if (logsDuringWait <= 50 && cardMoved) {
      console.log('✅ ALL TESTS PASSED: The fix is working correctly!');
      console.log('   - Infinite re-rendering stopped');
      console.log('   - Order cards move between lanes when buttons are clicked');
    } else {
      console.log('❌ SOME ISSUES REMAIN:');
      if (logsDuringWait > 50) {
        console.log('   - Infinite re-rendering still occurring');
      }
      if (!cardMoved) {
        console.log('   - Order cards still not moving between lanes');
      }
    }
  } catch (error) {
    console.error('\n❌ ERROR DURING VERIFICATION:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the verification
runFixVerification().catch(console.error);
