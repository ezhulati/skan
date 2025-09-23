#!/usr/bin/env node

/**
 * FINAL TEST: Order Card Movement Verification
 * 
 * This test specifically focuses on verifying that order cards 
 * move between status lanes when buttons are clicked.
 */

const { chromium } = require('playwright');

async function runCardMovementTest() {
  console.log('\n🔄 FINAL CARD MOVEMENT TEST');
  console.log('============================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Track console logs for debugging
  page.on('console', msg => {
    const text = msg.text();
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
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', 'demo.beachbar@skan.al');
      await page.fill('input[type="password"]', 'BeachBarDemo2024!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ Dashboard loaded successfully');
    
    console.log('\n2️⃣ ANALYZING LANE STRUCTURE...');
    
    // Get initial lane counts
    const stationLanes = ['new', 'preparing', 'ready', 'served'];
    const initialCounts = {};
    
    for (const lane of stationLanes) {
      const count = await page.locator(`.station-${lane} .order-card`).count();
      initialCounts[lane] = count;
      console.log(`📊 ${lane.toUpperCase()}: ${count} orders`);
    }
    
    console.log('\n3️⃣ SELECTING ORDER FOR TESTING...');
    
    // Find first order with a status button
    const firstOrderCard = page.locator('.order-card').first();
    const orderCardExists = await firstOrderCard.count() > 0;
    
    if (!orderCardExists) {
      console.log('❌ No order cards found for testing');
      return false;
    }
    
    const orderNumber = await firstOrderCard.locator('.order-number').textContent();
    console.log(`🎯 Testing with order: ${orderNumber}`);
    
    // Find which lane this order is currently in
    let currentLane = null;
    for (const lane of stationLanes) {
      const isInLane = await page.locator(`.station-${lane} .order-card:has-text("${orderNumber}")`).count() > 0;
      if (isInLane) {
        currentLane = lane;
        console.log(`📍 Order ${orderNumber} is currently in: ${lane.toUpperCase()}`);
        break;
      }
    }
    
    if (!currentLane) {
      console.log('❌ Could not determine current lane for order');
      return false;
    }
    
    console.log('\n4️⃣ CLICKING STATUS BUTTON...');
    
    const statusButton = firstOrderCard.locator('.status-button');
    const buttonExists = await statusButton.count() > 0;
    
    if (!buttonExists) {
      console.log('❌ No status button found');
      return false;
    }
    
    const buttonText = await statusButton.textContent();
    console.log(`🎯 Button text: "${buttonText}"`);
    
    // Click the button
    console.log('👆 Clicking status button...');
    await statusButton.click();
    
    // Wait for changes to propagate
    await page.waitForTimeout(3000);
    
    console.log('\n5️⃣ VERIFYING CARD MOVEMENT...');
    
    // Check if order moved out of original lane
    const stillInOriginalLane = await page.locator(`.station-${currentLane} .order-card:has-text("${orderNumber}")`).count() > 0;
    
    if (stillInOriginalLane) {
      console.log(`❌ Order ${orderNumber} is STILL in ${currentLane.toUpperCase()} lane`);
      
      // Check final counts
      const finalCounts = {};
      for (const lane of stationLanes) {
        const count = await page.locator(`.station-${lane} .order-card`).count();
        finalCounts[lane] = count;
        if (finalCounts[lane] !== initialCounts[lane]) {
          const change = finalCounts[lane] > initialCounts[lane] ? '(+1)' : '(-1)';
          console.log(`🔄 ${lane.toUpperCase()}: ${initialCounts[lane]} → ${finalCounts[lane]} ${change}`);
        } else {
          console.log(`📊 ${lane.toUpperCase()}: ${count} orders (no change)`);
        }
      }
      
      return false;
    } else {
      console.log(`✅ Order ${orderNumber} moved OUT of ${currentLane.toUpperCase()} lane`);
      
      // Find which lane it moved to
      let newLane = null;
      for (const lane of stationLanes) {
        const isInLane = await page.locator(`.station-${lane} .order-card:has-text("${orderNumber}")`).count() > 0;
        if (isInLane) {
          newLane = lane;
          console.log(`🎉 Order ${orderNumber} is now in: ${lane.toUpperCase()}`);
          break;
        }
      }
      
      if (newLane) {
        console.log(`✅ SUCCESSFUL MOVEMENT: ${currentLane.toUpperCase()} → ${newLane.toUpperCase()}`);
        
        // Show final counts
        const finalCounts = {};
        for (const lane of stationLanes) {
          const count = await page.locator(`.station-${lane} .order-card`).count();
          finalCounts[lane] = count;
          if (finalCounts[lane] !== initialCounts[lane]) {
            const change = finalCounts[lane] > initialCounts[lane] ? '(+1)' : '(-1)';
            console.log(`🔄 ${lane.toUpperCase()}: ${initialCounts[lane]} → ${finalCounts[lane]} ${change}`);
          } else {
            console.log(`📊 ${lane.toUpperCase()}: ${count} orders (no change)`);
          }
        }
        
        return true;
      } else {
        console.log('⚠️  Order disappeared from all lanes');
        return false;
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR DURING TEST:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
runCardMovementTest().then(success => {
  console.log('\n🎉 FINAL RESULT');
  console.log('================');
  
  if (success) {
    console.log('✅ SUCCESS: Order cards are moving between lanes when buttons are clicked!');
    console.log('🎯 The Kitchen Display System is now working correctly.');
  } else {
    console.log('❌ FAILURE: Order cards are NOT moving between lanes.');
    console.log('🔧 Additional fixes are needed.');
  }
}).catch(console.error);