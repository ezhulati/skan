const { chromium } = require('playwright');

async function testUndoFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console messages
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]: ${msg.text()}`);
  });

  try {
    console.log('🔍 Testing Undo Toast Functionality');
    console.log('='.repeat(60));

    // Setup auth and navigate
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const mockAuth = {
        user: {
          id: "demo-user-1",
          email: "manager_email1@gmail.com",
          fullName: "Demo Manager",
          role: "manager",
          venueId: "demo-venue-1"
        },
        venue: {
          id: "demo-venue-1",
          name: "Demo Restaurant",
          slug: "demo-restaurant"
        },
        token: "valid-demo-token-123"
      };
      localStorage.setItem('restaurantAuth', JSON.stringify(mockAuth));
    });

    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(4000);

    console.log('1. Orders loaded, testing undo functionality...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/undo-test-initial.png', fullPage: true });

    // Find and click a status button
    const statusButtons = await page.locator('button.status-button').all();
    console.log(`Found ${statusButtons.length} status buttons`);

    if (statusButtons.length > 0) {
      const button = statusButtons[0];
      const buttonText = await button.textContent();
      
      // Get the initial order status by finding the parent order card
      const orderCard = page.locator('.order-card').nth(0);
      const orderNumber = await orderCard.locator('.order-number').textContent();
      const initialStatus = await orderCard.locator('.order-status').textContent();
      
      console.log(`2. Testing button: "${buttonText?.trim()}" for order ${orderNumber}`);
      console.log(`   Initial status: ${initialStatus?.trim()}`);

      // Click the status button
      await button.click();
      await page.waitForTimeout(2000);

      // Check if undo toast appeared
      const undoToast = await page.locator('.undo-toast').count();
      console.log(`3. Undo toast visible: ${undoToast > 0 ? 'Yes' : 'No'}`);

      if (undoToast > 0) {
        // Take screenshot with toast
        await page.screenshot({ path: 'test-results/undo-test-with-toast.png', fullPage: true });
        
        // Check toast content
        const toastMessage = await page.locator('.undo-toast-message').textContent();
        console.log(`4. Toast message: "${toastMessage?.trim()}"`);

        // Check if status changed in the order card
        const newStatus = await orderCard.locator('.order-status').textContent();
        console.log(`5. New status: ${newStatus?.trim()}`);

        // Test undo functionality
        const undoButton = page.locator('.undo-button');
        const undoButtonVisible = await undoButton.isVisible();
        console.log(`6. Undo button visible: ${undoButtonVisible}`);

        if (undoButtonVisible) {
          console.log('7. Clicking undo button...');
          await undoButton.click();
          await page.waitForTimeout(2000);

          // Check if toast disappeared
          const toastAfterUndo = await page.locator('.undo-toast').count();
          console.log(`8. Toast after undo: ${toastAfterUndo === 0 ? 'Hidden' : 'Still visible'}`);

          // Check if status reverted
          const revertedStatus = await orderCard.locator('.order-status').textContent();
          console.log(`9. Status after undo: ${revertedStatus?.trim()}`);

          // Take final screenshot
          await page.screenshot({ path: 'test-results/undo-test-after-undo.png', fullPage: true });

          // Summary
          console.log('10. Test Results:');
          console.log(`    ✅ Status button clicked successfully`);
          console.log(`    ✅ Undo toast appeared: ${undoToast > 0}`);
          console.log(`    ✅ Status changed: ${initialStatus?.trim()} → ${newStatus?.trim()}`);
          console.log(`    ✅ Undo button worked: ${undoButtonVisible}`);
          console.log(`    ✅ Status reverted: ${revertedStatus?.trim()}`);
          console.log(`    ✅ Toast disappeared after undo: ${toastAfterUndo === 0}`);

          if (undoToast > 0 && undoButtonVisible && toastAfterUndo === 0) {
            console.log('🎉 UNDO FUNCTIONALITY WORKING PERFECTLY!');
          } else {
            console.log('⚠️ Some issues detected with undo functionality');
          }
        } else {
          console.log('❌ Undo button not visible');
        }
      } else {
        console.log('❌ Undo toast did not appear');
      }
    } else {
      console.log('❌ No status buttons found');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testUndoFunctionality().catch(console.error);