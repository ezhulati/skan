/**
 * ZERO JANK DRAG TEST - Verify ultra smooth performance
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3000',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function testZeroJankDrag() {
  console.log('⚡ TESTING: ZERO JANK DRAG PERFORMANCE...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Capture performance logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🚀 ZERO JANK') || text.includes('DRAG') || text.includes('GPU')) {
        console.log(`🖥️  [DRAG]:`, text);
      }
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

    console.log('⚡ PERFORMANCE TEST: Ultra smooth drag...');
    
    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        return {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          orderNum: card.querySelector('.order-number')?.textContent
        };
      }
      return null;
    });

    if (!cardInfo) {
      console.log('❌ No card found');
      return;
    }

    console.log(`🎯 Testing with: ${cardInfo.orderNum}`);
    
    // Start drag
    await page.mouse.move(cardInfo.x, cardInfo.y);
    await page.mouse.down();
    
    console.log('📱 SMOOTH DRAG TEST: Moving in smooth circular motion...');
    
    // Smooth circular motion test
    const centerX = cardInfo.x;
    const centerY = cardInfo.y;
    const radius = 100;
    
    for (let i = 0; i <= 360; i += 10) {
      const angle = (i * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      await page.mouse.move(x, y);
      await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
    }
    
    console.log('✅ Circular motion complete - checking smoothness...');
    
    // Check if element has GPU acceleration styles
    const gpuStyles = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const styles = window.getComputedStyle(card);
        return {
          willChange: styles.willChange,
          transform: styles.transform,
          userSelect: styles.userSelect,
          pointerEvents: styles.pointerEvents,
          zIndex: styles.zIndex,
          transition: styles.transition
        };
      }
      return null;
    });
    
    console.log('⚙️ GPU Acceleration Check:', gpuStyles);
    
    // End drag
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('📊 PERFORMANCE ASSESSMENT:');
    console.log(`   GPU Layer (will-change): ${gpuStyles.willChange === 'transform' ? '✅ ENABLED' : '❌ MISSING'}`);
    console.log(`   Hardware Transform: ${gpuStyles.transform.includes('translate3d') ? '✅ GPU' : '❌ CPU'}`);
    console.log(`   No Transitions: ${gpuStyles.transition === 'none' ? '✅ SMOOTH' : '❌ JANKY'}`);
    console.log(`   Pointer Events Disabled: ${gpuStyles.pointerEvents === 'none' ? '✅ NO INTERFERENCE' : '❌ CONFLICTS'}`);
    
    const score = [
      gpuStyles.willChange === 'transform',
      gpuStyles.transform.includes('translate3d'),
      gpuStyles.transition === 'none',
      gpuStyles.pointerEvents === 'none'
    ].filter(Boolean).length;
    
    console.log(`\n⚡ SMOOTHNESS SCORE: ${score}/4`);
    
    if (score === 4) {
      console.log('🎉 PERFECT: Zero jank drag achieved!');
    } else if (score >= 3) {
      console.log('✨ GOOD: Mostly smooth with minor optimizations needed');
    } else {
      console.log('⚠️ NEEDS WORK: Performance optimizations required');
    }

    console.log('\n🔍 Manual test available for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testZeroJankDrag().catch(console.error);