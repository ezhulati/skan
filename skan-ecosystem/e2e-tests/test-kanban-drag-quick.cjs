/**
 * QUICK KANBAN DRAG TEST
 * Test the side-by-side Kanban lanes with drag functionality
 */

const puppeteer = require('puppeteer');

async function testKanbanDrag() {
  console.log('🏁 TESTING KANBAN DRAG FUNCTIONALITY');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    // Navigate to dashboard
    console.log('📱 Navigating to dashboard...');
    await page.goto('http://localhost:3000/login');
    
    // Login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.station-lanes-container', { timeout: 15000 });
    console.log('✅ Kanban board loaded');
    
    // Check for side-by-side lanes
    const lanesLayout = await page.$eval('.station-lanes-container', (el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        childCount: el.children.length
      };
    });
    
    console.log('📊 Lanes layout:', lanesLayout);
    
    if (lanesLayout.display === 'grid' && lanesLayout.childCount === 4) {
      console.log('✅ KANBAN LAYOUT: 4 side-by-side lanes detected!');
    } else {
      console.log('❌ KANBAN LAYOUT: Lanes not properly arranged');
    }
    
    // Check for draggable orders
    const orders = await page.$$('[data-order-id]');
    console.log('📋 Found orders:', orders.length);
    
    if (orders.length > 0) {
      console.log('🎮 Testing drag functionality...');
      
      // Enable console logging for drag events
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('BULLETPROOF DRAG') || text.includes('DRAG')) {
          console.log('🖥️ ', text);
        }
      });
      
      // Try to drag first order
      const firstOrder = orders[0];
      const orderBox = await firstOrder.boundingBox();
      
      // Find a different lane to drop into
      const lanes = await page.$$('.station-lane');
      const targetLane = lanes[1]; // Second lane
      const laneBox = await targetLane.boundingBox();
      
      // Perform drag
      await page.mouse.move(orderBox.x + orderBox.width / 2, orderBox.y + orderBox.height / 2);
      await page.mouse.down();
      await new Promise(resolve => setTimeout(resolve, 100));
      await page.mouse.move(laneBox.x + laneBox.width / 2, laneBox.y + laneBox.height / 2);
      await page.mouse.up();
      
      console.log('🎯 Drag operation completed');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ KANBAN DRAG TEST COMPLETE');
    } else {
      console.log('❌ No draggable orders found');
    }
    
    // Keep browser open to see result
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testKanbanDrag().catch(console.error);