/**
 * TEST: Infinite Drag Functionality
 * Tests dragging cards left and right in all directions
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3000',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function testDragFunctionality() {
  console.log('🔍 TESTING: Infinite Drag Functionality...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯 INFINITE DRAG') || text.includes('DRAG DROP') || 
          text.includes('handleDragStart') || text.includes('handleDragEnd')) {
        console.log(`🖥️  [${msg.type().toUpperCase()}]:`, text);
      }
    });
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Step 1: Login and wait for orders...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    
    // Force clear cache
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

    console.log('📊 Step 2: Finding orders to test drag...');
    
    const orders = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.order-card'));
      return cards.map(card => {
        const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
        const rect = card.getBoundingClientRect();
        const stationLane = card.closest('.station-lane');
        let column = 'Unknown';
        
        if (stationLane) {
          const classList = Array.from(stationLane.classList);
          const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
          if (stationClass) {
            column = stationClass.replace('station-', '');
          }
        }
        
        return { 
          orderNum, 
          column,
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          element: cards.indexOf(card)
        };
      });
    });

    console.log('📋 Found Orders:');
    orders.forEach(order => {
      console.log(`   ${order.orderNum}: ${order.column} at (${Math.round(order.x)}, ${Math.round(order.y)})`);
    });

    if (orders.length === 0) {
      console.log('❌ No orders found - cannot test drag functionality');
      return;
    }

    // Find a card in 'preparing' or 'ready' that we can drag back to 'new'
    const testOrder = orders.find(order => order.column === 'preparing' || order.column === 'ready') || orders[0];
    console.log(`🎯 Step 3: Testing drag with order: ${testOrder.orderNum} (in ${testOrder.column})`);

    // Find drop zones
    const dropZones = await page.evaluate(() => {
      const zones = Array.from(document.querySelectorAll('.station-lane, [data-station]'));
      return zones.map(zone => {
        const rect = zone.getBoundingClientRect();
        let station = zone.getAttribute('data-station');
        if (!station) {
          const classList = Array.from(zone.classList);
          const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
          if (stationClass) {
            station = stationClass.replace('station-', '');
          }
        }
        return {
          station,
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          width: rect.width,
          height: rect.height
        };
      }).filter(zone => zone.station);
    });

    console.log('📍 Found Drop Zones:');
    dropZones.forEach(zone => {
      console.log(`   ${zone.station}: (${Math.round(zone.x)}, ${Math.round(zone.y)}) [${zone.width}x${zone.height}]`);
    });

    // Test 1: Drag LEFT (backwards) - from preparing/ready back to new
    const targetZone = dropZones.find(zone => zone.station === 'new');
    if (targetZone && testOrder.column !== 'new') {
      console.log(`🔥 Step 4: Testing LEFT drag - moving ${testOrder.orderNum} from ${testOrder.column} to 'new'`);
      
      // Mouse drag simulation
      await page.mouse.move(testOrder.x, testOrder.y);
      await page.mouse.down();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      
      // Drag to target zone
      await page.mouse.move(targetZone.x, targetZone.y, { steps: 10 });
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for visual feedback
      
      await page.mouse.up();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for status update
      
      // Check if card moved
      const afterDragOrders = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        return cards.map(card => {
          const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
          const stationLane = card.closest('.station-lane');
          let column = 'Unknown';
          
          if (stationLane) {
            const classList = Array.from(stationLane.classList);
            const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
            if (stationClass) {
              column = stationClass.replace('station-', '');
            }
          }
          
          return { orderNum, column };
        });
      });
      
      const movedOrder = afterDragOrders.find(order => order.orderNum === testOrder.orderNum);
      console.log(`📊 Result: ${testOrder.orderNum} is now in '${movedOrder?.column}' (was '${testOrder.column}')`);
      
      if (movedOrder?.column === 'new') {
        console.log('✅ LEFT DRAG WORKS: Card successfully moved backwards!');
      } else {
        console.log('❌ LEFT DRAG FAILED: Card did not move or disappeared!');
        
        // Debug: Check if card still exists
        const allCards = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.order-card')).map(card => ({
            orderNum: card.querySelector('.order-number')?.textContent,
            visible: card.offsetParent !== null,
            display: window.getComputedStyle(card).display
          }));
        });
        
        console.log('🔍 Debug - All cards after drag:');
        allCards.forEach(card => {
          console.log(`   ${card.orderNum}: visible=${card.visible}, display=${card.display}`);
        });
      }
    } else {
      console.log('⚠️ Cannot test LEFT drag - no suitable target zone or order already in "new"');
    }

    // Test 2: Drag RIGHT (forwards) 
    const rightTargetZone = dropZones.find(zone => zone.station === 'served');
    if (rightTargetZone) {
      console.log(`🔥 Step 5: Testing RIGHT drag - moving first card to 'served'`);
      
      const firstOrder = (afterDragOrders && afterDragOrders[0]) || orders[0];
      const firstOrderElement = await page.evaluate((orderNum) => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const card = cards.find(c => c.querySelector('.order-number')?.textContent === orderNum);
        if (card) {
          const rect = card.getBoundingClientRect();
          return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          };
        }
        return null;
      }, firstOrder.orderNum);

      if (firstOrderElement) {
        await page.mouse.move(firstOrderElement.x, firstOrderElement.y);
        await page.mouse.down();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await page.mouse.move(rightTargetZone.x, rightTargetZone.y, { steps: 10 });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ RIGHT DRAG COMPLETED');
      }
    }

    console.log('✅ Drag functionality test completed - keeping browser open for manual verification');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDragFunctionality().catch(console.error);