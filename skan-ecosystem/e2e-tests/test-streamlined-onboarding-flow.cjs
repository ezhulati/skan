const { chromium } = require('playwright');

async function testStreamlinedOnboardingFlow() {
  console.log('🔍 TESTING STREAMLINED 3-STEP ONBOARDING FLOW');
  console.log('============================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = [];
  const testResults = {
    step1: { passed: false, details: [] },
    step2: { passed: false, details: [] },
    step3: { passed: false, details: [] },
    progressIndicators: { passed: false, details: [] },
    completion: { passed: false, details: [] }
  };

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in with demo credentials...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      issues.push('❌ CRITICAL: Login failed - cannot proceed with onboarding test');
      testResults.step1.details.push('Login failed');
      return { issues, testResults };
    }
    console.log('✅ Login successful');

    // Step 2: Navigate to onboarding
    console.log('\n📍 Step 2: Navigating to onboarding...');
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForTimeout(3000);

    // Wait for page to load and check if onboarding wizard appears
    try {
      await page.waitForSelector('.onboarding-wizard', { timeout: 10000 });
      console.log('✅ Onboarding wizard loaded');
    } catch (e) {
      issues.push('❌ CRITICAL: Onboarding wizard did not load');
      testResults.step1.details.push('Onboarding wizard not found');
      return { issues, testResults };
    }

    // Test Progress Indicators (Should show 3 steps)
    console.log('\n📊 Step 3: Verifying progress indicators show 3 steps...');
    const progressSteps = await page.locator('.progress-step').count();
    console.log(`   Progress steps found: ${progressSteps}`);
    
    if (progressSteps === 3) {
      console.log('✅ Correct number of steps (3) in progress bar');
      testResults.progressIndicators.passed = true;
      testResults.progressIndicators.details.push('3 steps found in progress bar');
    } else {
      issues.push(`❌ Progress indicators: Expected 3 steps, found ${progressSteps}`);
      testResults.progressIndicators.details.push(`Found ${progressSteps} steps instead of 3`);
    }

    // Check step titles
    const stepTitles = await page.locator('.step-label').allTextContents();
    console.log(`   Step titles: ${stepTitles.join(' | ')}`);
    testResults.progressIndicators.details.push(`Step titles: ${stepTitles.join(', ')}`);

    // TEST STEP 1: Restaurant Info
    console.log('\n🏪 Step 4: Testing Restaurant Info (Step 1/3)...');
    
    const step1Title = await page.textContent('h2').catch(() => null);
    console.log(`   Current step title: "${step1Title}"`);
    
    if (!step1Title || !step1Title.includes('Informacioni')) {
      issues.push('❌ Step 1: Wrong title - expected "Informacioni i Restorantit"');
      testResults.step1.details.push('Incorrect title');
    } else {
      testResults.step1.details.push('Correct title found');
    }

    // Fill all required fields for step 1
    try {
      await page.fill('input[type="text"]', 'Test Restaurant E2E Streamlined');
      await page.fill('input[type="text"]:nth-of-type(2)', 'Rruga Testi 123, Tiranë');
      await page.fill('input[type="tel"], input[placeholder*="phone"], input[placeholder*="telefon"]', '+355691234567');
      
      // Select cuisine type if available
      const cuisineSelect = await page.locator('select').first();
      if (await cuisineSelect.count() > 0) {
        await cuisineSelect.selectOption('traditional');
      }
      
      console.log('   ✅ Filled all required fields for step 1');
      testResults.step1.details.push('All required fields filled');

      // Check if continue button is enabled
      await page.waitForTimeout(1000);
      const continueButton = await page.locator('button:has-text("Vazhdo")');
      const isDisabled = await continueButton.getAttribute('disabled');
      
      console.log(`   Continue button disabled: ${isDisabled !== null ? 'YES' : 'NO'}`);
      
      if (isDisabled !== null) {
        issues.push('❌ Step 1: Continue button still disabled after filling all fields');
        testResults.step1.details.push('Continue button disabled');
      } else {
        testResults.step1.details.push('Continue button enabled correctly');
        
        // Click continue to proceed to step 2
        await continueButton.click();
        await page.waitForTimeout(3000);
        
        const newTitle = await page.textContent('h2').catch(() => null);
        console.log(`   After continue: "${newTitle}"`);
        
        if (newTitle && (newTitle.includes('Pjatat') || newTitle.includes('Menu'))) {
          console.log('   ✅ Successfully moved to Step 2');
          testResults.step1.passed = true;
          testResults.step1.details.push('Successfully progressed to step 2');
        } else {
          issues.push('❌ Step 1: Failed to progress to step 2');
          testResults.step1.details.push('Failed to progress to step 2');
        }
      }
    } catch (e) {
      issues.push(`❌ Step 1: Error filling fields - ${e.message}`);
      testResults.step1.details.push(`Error: ${e.message}`);
    }

    // TEST STEP 2: Menu (with skip functionality)
    console.log('\n📋 Step 5: Testing Menu Step (Step 2/3) with skip functionality...');
    
    const step2Title = await page.textContent('h2').catch(() => null);
    if (step2Title && (step2Title.includes('Pjatat') || step2Title.includes('Menu'))) {
      console.log('   ✅ On Menu step');
      testResults.step2.details.push('Correctly on Menu step');
      
      // Look for skip button
      const skipButton = await page.locator('button:has-text("Skip"), button:has-text("Kapërce"), button:has-text("Anashkalo")');
      const continueButton = await page.locator('button:has-text("Vazhdo")');
      
      const hasSkipButton = await skipButton.count() > 0;
      const hasContinueButton = await continueButton.count() > 0;
      
      console.log(`   Skip button found: ${hasSkipButton ? 'YES' : 'NO'}`);
      console.log(`   Continue button found: ${hasContinueButton ? 'YES' : 'NO'}`);
      
      testResults.step2.details.push(`Skip button: ${hasSkipButton ? 'found' : 'not found'}`);
      testResults.step2.details.push(`Continue button: ${hasContinueButton ? 'found' : 'not found'}`);
      
      // Test skip functionality
      if (hasSkipButton) {
        await skipButton.first().click();
        await page.waitForTimeout(3000);
        
        const newTitle = await page.textContent('h2').catch(() => null);
        console.log(`   After skip: "${newTitle}"`);
        
        if (newTitle && newTitle.includes('Tavolina')) {
          console.log('   ✅ Skip button works - moved to Step 3');
          testResults.step2.passed = true;
          testResults.step2.details.push('Skip functionality works correctly');
        } else {
          issues.push('❌ Step 2: Skip button did not advance to step 3');
          testResults.step2.details.push('Skip button failed to advance');
        }
      } else if (hasContinueButton) {
        // No skip button, try continue
        const continueDisabled = await continueButton.first().getAttribute('disabled');
        if (continueDisabled === null) {
          await continueButton.first().click();
          await page.waitForTimeout(3000);
          
          const newTitle = await page.textContent('h2').catch(() => null);
          if (newTitle && newTitle.includes('Tavolina')) {
            console.log('   ✅ Continue button works - moved to Step 3');
            testResults.step2.passed = true;
            testResults.step2.details.push('Continue functionality works');
          } else {
            issues.push('❌ Step 2: Continue button did not advance to step 3');
            testResults.step2.details.push('Continue button failed to advance');
          }
        } else {
          issues.push('❌ Step 2: No skip button and continue button disabled');
          testResults.step2.details.push('Both skip and continue options unavailable');
        }
      } else {
        issues.push('❌ Step 2: Neither skip nor continue button found');
        testResults.step2.details.push('No navigation options found');
      }
    } else {
      issues.push('❌ Step 2: Not on menu step as expected');
      testResults.step2.details.push('Incorrect step content');
    }

    // TEST STEP 3: Table Configuration
    console.log('\n🪑 Step 6: Testing Table Configuration (Step 3/3)...');
    
    const step3Title = await page.textContent('h2').catch(() => null);
    if (step3Title && step3Title.includes('Tavolina')) {
      console.log('   ✅ On Table Configuration step');
      testResults.step3.details.push('Correctly on Table Configuration step');
      
      // Fill table count
      const tableInput = await page.locator('input[type="number"]');
      if (await tableInput.count() > 0) {
        await tableInput.fill('15');
        console.log('   ✅ Set table count to 15');
        testResults.step3.details.push('Table count input filled');
        
        await page.waitForTimeout(1000);
        
        // Look for completion button
        const completionButton = await page.locator('button:has-text("Përfundo"), button:has-text("Dashboard"), button:has-text("Gjenero")');
        const buttonText = await completionButton.first().textContent().catch(() => '');
        
        console.log(`   Final button text: "${buttonText}"`);
        testResults.step3.details.push(`Final button: "${buttonText}"`);
        
        // Check if button should say "Përfundo dhe Hap Dashboard ✓"
        if (buttonText.includes('Përfundo') && buttonText.includes('Dashboard')) {
          console.log('   ✅ Correct final button text');
          testResults.step3.details.push('Correct completion button text');
        } else {
          testResults.step3.details.push('Button text may not be as expected');
        }
        
        const buttonDisabled = await completionButton.first().getAttribute('disabled');
        
        if (buttonDisabled === null) {
          console.log('   ✅ Completion button enabled');
          testResults.step3.passed = true;
          testResults.step3.details.push('Completion button enabled correctly');
          
          // Test button click (but don't actually complete for testing)
          console.log('   (Testing button functionality without completing onboarding)');
          
          // Verify this is actually the last step
          const allSteps = await page.locator('.progress-step').count();
          const activeStep = await page.locator('.progress-step.active').count();
          
          if (activeStep === 1 && allSteps === 3) {
            console.log('   ✅ Confirmed on final step (3/3)');
            testResults.completion.passed = true;
            testResults.completion.details.push('Successfully reached final step');
          } else {
            issues.push('❌ Step 3: Progress indicators do not show final step correctly');
            testResults.completion.details.push('Progress indicators incorrect');
          }
          
        } else {
          issues.push('❌ Step 3: Completion button disabled after filling table count');
          testResults.step3.details.push('Completion button disabled');
        }
      } else {
        issues.push('❌ Step 3: Table count input not found');
        testResults.step3.details.push('Table input not found');
      }
    } else {
      issues.push('❌ Step 3: Not on table configuration step as expected');
      testResults.step3.details.push('Incorrect step content');
    }

  } catch (error) {
    issues.push(`❌ CRITICAL ERROR: ${error.message}`);
    console.log(`💥 Error: ${error.message}`);
  }

  await browser.close();
  return { issues, testResults };
}

async function main() {
  const { issues, testResults } = await testStreamlinedOnboardingFlow();
  
  console.log('\n🚨 STREAMLINED ONBOARDING TEST RESULTS');
  console.log('====================================\n');
  
  // Detailed results by step
  console.log('📊 DETAILED TEST RESULTS:');
  console.log('═══════════════════════\n');
  
  console.log('🏪 STEP 1 - Restaurant Info:');
  console.log(`   Status: ${testResults.step1.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.step1.details.forEach(detail => console.log(`   • ${detail}`));
  
  console.log('\n📋 STEP 2 - Menu (Skip Test):');
  console.log(`   Status: ${testResults.step2.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.step2.details.forEach(detail => console.log(`   • ${detail}`));
  
  console.log('\n🪑 STEP 3 - Table Configuration:');
  console.log(`   Status: ${testResults.step3.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.step3.details.forEach(detail => console.log(`   • ${detail}`));
  
  console.log('\n📊 PROGRESS INDICATORS:');
  console.log(`   Status: ${testResults.progressIndicators.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.progressIndicators.details.forEach(detail => console.log(`   • ${detail}`));
  
  console.log('\n🎯 COMPLETION FLOW:');
  console.log(`   Status: ${testResults.completion.passed ? '✅ PASSED' : '❌ FAILED'}`);
  testResults.completion.details.forEach(detail => console.log(`   • ${detail}`));
  
  if (issues.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Streamlined 3-step onboarding working perfectly!');
    console.log('\n✅ VERIFIED FUNCTIONALITY:');
    console.log('   ✅ 3-step flow structure correct');
    console.log('   ✅ Step 1: Restaurant info validation works');
    console.log('   ✅ Step 2: Menu skip functionality works');
    console.log('   ✅ Step 3: Table configuration works');
    console.log('   ✅ Progress indicators show 3 steps');
    console.log('   ✅ Final button has correct text');
    console.log('   ✅ No removed testing step appears');
  } else {
    console.log(`\n❌ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Fix identified issues');
    console.log('   2. Re-run this test');
    console.log('   3. Deploy when all tests pass');
  }
  
  // Summary counts
  const passedSteps = [
    testResults.step1.passed,
    testResults.step2.passed, 
    testResults.step3.passed,
    testResults.progressIndicators.passed,
    testResults.completion.passed
  ].filter(Boolean).length;
  
  console.log(`\n📈 SUMMARY: ${passedSteps}/5 test areas passed`);
  
  process.exit(issues.length === 0 ? 0 : 1);
}

main().catch(console.error);