/**
 * SIMPLE DRAG TEST
 * Quick test to verify drag works
 */

const puppeteer = require('puppeteer');

async function simpleManualDragTest() {
  console.log('🚀 SIMPLE DRAG TEST');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 100
  });

  const page = await browser.newPage();
  
  try {
    console.log('🚪 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.station-lanes-container', { timeout: 10000 });
    
    // Enable all console logging
    page.on('console', msg => console.log('🖥️ ', msg.text()));
    
    console.log('✅ Dashboard loaded - looking for draggable elements');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find first draggable element
    const draggable = await page.$('[data-order-id]');
    if (!draggable) {
      console.log('❌ No draggable elements found');
      return;
    }
    
    // Find target lane
    const targetLane = await page.$('.station-lane[data-station="preparing"]');
    if (!targetLane) {
      console.log('❌ No target lane found');
      return;
    }
    
    const dragBox = await draggable.boundingBox();
    const targetBox = await targetLane.boundingBox();
    
    console.log('🎮 Starting drag operation...');
    console.log('📍 From:', dragBox);
    console.log('📍 To:', targetBox);
    
    // Perform drag
    await page.mouse.move(dragBox.x + dragBox.width/2, dragBox.y + dragBox.height/2);
    await page.mouse.down();
    
    console.log('🖱️  Mouse down - waiting for clone...');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('🖱️  Moving to target...');
    await page.mouse.move(targetBox.x + targetBox.width/2, targetBox.y + targetBox.height/2);
    
    console.log('🖱️  Mouse up...');
    await page.mouse.up();
    
    console.log('✅ Drag complete - checking result...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🏁 Test complete - keeping browser open for 5 seconds');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

simpleManualDragTest().catch(console.error);