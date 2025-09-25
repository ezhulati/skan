/**
 * TEST: Check which device mode is being used and drag system status
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3000',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function testDeviceMode() {
  console.log('🔍 TESTING: Device Mode Detection and Drag System...');

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
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Step 2: Analyze device mode and drag systems...');
    
    const deviceInfo = await page.evaluate(() => {
      // Check device type
      const phoneMode = document.querySelector('.kds-phone-mode');
      const tabletMode = document.querySelector('.kds-tablet-mode');  
      const tvMode = document.querySelector('.kds-tv-mode');
      
      let currentMode = 'unknown';
      if (phoneMode && phoneMode.offsetParent !== null) currentMode = 'phone';
      else if (tabletMode && tabletMode.offsetParent !== null) currentMode = 'tablet';
      else if (tvMode && tvMode.offsetParent !== null) currentMode = 'tv';
      
      // Check drag systems
      const cards = Array.from(document.querySelectorAll('.order-card'));
      const dragSystems = cards.map(card => ({
        orderNum: card.querySelector('.order-number')?.textContent,
        hasDataOrderId: !!card.getAttribute('data-order-id'),
        isDraggable: card.getAttribute('draggable') === 'true',
        hasMouseDown: !!card.onmousedown,
        hasTouchStart: !!card.ontouchstart,
        classes: Array.from(card.classList),
        parentClasses: Array.from((card.parentElement || {}).classList || [])
      }));
      
      // Check drop zones
      const dropZones = Array.from(document.querySelectorAll('.station-lane, [data-station]'));
      const zoneInfo = dropZones.map(zone => ({
        station: zone.getAttribute('data-station') || 
                 Array.from(zone.classList).find(cls => cls.startsWith('station-'))?.replace('station-', ''),
        classes: Array.from(zone.classList),
        hasDropHandler: !!zone.ondrop
      }));
      
      return {
        mode: currentMode,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        dragSystems,
        dropZones: zoneInfo
      };
    });

    console.log('📱 Device Mode Analysis:');
    console.log(`   Current Mode: ${deviceInfo.mode}`);
    console.log(`   Viewport: ${deviceInfo.viewport.width}x${deviceInfo.viewport.height}`);
    
    console.log('\\n🎯 Drag Systems Analysis:');
    deviceInfo.dragSystems.forEach(system => {
      console.log(`   ${system.orderNum}:`);
      console.log(`     - data-order-id: ${system.hasDataOrderId}`);
      console.log(`     - draggable: ${system.isDraggable}`);
      console.log(`     - mousedown handler: ${system.hasMouseDown}`);
      console.log(`     - touchstart handler: ${system.hasTouchStart}`);
      console.log(`     - classes: [${system.classes.join(', ')}]`);
      console.log(`     - parent: [${system.parentClasses.join(', ')}]`);
    });
    
    console.log('\\n📍 Drop Zones Analysis:');
    deviceInfo.dropZones.forEach(zone => {
      console.log(`   ${zone.station}:`);
      console.log(`     - has drop handler: ${zone.hasDropHandler}`);
      console.log(`     - classes: [${zone.classes.join(', ')}]`);
    });

    // Test a simple mouse drag to see what system triggers
    console.log('\\n🔥 Quick Drag Test - Move first card slightly...');
    
    const firstCard = await page.evaluate(() => {
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

    if (firstCard) {
      console.log(`   Testing drag with ${firstCard.orderNum} at (${Math.round(firstCard.x)}, ${Math.round(firstCard.y)})`);
      
      // Capture console messages during drag
      const dragMessages = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🎯') || text.includes('DRAG') || text.includes('handleDrag')) {
          dragMessages.push(text);
        }
      });
      
      // Force a cache refresh
      await page.keyboard.down('Shift');
      await page.keyboard.press('F5');  
      await page.keyboard.up('Shift');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simple drag test
      await page.mouse.move(firstCard.x, firstCard.y);
      await page.mouse.down();
      await new Promise(resolve => setTimeout(resolve, 100));
      await page.mouse.move(firstCard.x + 50, firstCard.y + 50, { steps: 5 });
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.mouse.up();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('   Drag Messages Captured:');
      if (dragMessages.length === 0) {
        console.log('     ❌ NO DRAG MESSAGES - Neither system triggered!');
      } else {
        dragMessages.forEach(msg => {
          console.log(`     📝 ${msg}`);
        });
      }
    }

    console.log('\\n🔍 Keeping browser open for manual testing (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDeviceMode().catch(console.error);