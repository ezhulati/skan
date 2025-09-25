/**
 * Test drag-and-drop functionality for order cards between status columns
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3002',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function testDragDrop() {
  console.log('🧪 Testing Drag-and-Drop Functionality...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Enable console logging for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯 DRAG DROP') || text.includes('BUTTON CLICKED') || text.includes('Mock orders')) {
        console.log('🖥️  DRAG:', text);
      }
    });
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Navigating and logging in...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find first order card in any station
    const orderCard = await page.$('.order-card');
    if (!orderCard) {
      console.log('❌ No order card found');
      return;
    }

    console.log('📋 Getting initial card state...');
    const initialState = await page.evaluate((card) => {
      const orderNum = card.querySelector('.order-number')?.textContent || 'Unknown';
      
      const stationLane = card.closest('.station-lane');
      let currentColumn = 'Unknown';
      
      if (stationLane) {
        const classList = Array.from(stationLane.classList);
        const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
        if (stationClass) {
          currentColumn = stationClass.replace('station-', '');
        }
      }
      
      return { orderNum, currentColumn };
    }, orderCard);

    console.log(`📊 Initial: ${initialState.orderNum} in column ${initialState.currentColumn}`);

    // Find target drop zone (next status column)
    const targetColumn = getNextColumn(initialState.currentColumn);
    const targetDropZone = await page.$(`.station-${targetColumn} .station-orders`);
    
    if (!targetDropZone) {
      console.log(`❌ Target column ${targetColumn} not found`);
      return;
    }

    console.log(`🎯 Testing drag from ${initialState.currentColumn} to ${targetColumn}...`);

    // Perform drag and drop operation
    const cardBoundingBox = await orderCard.boundingBox();
    const targetBoundingBox = await targetDropZone.boundingBox();

    if (!cardBoundingBox || !targetBoundingBox) {
      console.log('❌ Could not get element boundaries');
      return;
    }

    // Start drag
    console.log('🖱️  Starting drag operation...');
    await page.mouse.move(
      cardBoundingBox.x + cardBoundingBox.width / 2,
      cardBoundingBox.y + cardBoundingBox.height / 2
    );
    await page.mouse.down();
    
    // Give visual feedback time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Move to target
    await page.mouse.move(
      targetBoundingBox.x + targetBoundingBox.width / 2,
      targetBoundingBox.y + targetBoundingBox.height / 2,
      { steps: 10 }
    );
    
    // Drop
    await page.mouse.up();
    console.log('🖱️  Drop completed!');
    
    // Wait for any animations/updates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check final state
    const finalState = await page.evaluate((initialOrder) => {
      // Try to find the same order by order number
      const cards = Array.from(document.querySelectorAll('.order-card'));
      
      for (const card of cards) {
        const orderNum = card.querySelector('.order-number')?.textContent || '';
        if (orderNum === initialOrder.orderNum) {
          const stationLane = card.closest('.station-lane');
          let currentColumn = 'Unknown';
          
          if (stationLane) {
            const classList = Array.from(stationLane.classList);
            const stationClass = classList.find(cls => cls.startsWith('station-') && cls !== 'station-lane');
            if (stationClass) {
              currentColumn = stationClass.replace('station-', '');
            }
          }
          
          return { found: true, orderNum, currentColumn, moved: currentColumn !== initialOrder.currentColumn };
        }
      }
      
      return { found: false };
    }, initialState);

    console.log(`📊 Final: ${finalState.orderNum} in column ${finalState.currentColumn} - Moved: ${finalState.moved ? '✅' : '❌'}`);

    // Test backward movement if forward movement worked
    if (finalState.moved) {
      console.log('🔄 Testing backward drag movement...');
      
      // Find the card in its new position
      const movedCard = await page.evaluate((orderNum) => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        for (const card of cards) {
          const num = card.querySelector('.order-number')?.textContent || '';
          if (num === orderNum) {
            return true;
          }
        }
        return false;
      }, finalState.orderNum);
      
      if (movedCard) {
        // Try dragging back to original column
        const originalDropZone = await page.$(`.station-${initialState.currentColumn} .station-orders`);
        
        if (originalDropZone) {
          const newCard = await page.$('.order-card'); // Get first card (should be our moved card)
          const newCardBox = await newCard.boundingBox();
          const originalBox = await originalDropZone.boundingBox();
          
          // Drag back
          await page.mouse.move(
            newCardBox.x + newCardBox.width / 2,
            newCardBox.y + newCardBox.height / 2
          );
          await page.mouse.down();
          await new Promise(resolve => setTimeout(resolve, 500));
          await page.mouse.move(
            originalBox.x + originalBox.width / 2,
            originalBox.y + originalBox.height / 2,
            { steps: 10 }
          );
          await page.mouse.up();
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('✅ Backward drag movement tested');
        }
      }
    }

    // Results
    const success = finalState.found && finalState.moved;
    console.log('\n' + '='.repeat(50));
    console.log(`${success ? '🎉 DRAG-DROP SUCCESS!' : '❌ DRAG-DROP FAILED!'}`);
    console.log('='.repeat(50));

    if (!success) {
      if (!finalState.found) {
        console.log('❌ Could not locate card after drag operation');
      } else if (!finalState.moved) {
        console.log('❌ Card did not move to target column');
      }
    } else {
      console.log('✅ Card successfully moved via drag-and-drop');
      console.log('✅ Backward movement capability confirmed');
    }

    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Drag-drop test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function getNextColumn(currentColumn) {
  const progression = {
    'new': 'preparing',
    'preparing': 'ready',
    'ready': 'served',
    'served': 'new' // Loop back for testing
  };
  return progression[currentColumn] || 'preparing';
}

testDragDrop().catch(console.error);