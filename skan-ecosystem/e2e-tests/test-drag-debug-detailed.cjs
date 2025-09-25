/**
 * DETAILED DRAG DEBUG TEST
 * Debug why drag is not working properly
 */

const puppeteer = require('puppeteer');

async function debugDragFunctionality() {
  console.log('🔍 DEBUGGING DRAG FUNCTIONALITY');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 50 // Slow down for visibility
  });

  const page = await browser.newPage();
  
  try {
    // Navigate and login
    console.log('🚪 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.station-lanes-container', { timeout: 15000 });
    console.log('✅ Dashboard loaded');
    
    // Enable detailed console logging
    page.on('console', msg => {
      const text = msg.text();
      console.log('🖥️  CONSOLE:', text);
    });
    
    // Check drag elements
    const dragElements = await page.$$eval('[data-order-id]', (elements) => {
      return elements.map((el, index) => {
        const parent = el.parentElement;
        const grandParent = parent ? parent.parentElement : null;
        return {
          index,
          orderId: el.getAttribute('data-order-id'),
          hasParentDrag: parent ? parent.style.cursor === 'grab' : false,
          parentTagName: parent ? parent.tagName : null,
          grandParentTagName: grandParent ? grandParent.tagName : null,
          hasDragListeners: !!el.onmousedown || !!parent?.onmousedown,
          elementCursor: el.style.cursor,
          parentCursor: parent ? parent.style.cursor : null
        };
      });
    });
    
    console.log('🎯 Drag elements analysis:');
    dragElements.forEach(el => console.log('  ', el));
    
    if (dragElements.length === 0) {
      console.log('❌ No draggable elements found!');
      return;
    }
    
    // Test mouse events on first draggable element
    console.log('🎮 Testing mouse events on first element...');
    const firstElement = await page.$('[data-order-id]');
    const elementBox = await firstElement.boundingBox();
    
    console.log('📍 Element position:', elementBox);
    
    // Try mousedown
    console.log('🖱️  Testing mousedown...');
    await page.mouse.move(elementBox.x + elementBox.width/2, elementBox.y + elementBox.height/2);
    await page.mouse.down();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait to see if clone appears
    
    // Check if drag clone was created
    const cloneExists = await page.evaluate(() => {
      const clones = document.querySelectorAll('[style*="position: fixed"]');
      return Array.from(clones).filter(el => 
        el.style.zIndex === '999999' || el.innerHTML.includes('SKN-')
      ).length;
    });
    
    console.log('👻 Drag clones found:', cloneExists);
    
    // Try moving mouse
    console.log('🖱️  Testing mouse move...');
    await page.mouse.move(elementBox.x + 100, elementBox.y + 50);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check drop zones
    const dropZones = await page.$$eval('.station-lane', (zones) => {
      return zones.map((zone, index) => ({
        index,
        station: zone.getAttribute('data-station'),
        hasDataStation: !!zone.getAttribute('data-station'),
        className: zone.className,
        position: {
          x: zone.getBoundingClientRect().x,
          y: zone.getBoundingClientRect().y,
          width: zone.getBoundingClientRect().width,
          height: zone.getBoundingClientRect().height
        }
      }));
    });
    
    console.log('🎯 Drop zones:');
    dropZones.forEach(zone => console.log('  ', zone));
    
    // Try dropping on second zone
    if (dropZones.length >= 2) {
      const targetZone = dropZones[1];
      console.log('🎯 Dropping on zone:', targetZone.station);
      await page.mouse.move(targetZone.position.x + targetZone.position.width/2, targetZone.position.y + targetZone.position.height/2);
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.mouse.up();
      console.log('✅ Mouse up completed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if status actually updated
    const finalStatus = await page.evaluate(() => {
      const firstOrder = document.querySelector('[data-order-id]');
      return firstOrder ? firstOrder.closest('.station-lane')?.getAttribute('data-station') : null;
    });
    
    console.log('📊 Final order status/lane:', finalStatus);
    
    console.log('\n🔍 DRAG DEBUG COMPLETE');
    console.log('='.repeat(50));
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugDragFunctionality().catch(console.error);