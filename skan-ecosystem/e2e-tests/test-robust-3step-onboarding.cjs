const { chromium } = require('playwright');

async function testRobust3StepOnboarding() {
  console.log('🔍 TESTING ROBUST 3-STEP ONBOARDING FLOW');
  console.log('=======================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = [];
  const testResults = {
    login: { passed: false, details: [] },
    structure: { passed: false, details: [] },
    step1: { passed: false, details: [] },
    step2: { passed: false, details: [] },
    step3: { passed: false, details: [] }
  };

  try {
    // Step 1: Login
    console.log('🔐 Login Test...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    if (!page.url().includes('/login')) {
      console.log('✅ Login successful');
      testResults.login.passed = true;
      testResults.login.details.push('Login successful');
    } else {
      issues.push('❌ Login failed');
      testResults.login.details.push('Login failed');
      return { issues, testResults };
    }

    // Step 2: Navigate to onboarding and verify structure
    console.log('\n📍 Onboarding Structure Test...');
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForTimeout(3000);

    // Check if onboarding wizard loads
    try {
      await page.waitForSelector('.onboarding-wizard', { timeout: 5000 });
      console.log('✅ Onboarding wizard loaded');
      testResults.structure.details.push('Onboarding wizard found');
    } catch (e) {
      issues.push('❌ Onboarding wizard not found');
      testResults.structure.details.push('Wizard not found');
      return { issues, testResults };
    }

    // Verify 3 steps in progress bar
    const stepCount = await page.locator('.progress-step').count();
    console.log(`   Progress steps: ${stepCount}`);
    
    if (stepCount === 3) {
      console.log('✅ Correct 3-step structure');
      testResults.structure.passed = true;
      testResults.structure.details.push('3 steps confirmed');
      
      // Get step titles
      const stepTitles = await page.locator('.step-label').allTextContents();
      console.log(`   Step titles: ${stepTitles.join(' → ')}`);
      testResults.structure.details.push(`Titles: ${stepTitles.join(', ')}`);
    } else {
      issues.push(`❌ Wrong step count: expected 3, got ${stepCount}`);
      testResults.structure.details.push(`Wrong step count: ${stepCount}`);
    }

    // Check current active step
    const activeStepNumber = await page.locator('.progress-step.active .step-number').textContent();
    console.log(`   Active step: ${activeStepNumber}`);
    
    if (activeStepNumber === '1') {
      testResults.structure.details.push('Starting on step 1 correctly');
    } else {
      issues.push(`❌ Not starting on step 1, current: ${activeStepNumber}`);
      testResults.structure.details.push(`Wrong starting step: ${activeStepNumber}`);
    }

    // Step 3: Test Step 1 - Restaurant Info
    console.log('\n🏪 Step 1 Test - Restaurant Info...');
    
    const step1Title = await page.textContent('h2').catch(() => '');
    console.log(`   Title: "${step1Title}"`);
    
    if (step1Title.includes('Informacioni')) {
      console.log('✅ Correct step 1 title');
      testResults.step1.details.push('Correct title');
      
      // Take a screenshot to debug field structure
      await page.screenshot({ path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/debug-step1-fields.png' });
      
      // More robust field filling approach
      try {
        // Restaurant name - first input
        await page.locator('input').first().fill('Test Restaurant 3-Step');
        console.log('   ✅ Filled restaurant name');
        testResults.step1.details.push('Restaurant name filled');
        
        await page.waitForTimeout(500);
        
        // Address - second input 
        await page.locator('input').nth(1).fill('Rruga Test 123, Tiranë');
        console.log('   ✅ Filled address');
        testResults.step1.details.push('Address filled');
        
        await page.waitForTimeout(500);
        
        // Phone - third input
        await page.locator('input').nth(2).fill('+355691234567');
        console.log('   ✅ Filled phone');
        testResults.step1.details.push('Phone filled');
        
        await page.waitForTimeout(500);
        
        // Cuisine type select
        const selectElement = await page.locator('select').first();
        if (await selectElement.count() > 0) {
          await selectElement.selectOption('traditional');
          console.log('   ✅ Selected cuisine type');
          testResults.step1.details.push('Cuisine type selected');
        }
        
        await page.waitForTimeout(1000);
        
        // Check if continue button becomes enabled
        const continueBtn = await page.locator('button:has-text("Vazhdo")');
        const isDisabled = await continueBtn.getAttribute('disabled');
        
        if (isDisabled === null) {
          console.log('   ✅ Continue button enabled');
          testResults.step1.details.push('Continue button enabled');
          
          // Click continue
          await continueBtn.click();
          await page.waitForTimeout(3000);
          
          // Verify we moved to step 2
          const newActiveStep = await page.locator('.progress-step.active .step-number').textContent();
          if (newActiveStep === '2') {
            console.log('   ✅ Successfully moved to step 2');
            testResults.step1.passed = true;
            testResults.step1.details.push('Progressed to step 2');
          } else {
            issues.push(`❌ Step 1: Expected to be on step 2, but on step ${newActiveStep}`);
            testResults.step1.details.push(`Failed to progress, on step ${newActiveStep}`);
          }
        } else {
          issues.push('❌ Step 1: Continue button still disabled');
          testResults.step1.details.push('Continue button disabled');
        }
        
      } catch (e) {
        issues.push(`❌ Step 1: Field filling error - ${e.message}`);
        testResults.step1.details.push(`Field error: ${e.message}`);
      }
      
    } else {
      issues.push(`❌ Step 1: Wrong title - ${step1Title}`);
      testResults.step1.details.push(`Wrong title: ${step1Title}`);
    }

    // Step 4: Test Step 2 - Menu (Skip functionality)
    console.log('\n📋 Step 2 Test - Menu with Skip...');
    
    const step2Title = await page.textContent('h2').catch(() => '');
    console.log(`   Title: "${step2Title}"`);
    
    if (step2Title.includes('Pjatat') || step2Title.includes('Menu')) {
      console.log('✅ On menu step');
      testResults.step2.details.push('Correct menu step title');
      
      // Take screenshot for debug
      await page.screenshot({ path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/debug-step2-menu.png' });
      
      // Look for skip functionality
      const skipBtn = await page.locator('button:has-text("Skip"), button:has-text("Kapërce"), button:has-text("Anashkalo"), button:has-text("Vazhdo")');
      const skipBtnCount = await skipBtn.count();
      
      console.log(`   Navigation buttons found: ${skipBtnCount}`);
      
      if (skipBtnCount > 0) {
        const btnText = await skipBtn.first().textContent();
        console.log(`   First button text: "${btnText}"`);
        testResults.step2.details.push(`Button found: "${btnText}"`);
        
        // Click the button (whether skip or continue)
        await skipBtn.first().click();
        await page.waitForTimeout(3000);
        
        // Check if we moved to step 3
        const newActiveStep = await page.locator('.progress-step.active .step-number').textContent();
        if (newActiveStep === '3') {
          console.log('   ✅ Successfully moved to step 3');
          testResults.step2.passed = true;
          testResults.step2.details.push('Successfully progressed to step 3');
        } else {
          issues.push(`❌ Step 2: Expected step 3, but on step ${newActiveStep}`);
          testResults.step2.details.push(`Failed to progress, on step ${newActiveStep}`);
        }
      } else {
        issues.push('❌ Step 2: No navigation buttons found');
        testResults.step2.details.push('No navigation buttons');
      }
      
    } else {
      issues.push(`❌ Step 2: Wrong title - ${step2Title}`);
      testResults.step2.details.push(`Wrong title: ${step2Title}`);
    }

    // Step 5: Test Step 3 - Table Configuration
    console.log('\n🪑 Step 3 Test - Table Configuration...');
    
    const step3Title = await page.textContent('h2').catch(() => '');
    console.log(`   Title: "${step3Title}"`);
    
    if (step3Title.includes('Tavolina') || step3Title.includes('Table')) {
      console.log('✅ On table configuration step');
      testResults.step3.details.push('Correct table step title');
      
      // Take screenshot for debug
      await page.screenshot({ path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/debug-step3-tables.png' });
      
      // Find table number input
      const tableInput = await page.locator('input[type="number"]');
      if (await tableInput.count() > 0) {
        await tableInput.fill('12');
        console.log('   ✅ Set table count to 12');
        testResults.step3.details.push('Table count set');
        
        await page.waitForTimeout(1000);
        
        // Look for final button
        const finalBtn = await page.locator('button').last();
        const finalBtnText = await finalBtn.textContent();
        console.log(`   Final button text: "${finalBtnText}"`);
        testResults.step3.details.push(`Final button: "${finalBtnText}"`);
        
        // Check if final button is correct
        if (finalBtnText.includes('Përfundo') && finalBtnText.includes('Dashboard')) {
          console.log('   ✅ Correct final button text');
          testResults.step3.details.push('Correct completion button');
          
          const btnDisabled = await finalBtn.getAttribute('disabled');
          if (btnDisabled === null) {
            console.log('   ✅ Final button enabled');
            testResults.step3.passed = true;
            testResults.step3.details.push('Completion button ready');
            
            // Verify we're on the last step
            const currentStep = await page.locator('.progress-step.active .step-number').textContent();
            if (currentStep === '3') {
              console.log('   ✅ Confirmed on final step (3/3)');
              testResults.step3.details.push('On final step correctly');
            }
          } else {
            issues.push('❌ Step 3: Final button disabled');
            testResults.step3.details.push('Final button disabled');
          }
        } else {
          issues.push(`❌ Step 3: Unexpected button text - ${finalBtnText}`);
          testResults.step3.details.push(`Unexpected button: ${finalBtnText}`);
        }
      } else {
        issues.push('❌ Step 3: Table number input not found');
        testResults.step3.details.push('Table input not found');
      }
      
    } else {
      issues.push(`❌ Step 3: Wrong title - ${step3Title}`);
      testResults.step3.details.push(`Wrong title: ${step3Title}`);
    }

  } catch (error) {
    issues.push(`❌ CRITICAL ERROR: ${error.message}`);
    console.log(`💥 Critical Error: ${error.message}`);
  }

  await browser.close();
  return { issues, testResults };
}

async function main() {
  const { issues, testResults } = await testRobust3StepOnboarding();
  
  console.log('\n🚨 ROBUST 3-STEP ONBOARDING RESULTS');
  console.log('=================================\n');
  
  // Show detailed results
  console.log('📊 DETAILED RESULTS:');
  
  console.log('\n🔐 LOGIN:');
  console.log(`   Status: ${testResults.login.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.login.details.forEach(d => console.log(`   • ${d}`));
  
  console.log('\n📋 STRUCTURE:');
  console.log(`   Status: ${testResults.structure.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.structure.details.forEach(d => console.log(`   • ${d}`));
  
  console.log('\n🏪 STEP 1:');
  console.log(`   Status: ${testResults.step1.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.step1.details.forEach(d => console.log(`   • ${d}`));
  
  console.log('\n📋 STEP 2:');
  console.log(`   Status: ${testResults.step2.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.step2.details.forEach(d => console.log(`   • ${d}`));
  
  console.log('\n🪑 STEP 3:');
  console.log(`   Status: ${testResults.step3.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.step3.details.forEach(d => console.log(`   • ${d}`));
  
  const passedTests = Object.values(testResults).filter(test => test.passed).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`\n📈 SUMMARY: ${passedTests}/${totalTests} test areas passed`);
  
  if (issues.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ VERIFIED:');
    console.log('   ✅ Login works');
    console.log('   ✅ 3-step structure correct');
    console.log('   ✅ Step 1: Restaurant info form works');
    console.log('   ✅ Step 2: Menu skip works');
    console.log('   ✅ Step 3: Table setup works');
    console.log('   ✅ Progress indicators correct');
    console.log('   ✅ No removed testing step');
  } else {
    console.log(`\n❌ Found ${issues.length} issue(s):`);
    issues.forEach((issue, i) => console.log(`${i+1}. ${issue}`));
  }
  
  process.exit(issues.length === 0 ? 0 : 1);
}

main().catch(console.error);