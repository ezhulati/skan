/**
 * TEST: Visual Feedback During Drag
 * Checks what happens to card appearance when dragging
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3000',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function testVisualDrag() {
  console.log('🔍 TESTING: Visual Drag Feedback...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Step 1: Login...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Step 2: Get initial card styles...');
    
    const initialStyles = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (!card) return null;
      
      const styles = window.getComputedStyle(card);
      return {
        opacity: styles.opacity,
        transform: styles.transform,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility,
        position: styles.position,
        left: styles.left,
        top: styles.top,
        orderNum: card.querySelector('.order-number')?.textContent
      };
    });

    console.log('📋 Initial Card Styles:');
    if (initialStyles) {
      Object.entries(initialStyles).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }

    // Get card position for drag test
    const cardPos = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
      return null;
    });

    if (!cardPos) {
      console.log('❌ No card found');
      return;
    }

    console.log(`🎯 Step 3: Test drag visual feedback...`);
    console.log(`   Card position: (${Math.round(cardPos.x)}, ${Math.round(cardPos.y)})`);
    
    // Start drag
    await page.mouse.move(cardPos.x, cardPos.y);
    
    console.log('   📌 BEFORE mousedown - checking styles...');
    const beforeDragStyles = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (!card) return null;
      
      const styles = window.getComputedStyle(card);
      return {
        opacity: styles.opacity,
        transform: styles.transform,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility
      };
    });
    
    console.log('     Before mousedown styles:');
    Object.entries(beforeDragStyles || {}).forEach(([key, value]) => {
      console.log(`       ${key}: ${value}`);
    });
    
    await page.mouse.down();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for visual feedback
    
    console.log('   📌 DURING drag - checking styles...');
    const duringDragStyles = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (!card) return { error: 'Card not found' };
      
      const styles = window.getComputedStyle(card);
      const rect = card.getBoundingClientRect();
      return {
        opacity: styles.opacity,
        transform: styles.transform,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility,
        width: rect.width,
        height: rect.height,
        isVisible: rect.width > 0 && rect.height > 0
      };
    });
    
    console.log('     During drag styles:');
    Object.entries(duringDragStyles || {}).forEach(([key, value]) => {
      console.log(`       ${key}: ${value}`);
    });
    
    if (duringDragStyles.isVisible) {
      console.log('     ✅ Card is VISIBLE during drag');
    } else {
      console.log('     ❌ Card is INVISIBLE during drag!');
    }
    
    // Move mouse during drag
    await page.mouse.move(cardPos.x + 100, cardPos.y + 50, { steps: 5 });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('   📌 MOVING during drag - checking styles...');
    const movingDragStyles = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (!card) return { error: 'Card not found' };
      
      const styles = window.getComputedStyle(card);
      const rect = card.getBoundingClientRect();
      return {
        opacity: styles.opacity,
        transform: styles.transform,
        zIndex: styles.zIndex,
        isVisible: rect.width > 0 && rect.height > 0,
        boundingBox: `${rect.x.toFixed(0)},${rect.y.toFixed(0)} ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`
      };
    });
    
    console.log('     Moving drag styles:');
    Object.entries(movingDragStyles || {}).forEach(([key, value]) => {
      console.log(`       ${key}: ${value}`);
    });
    
    // End drag
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('   📌 AFTER drag end - checking styles...');
    const afterDragStyles = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (!card) return { error: 'Card not found' };
      
      const styles = window.getComputedStyle(card);
      const rect = card.getBoundingClientRect();
      return {
        opacity: styles.opacity,
        transform: styles.transform,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility,
        isVisible: rect.width > 0 && rect.height > 0
      };
    });
    
    console.log('     After drag styles:');
    Object.entries(afterDragStyles || {}).forEach(([key, value]) => {
      console.log(`       ${key}: ${value}`);
    });
    
    if (afterDragStyles.isVisible) {
      console.log('     ✅ Card is VISIBLE after drag');
    } else {
      console.log('     ❌ Card is INVISIBLE after drag!');
    }

    // Analysis
    console.log('\n' + '='.repeat(60));
    console.log('🔍 VISUAL FEEDBACK ANALYSIS');
    console.log('='.repeat(60));
    
    const opacityChanged = initialStyles.opacity !== duringDragStyles.opacity;
    const transformChanged = initialStyles.transform !== duringDragStyles.transform;
    const zIndexChanged = initialStyles.zIndex !== duringDragStyles.zIndex;
    
    console.log(`📊 Changes during drag:`);
    console.log(`   Opacity: ${initialStyles.opacity} → ${duringDragStyles.opacity} ${opacityChanged ? '✅ CHANGED' : '❌ NO CHANGE'}`);
    console.log(`   Transform: ${initialStyles.transform} → ${duringDragStyles.transform} ${transformChanged ? '✅ CHANGED' : '❌ NO CHANGE'}`);
    console.log(`   Z-Index: ${initialStyles.zIndex} → ${duringDragStyles.zIndex} ${zIndexChanged ? '✅ CHANGED' : '❌ NO CHANGE'}`);
    
    if (parseFloat(duringDragStyles.opacity) < 0.1) {
      console.log('🚨 PROBLEM: Opacity too low - card appears invisible!');
    }
    
    console.log('\n🔍 Keeping browser open for manual inspection (15 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 15000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testVisualDrag().catch(console.error);