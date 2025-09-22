const puppeteer = require('puppeteer');

async function testQuantityControls() {
  console.log('🧪 Testing quantity controls for menu items...\n');

  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 }); // iPhone X size

    // Navigate to Beach Bar menu
    console.log('📱 Navigating to Beach Bar menu...');
    await page.goto('http://localhost:3002/beach-bar-durres/a1/menu');
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });

    // Wait for menu items to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find the first menu item (Albanian Beer)
    console.log('🍺 Looking for Albanian Beer menu item...');
    const menuItems = await page.$$('[data-testid="menu-item"]');
    
    if (menuItems.length === 0) {
      throw new Error('No menu items found');
    }

    const firstMenuItem = menuItems[0];
    
    // Step 1: Verify initial state shows "Add to Cart" button
    console.log('✅ Step 1: Checking initial state...');
    const addToCartButton = await firstMenuItem.$('[data-testid="add-to-cart-button"]');
    if (!addToCartButton) {
      console.log('❌ Initial "Add to Cart" button not found');
      return false;
    }
    console.log('✅ Initial "Add to Cart" button found');

    // Step 2: Click "Add to Cart" button
    console.log('✅ Step 2: Adding item to cart...');
    await addToCartButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Verify quantity controls appear
    console.log('✅ Step 3: Checking quantity controls appear...');
    const minusButton = await firstMenuItem.$('[data-testid="minus-button"]');
    const plusButton = await firstMenuItem.$('[data-testid="plus-button"]');
    const quantitySpan = await firstMenuItem.$('[data-testid="quantity-display"]');

    if (!minusButton || !plusButton) {
      console.log('❌ Quantity control buttons not found');
      return false;
    }
    console.log('✅ Quantity control buttons found');

    // Check quantity shows "1"
    const quantityText = await page.evaluate(element => element.textContent, quantitySpan);
    if (quantityText.trim() !== '1') {
      console.log(`❌ Expected quantity "1", got "${quantityText.trim()}"`);
      return false;
    }
    console.log('✅ Quantity shows "1"');

    // Step 4: Test increment (plus button)
    console.log('✅ Step 4: Testing increment...');
    await plusButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newQuantityText = await page.evaluate(element => element.textContent, quantitySpan);
    if (newQuantityText.trim() !== '2') {
      console.log(`❌ Expected quantity "2", got "${newQuantityText.trim()}"`);
      return false;
    }
    console.log('✅ Increment works - quantity is now "2"');

    // Step 5: Test another increment
    console.log('✅ Step 5: Testing another increment...');
    await plusButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const thirdQuantityText = await page.evaluate(element => element.textContent, quantitySpan);
    if (thirdQuantityText.trim() !== '3') {
      console.log(`❌ Expected quantity "3", got "${thirdQuantityText.trim()}"`);
      return false;
    }
    console.log('✅ Second increment works - quantity is now "3"');

    // Step 6: Test decrement (minus button)
    console.log('✅ Step 6: Testing decrement...');
    await minusButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const decrementedQuantityText = await page.evaluate(element => element.textContent, quantitySpan);
    if (decrementedQuantityText.trim() !== '2') {
      console.log(`❌ Expected quantity "2", got "${decrementedQuantityText.trim()}"`);
      return false;
    }
    console.log('✅ Decrement works - quantity is now "2"');

    // Step 7: Test decrement to 1
    console.log('✅ Step 7: Testing decrement to 1...');
    await minusButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const oneQuantityText = await page.evaluate(element => element.textContent, quantitySpan);
    if (oneQuantityText.trim() !== '1') {
      console.log(`❌ Expected quantity "1", got "${oneQuantityText.trim()}"`);
      return false;
    }
    console.log('✅ Decrement to 1 works - quantity is now "1"');

    // Step 8: Test decrement to 0 (should remove item and show "Add to Cart" again)
    console.log('✅ Step 8: Testing decrement to 0 (removal)...');
    await minusButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if "Add to Cart" button is back
    const addToCartButtonAgain = await firstMenuItem.$('[data-testid="add-to-cart-button"]');
    if (!addToCartButtonAgain) {
      console.log('❌ "Add to Cart" button not restored after decrementing to 0');
      return false;
    }
    console.log('✅ Item removed from cart - "Add to Cart" button restored');

    // Step 9: Verify quantity controls are gone
    const quantityControlsGone = await firstMenuItem.$('[data-testid="quantity-controls"]');
    
    if (quantityControlsGone) {
      console.log('❌ Quantity controls still visible after removal');
      return false;
    }
    console.log('✅ Quantity controls properly hidden after removal');

    console.log('\n🎉 All quantity control tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Initial "Add to Cart" button works');
    console.log('   ✅ Quantity controls appear after adding item');
    console.log('   ✅ Plus button increments quantity correctly');
    console.log('   ✅ Minus button decrements quantity correctly');
    console.log('   ✅ Decrementing to 0 removes item from cart');
    console.log('   ✅ "Add to Cart" button returns after removal');
    console.log('   ✅ Quantity controls hide properly after removal');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testQuantityControls().then(success => {
  if (success) {
    console.log('\n✅ Quantity controls test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Quantity controls test failed!');
    process.exit(1);
  }
});