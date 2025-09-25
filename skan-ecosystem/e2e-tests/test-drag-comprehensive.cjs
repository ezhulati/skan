/**
 * COMPREHENSIVE DRAG TEST: Tests all drag directions and device types
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3000',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function testAllDragDirections() {
  console.log('🔍 COMPREHENSIVE DRAG TEST: All Directions & Devices...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Capture all drag-related console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯') || text.includes('DRAG') || text.includes('handleDrag')) {
        console.log(`🖥️  [${msg.type().toUpperCase()}]:`, text);
      }
    });
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Step 1: Login and prepare fresh state...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    
    // Clear cache and reload
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

    // Function to get current order states
    const getOrderStates = async () => {
      return await page.evaluate(() => {
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
          
          // Also check visibility
          const rect = card.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && card.offsetParent !== null;
          
          return { 
            orderNum, 
            column,
            isVisible,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          };
        });
      });
    };

    // Get drop zone positions  
    const getDropZones = async () => {
      return await page.evaluate(() => {
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
            y: rect.y + rect.height / 2
          };
        }).filter(zone => zone.station);
      });
    };

    console.log('📊 Step 2: Get initial state...');
    let orders = await getOrderStates();
    const dropZones = await getDropZones();
    
    console.log('📋 Initial Orders:');
    orders.forEach(order => {
      console.log(`   ${order.orderNum}: ${order.column} (visible: ${order.isVisible})`);
    });
    
    console.log('📍 Drop Zones:');
    dropZones.forEach(zone => {
      console.log(`   ${zone.station}: (${Math.round(zone.x)}, ${Math.round(zone.y)})`);
    });

    // Test 1: LEFT DRAG (backwards movement)
    console.log('\\n🔥 TEST 1: LEFT DRAG - Move card backwards');
    const backwardTestOrder = orders.find(order => order.column === 'preparing' || order.column === 'ready');
    if (backwardTestOrder) {
      const targetZone = dropZones.find(zone => zone.station === 'new');
      if (targetZone) {
        console.log(`   Dragging ${backwardTestOrder.orderNum} from ${backwardTestOrder.column} to new`);
        
        await page.mouse.move(backwardTestOrder.x, backwardTestOrder.y);
        await page.mouse.down();
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.mouse.move(targetZone.x, targetZone.y, { steps: 15 });
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const afterBackward = await getOrderStates();
        const movedOrder = afterBackward.find(o => o.orderNum === backwardTestOrder.orderNum);
        
        console.log(`   Result: ${movedOrder?.orderNum} is now in '${movedOrder?.column}' (visible: ${movedOrder?.isVisible})`);
        if (movedOrder?.column === 'new' && movedOrder?.isVisible) {
          console.log('   ✅ LEFT DRAG SUCCESS!');
        } else {
          console.log('   ❌ LEFT DRAG FAILED - card missing or wrong position!');
        }
        orders = afterBackward; // Update for next test
      }
    }

    // Test 2: RIGHT DRAG (forward movement)
    console.log('\\n🔥 TEST 2: RIGHT DRAG - Move card forwards');
    const forwardTestOrder = orders.find(order => order.column === 'new' || order.column === 'preparing');
    if (forwardTestOrder) {
      const targetZone = dropZones.find(zone => zone.station === 'served');
      if (targetZone) {
        console.log(`   Dragging ${forwardTestOrder.orderNum} from ${forwardTestOrder.column} to served`);
        
        await page.mouse.move(forwardTestOrder.x, forwardTestOrder.y);
        await page.mouse.down();
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.mouse.move(targetZone.x, targetZone.y, { steps: 15 });
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const afterForward = await getOrderStates();
        const movedOrder = afterForward.find(o => o.orderNum === forwardTestOrder.orderNum);
        
        console.log(`   Result: ${movedOrder?.orderNum} is now in '${movedOrder?.column}' (visible: ${movedOrder?.isVisible})`);
        if (movedOrder?.column === 'served' && movedOrder?.isVisible) {
          console.log('   ✅ RIGHT DRAG SUCCESS!');
        } else {
          console.log('   ❌ RIGHT DRAG FAILED - card missing or wrong position!');
        }
        orders = afterForward;
      }
    }

    // Test 3: SKIP DRAG (jumping statuses)
    console.log('\\n🔥 TEST 3: SKIP DRAG - Jump multiple statuses');
    const skipTestOrder = orders.find(order => order.column === 'new');
    if (skipTestOrder) {
      const targetZone = dropZones.find(zone => zone.station === 'ready');
      if (targetZone) {
        console.log(`   Dragging ${skipTestOrder.orderNum} from new directly to ready`);
        
        await page.mouse.move(skipTestOrder.x, skipTestOrder.y);
        await page.mouse.down();
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.mouse.move(targetZone.x, targetZone.y, { steps: 15 });
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const afterSkip = await getOrderStates();
        const movedOrder = afterSkip.find(o => o.orderNum === skipTestOrder.orderNum);
        
        console.log(`   Result: ${movedOrder?.orderNum} is now in '${movedOrder?.column}' (visible: ${movedOrder?.isVisible})`);
        if (movedOrder?.column === 'ready' && movedOrder?.isVisible) {
          console.log('   ✅ SKIP DRAG SUCCESS!');
        } else {
          console.log('   ❌ SKIP DRAG FAILED - card missing or wrong position!');
        }
      }
    }

    // Final verification - check all cards are visible
    console.log('\\n🔍 FINAL VERIFICATION: Check all cards are visible');
    const finalOrders = await getOrderStates();
    const visibleCount = finalOrders.filter(order => order.isVisible).length;
    const totalCount = finalOrders.length;
    
    console.log(`📊 Final State: ${visibleCount}/${totalCount} cards visible`);
    finalOrders.forEach(order => {
      const status = order.isVisible ? '✅' : '❌ MISSING';
      console.log(`   ${order.orderNum}: ${order.column} ${status}`);
    });

    if (visibleCount === totalCount) {
      console.log('\\n🎉 ALL TESTS PASSED: Infinite drag working perfectly!');
    } else {
      console.log(`\\n❌ CARDS MISSING: ${totalCount - visibleCount} cards disappeared during drag!`);
    }

    console.log('\\n🔍 Keeping browser open for manual verification (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAllDragDirections().catch(console.error);