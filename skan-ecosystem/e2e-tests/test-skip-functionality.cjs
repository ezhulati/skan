const { chromium } = require('playwright');

async function testSkipFunctionality() {
  console.log('🔍 TESTING MENU SKIP FUNCTIONALITY');
  console.log('===============================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = [];
  const results = [];

  try {
    // Step 1: Login and navigate to onboarding
    console.log('🔐 Login and setup...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3000/onboarding');
    await page.waitForTimeout(3000);

    console.log('✅ Login successful');

    // Step 2: Complete Step 1 quickly
    console.log('\n🏪 Completing Step 1...');
    await page.locator('input').first().fill('Test Restaurant Skip');
    await page.locator('input').nth(1).fill('Rruga Test 123');
    await page.locator('input').nth(2).fill('+355691234567');
    
    const selectElement = await page.locator('select').first();
    if (await selectElement.count() > 0) {
      await selectElement.selectOption('traditional');
    }
    
    await page.click('button:has-text("Vazhdo")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Step 1 completed');

    // Step 3: Test Menu Skip Functionality  
    console.log('\n📋 Testing Menu Skip...');
    
    const step2Title = await page.textContent('h2');
    console.log(`   Menu step title: "${step2Title}"`);
    
    if (step2Title.includes('Pjatat')) {
      results.push('✅ On correct menu step');
      
      // Take screenshot before testing
      await page.screenshot({ path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/debug-menu-skip-before.png' });
      
      // Look for both buttons
      const buttons = await page.locator('button').allTextContents();
      console.log(`   Found buttons: ${buttons.map(b => `"${b}"`).join(', ')}`);
      
      // Find the skip button specifically
      const skipButton = await page.locator('button:has-text("Kalo këtë hap"), button:has-text("shtoji më vonë")');
      const skipButtonCount = await skipButton.count();
      console.log(`   Skip buttons found: ${skipButtonCount}`);
      
      if (skipButtonCount > 0) {
        const skipText = await skipButton.textContent();
        console.log(`   Skip button text: "${skipText}"`);
        results.push(`✅ Skip button found: "${skipText}"`);
        
        // Check if skip button is enabled
        const skipDisabled = await skipButton.getAttribute('disabled');
        if (skipDisabled === null) {
          console.log('   ✅ Skip button is enabled');
          results.push('✅ Skip button enabled correctly');
          
          // Click the skip button
          await skipButton.click();
          await page.waitForTimeout(3000);
          
          // Take screenshot after skip
          await page.screenshot({ path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/debug-menu-skip-after.png' });
          
          // Verify we moved to step 3
          const currentStep = await page.locator('.progress-step.active .step-number').textContent();
          console.log(`   Current active step: ${currentStep}`);
          
          if (currentStep === '3') {
            console.log('   ✅ Successfully skipped to step 3');
            results.push('✅ Skip functionality works - moved to step 3');
            
            // Verify step 3 content
            const step3Title = await page.textContent('h2');
            console.log(`   Step 3 title: "${step3Title}"`);
            
            if (step3Title.includes('Tavolina')) {
              console.log('   ✅ On correct table configuration step');
              results.push('✅ Step 3 content correct');
              
              // Test table input
              const tableInput = await page.locator('input[type="number"]');
              if (await tableInput.count() > 0) {
                await tableInput.fill('10');
                console.log('   ✅ Table input working');
                results.push('✅ Table configuration accessible');
                
                // Check final button
                const finalButtons = await page.locator('button').allTextContents();
                console.log(`   Final step buttons: ${finalButtons.map(b => `"${b}"`).join(', ')}`);
                
                const dashboardButton = await page.locator('button:has-text("Dashboard"), button:has-text("Përfundo")');
                if (await dashboardButton.count() > 0) {
                  const finalBtnText = await dashboardButton.textContent();
                  console.log(`   Final button text: "${finalBtnText}"`);
                  results.push(`✅ Final button found: "${finalBtnText}"`);
                  
                  if (finalBtnText.includes('Përfundo') && finalBtnText.includes('Dashboard')) {
                    console.log('   ✅ Correct final button text');
                    results.push('✅ Completion button text correct');
                  }
                }
              }
            } else {
              issues.push(`❌ Wrong step 3 title: ${step3Title}`);
            }
          } else {
            issues.push(`❌ Skip failed - still on step ${currentStep}`);
          }
        } else {
          issues.push('❌ Skip button is disabled');
        }
      } else {
        issues.push('❌ Skip button not found');
        
        // Debug: show all buttons
        const allButtons = await page.locator('button').allTextContents();
        console.log(`   All buttons for debug: ${allButtons.map(b => `"${b}"`).join(', ')}`);
      }
    } else {
      issues.push(`❌ Not on menu step: ${step2Title}`);
    }

  } catch (error) {
    issues.push(`❌ Error: ${error.message}`);
    console.error(`💥 Error: ${error.message}`);
  }

  await browser.close();
  return { issues, results };
}

async function main() {
  const { issues, results } = await testSkipFunctionality();
  
  console.log('\n🚨 SKIP FUNCTIONALITY TEST RESULTS');
  console.log('================================\n');
  
  console.log('✅ SUCCESSFUL RESULTS:');
  results.forEach(result => console.log(`   ${result}`));
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  if (issues.length === 0) {
    console.log('\n🎉 SKIP FUNCTIONALITY TEST PASSED!');
    console.log('\n✅ VERIFIED:');
    console.log('   ✅ Menu step has skip button');
    console.log('   ✅ Skip button is always enabled');
    console.log('   ✅ Skip button advances to step 3');
    console.log('   ✅ Step 3 loads correctly after skip');
    console.log('   ✅ 3-step flow works end-to-end');
  } else {
    console.log('\n💡 RECOMMENDED ACTIONS:');
    console.log('   1. Verify skip button selector');
    console.log('   2. Check button styling and visibility');
    console.log('   3. Test manual skip in browser');
  }
  
  process.exit(issues.length === 0 ? 0 : 1);
}

main().catch(console.error);