#!/usr/bin/env node

/**
 * QUICK TEST: Infinite Re-Rendering Fix
 * 
 * This test quickly checks if the infinite re-rendering issue has been resolved
 * by monitoring console logs for a short period.
 */

const { chromium } = require('playwright');

async function runQuickTest() {
  console.log('\n🔧 QUICK INFINITE RE-RENDER TEST');
  console.log('==================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Count all console logs
  let consoleLogCount = 0;
  const logMessages = [];
  
  page.on('console', msg => {
    consoleLogCount++;
    const text = msg.text();
    logMessages.push(text);
    
    // Only show button clicks and significant events
    if (text.includes('🔥') || text.includes('BUTTON CLICKED') || text.includes('ERROR')) {
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
    
    console.log('\n2️⃣ MONITORING FOR RE-RENDERING...');
    
    const initialLogCount = consoleLogCount;
    console.log(`📊 Initial console logs: ${initialLogCount}`);
    
    // Wait 5 seconds to monitor logs
    await page.waitForTimeout(5000);
    
    const finalLogCount = consoleLogCount;
    const logsDuringWait = finalLogCount - initialLogCount;
    
    console.log(`📊 Console logs during 5-second wait: ${logsDuringWait}`);
    
    if (logsDuringWait > 100) {
      console.log('❌ STILL FAILING: Excessive console logs detected (infinite re-rendering)');
      console.log('🔍 Recent logs:', logMessages.slice(-10));
    } else if (logsDuringWait > 50) {
      console.log('⚠️  PARTIAL FIX: Some excessive logging detected, but much better');
    } else {
      console.log('✅ FIXED: No excessive re-rendering detected');
    }
    
    console.log('\n3️⃣ QUICK BUTTON TEST...');
    
    // Try to click a button if available
    const firstOrderCard = page.locator('.order-card').first();
    const orderCardExists = await firstOrderCard.count() > 0;
    
    if (orderCardExists) {
      const statusButton = firstOrderCard.locator('.status-button');
      const buttonExists = await statusButton.count() > 0;
      
      if (buttonExists) {
        console.log('👆 Clicking status button...');
        await statusButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Button click completed');
      } else {
        console.log('⚠️  No status button found on first order');
      }
    } else {
      console.log('⚠️  No order cards found');
    }
    
    console.log('\n🎉 QUICK TEST COMPLETE');
    console.log('======================');
    
    if (logsDuringWait <= 50) {
      console.log('✅ INFINITE RE-RENDERING IS FIXED!');
      console.log('   - Console log count is normal');
      console.log('   - Component re-renders are under control');
    } else {
      console.log('❌ INFINITE RE-RENDERING STILL OCCURS');
      console.log(`   - Too many console logs: ${logsDuringWait} in 5 seconds`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR DURING TEST:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
runQuickTest().catch(console.error);