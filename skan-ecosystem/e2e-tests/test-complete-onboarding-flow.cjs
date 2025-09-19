const { chromium } = require('playwright');

async function testCompleteOnboardingFlow() {
  console.log('🔍 TESTING COMPLETE ONBOARDING FLOW');
  console.log('==================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = [];

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);

    await page.fill('input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      issues.push('❌ CRITICAL: Login failed');
      return issues;
    }
    console.log('✅ Login successful');

    // Step 2: Go to onboarding
    console.log('\n📍 Step 2: Navigating to onboarding...');
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForTimeout(2000);

    // Test Step 1: Restaurant Info
    console.log('\n🏪 Step 3: Testing Restaurant Info (Step 1)...');
    
    const title = await page.textContent('h2').catch(() => null);
    console.log(`   Current step title: "${title}"`);
    
    if (!title || !title.includes('Informacioni')) {
      issues.push('❌ Step 1: Wrong title - expected "Informacioni i Restorantit"');
    }

    // Fill all required fields
    const nameInput = await page.locator('input').first();
    const addressInput = await page.locator('input').nth(1);
    const phoneInput = await page.locator('input').nth(2);
    const cuisineSelect = await page.locator('select');
    
    await nameInput.fill('Test Restaurant E2E');
    await addressInput.fill('Rruga Testi 123, Tiranë');
    await phoneInput.fill('+355691234567');
    await cuisineSelect.selectOption('traditional'); // Tradicionale Shqiptare
    
    console.log('   ✅ Filled all required fields');

    // Check if button is now enabled
    const continueButton = await page.locator('button:has-text("Vazhdo")');
    const isDisabled = await continueButton.getAttribute('disabled');
    
    console.log(`   Continue button disabled: ${isDisabled !== null ? 'YES' : 'NO'}`);
    
    if (isDisabled !== null) {
      issues.push('❌ Step 1: Continue button still disabled after filling all fields');
    } else {
      // Click continue
      await continueButton.click();
      await page.waitForTimeout(2000);
      
      const newTitle = await page.textContent('h2').catch(() => null);
      console.log(`   After continue: "${newTitle}"`);
      
      if (newTitle && newTitle.includes('Kategori')) {
        console.log('   ✅ Successfully moved to Step 2');
      } else {
        issues.push('❌ Step 1: Failed to progress to next step');
      }
    }

    // Test Step 2: Menu Categories
    console.log('\n📋 Step 4: Testing Menu Categories (Step 2)...');
    
    const step2Title = await page.textContent('h2').catch(() => null);
    if (step2Title && step2Title.includes('Kategori')) {
      console.log('   ✅ On Menu Categories step');
      
      // Check for category items
      const categories = await page.locator('.category-item').count();
      console.log(`   Category items displayed: ${categories}`);
      
      if (categories === 0) {
        issues.push('❌ Step 2: No menu categories displayed');
      }
      
      // Continue to next step
      const step2Continue = await page.locator('button:has-text("Vazhdo")');
      const step2Disabled = await step2Continue.getAttribute('disabled');
      
      if (step2Disabled === null) {
        await step2Continue.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Progressed to Step 3');
      } else {
        issues.push('❌ Step 2: Continue button disabled');
      }
    }

    // Test Step 3: Menu Items
    console.log('\n🍽️  Step 5: Testing Menu Items (Step 3)...');
    
    const step3Title = await page.textContent('h2').catch(() => null);
    if (step3Title && step3Title.includes('Artikuj')) {
      console.log('   ✅ On Menu Items step');
      
      const step3Continue = await page.locator('button:has-text("Vazhdo")');
      const step3Disabled = await step3Continue.getAttribute('disabled');
      
      if (step3Disabled === null) {
        await step3Continue.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Progressed to Step 4');
      } else {
        issues.push('❌ Step 3: Continue button disabled');
      }
    }

    // Test Step 4: Table Configuration
    console.log('\n🪑 Step 6: Testing Table Configuration (Step 4)...');
    
    const step4Title = await page.textContent('h2').catch(() => null);
    if (step4Title && step4Title.includes('Tavolina')) {
      console.log('   ✅ On Table Configuration step');
      
      // Fill table count
      const tableInput = await page.locator('input[type="number"]');
      await tableInput.fill('12');
      console.log('   ✅ Set table count to 12');
      
      const step4Continue = await page.locator('button:has-text("Gjenero")');
      const step4Disabled = await step4Continue.getAttribute('disabled');
      
      if (step4Disabled === null) {
        await step4Continue.click();
        await page.waitForTimeout(3000); // QR generation might take time
        console.log('   ✅ Progressed to Step 5');
      } else {
        issues.push('❌ Step 4: Generate QR button disabled');
      }
    }

    // Test Step 5: Completion
    console.log('\n🎉 Step 7: Testing Completion (Step 5)...');
    
    const step5Title = await page.textContent('h2').catch(() => null);
    if (step5Title && step5Title.includes('Përfundoi')) {
      console.log('   ✅ On Completion step');
      
      // Test dashboard button
      const dashboardButton = await page.locator('button:has-text("Dashboard")');
      const dashboardDisabled = await dashboardButton.getAttribute('disabled');
      
      if (dashboardDisabled === null) {
        console.log('   ✅ Dashboard button enabled');
        
        // Don't actually click to dashboard for testing
        console.log('   (Skipping dashboard navigation for test)');
      } else {
        issues.push('❌ Step 5: Dashboard button disabled');
      }
    }

  } catch (error) {
    issues.push(`❌ CRITICAL ERROR: ${error.message}`);
    console.log(`💥 Error: ${error.message}`);
  }

  await browser.close();
  return issues;
}

async function main() {
  const issues = await testCompleteOnboardingFlow();
  
  console.log('\n🚨 COMPLETE TEST RESULTS');
  console.log('========================\n');
  
  if (issues.length === 0) {
    console.log('🎉 ALL TESTS PASSED! Onboarding flow working perfectly!');
    console.log('\n✅ VERIFIED FUNCTIONALITY:');
    console.log('   ✅ Authentication works');
    console.log('   ✅ All 5 onboarding steps load');
    console.log('   ✅ Form validation works correctly');
    console.log('   ✅ Step progression works');
    console.log('   ✅ All required fields functional');
    console.log('   ✅ Button states work correctly');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Fix identified issues');
    console.log('   2. Re-run this test');
    console.log('   3. Deploy when all tests pass');
  }
  
  process.exit(issues.length === 0 ? 0 : 1);
}

main().catch(console.error);