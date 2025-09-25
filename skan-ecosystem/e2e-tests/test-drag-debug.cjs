/**
 * DEBUG TEST: Simple drag debugging to understand why styles aren't applying
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3000',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function debugDragStyles() {
  console.log('🔍 DEBUG: Investigating drag style application...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Capture ALL console messages
    page.on('console', msg => {
      console.log(`🖥️  [${msg.type().toUpperCase()}]:`, msg.text());
    });
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Login...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.TIMEOUT });
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📋 Finding first order card...');
    
    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        const styles = window.getComputedStyle(card);
        return {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          orderNum: card.querySelector('.order-number')?.textContent,
          hasMouseDownHandler: !!card.onmousedown,
          hasDataOrderId: !!card.getAttribute('data-order-id'),
          initialStyles: {
            opacity: styles.opacity,
            transform: styles.transform,
            zIndex: styles.zIndex,
            cursor: styles.cursor,
            boxShadow: styles.boxShadow
          }
        };
      }
      return null;
    });

    if (!cardInfo) {
      console.log('❌ No card found');
      return;
    }

    console.log('🎯 Card found:', cardInfo.orderNum);
    console.log('   Position:', Math.round(cardInfo.x), Math.round(cardInfo.y));
    console.log('   Has mouse handler:', cardInfo.hasMouseDownHandler);
    console.log('   Has data-order-id:', cardInfo.hasDataOrderId);
    console.log('   Initial styles:', cardInfo.initialStyles);

    console.log('\n⬇️ EXECUTING MOUSEDOWN EVENT...');
    
    // Move to card
    await page.mouse.move(cardInfo.x, cardInfo.y);
    
    // Execute mousedown and immediately check for style changes
    await page.mouse.down();
    
    // Give it a moment for React to update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterMouseDown = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const styles = window.getComputedStyle(card);
        return {
          opacity: styles.opacity,
          transform: styles.transform,
          zIndex: styles.zIndex,
          cursor: styles.cursor,
          boxShadow: styles.boxShadow,
          filter: styles.filter,
          borderRadius: styles.borderRadius,
          backdropFilter: styles.backdropFilter,
          // Check inline styles too
          inlineStyles: {
            opacity: card.style.opacity,
            transform: card.style.transform,
            zIndex: card.style.zIndex,
            cursor: card.style.cursor,
            boxShadow: card.style.boxShadow,
            filter: card.style.filter,
            borderRadius: card.style.borderRadius,
            backdropFilter: card.style.backdropFilter
          }
        };
      }
      return null;
    });
    
    console.log('\n📸 AFTER MOUSEDOWN:');
    console.log('   Computed styles:', {
      opacity: afterMouseDown.opacity,
      transform: afterMouseDown.transform,
      zIndex: afterMouseDown.zIndex,
      cursor: afterMouseDown.cursor,
      boxShadow: afterMouseDown.boxShadow.substring(0, 50) + '...'
    });
    
    console.log('   Inline styles:', afterMouseDown.inlineStyles);
    
    // Check if ANY styles changed
    const changedStyles = [];
    if (cardInfo.initialStyles.opacity !== afterMouseDown.opacity) changedStyles.push('opacity');
    if (cardInfo.initialStyles.transform !== afterMouseDown.transform) changedStyles.push('transform');
    if (cardInfo.initialStyles.zIndex !== afterMouseDown.zIndex) changedStyles.push('zIndex');
    if (cardInfo.initialStyles.cursor !== afterMouseDown.cursor) changedStyles.push('cursor');
    if (cardInfo.initialStyles.boxShadow !== afterMouseDown.boxShadow) changedStyles.push('boxShadow');
    
    console.log('\n🎨 STYLE CHANGES DETECTED:', changedStyles.length > 0 ? changedStyles.join(', ') : 'NONE');
    
    if (changedStyles.length === 0) {
      console.log('❌ NO VISUAL CHANGES DETECTED - Drag handler may not be firing');
      
      // Test if we can manually apply styles
      console.log('\n🔧 MANUAL STYLE APPLICATION TEST...');
      const manualResult = await page.evaluate(() => {
        const card = document.querySelector('.order-card');
        if (card) {
          const element = card;
          element.style.opacity = '0.95';
          element.style.transform = 'scale(1.05) rotate(2deg)';
          element.style.zIndex = '2000';
          element.style.cursor = 'grabbing';
          element.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25), 0 4px 15px rgba(59, 130, 246, 0.3)';
          element.style.transition = 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.2s ease';
          element.style.borderRadius = '12px';
          element.style.backdropFilter = 'blur(2px)';
          
          // Check if they applied
          setTimeout(() => {
            const newStyles = window.getComputedStyle(element);
            return {
              opacity: newStyles.opacity,
              transform: newStyles.transform,
              zIndex: newStyles.zIndex,
              boxShadow: newStyles.boxShadow
            };
          }, 100);
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterManual = await page.evaluate(() => {
        const card = document.querySelector('.order-card');
        const styles = window.getComputedStyle(card);
        return {
          opacity: styles.opacity,
          transform: styles.transform,
          zIndex: styles.zIndex,
          boxShadow: styles.boxShadow
        };
      });
      
      console.log('   Manual application result:', afterManual);
      
    } else {
      console.log('✅ VISUAL CHANGES CONFIRMED - Drag handler is working');
    }
    
    // Cleanup
    await page.mouse.up();
    
    console.log('\n🔍 Keeping browser open for manual inspection (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugDragStyles().catch(console.error);