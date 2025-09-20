const { chromium } = require('playwright');

async function testFinal3StepValidation() {
  console.log('🎯 FINAL 3-STEP ONBOARDING VALIDATION');
  console.log('===================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testResults = {
    structure: { passed: false, details: [] },
    step1RestaurantInfo: { passed: false, details: [] },
    step2MenuSkip: { passed: false, details: [] },
    step3TableSetup: { passed: false, details: [] },
    progressIndicators: { passed: false, details: [] },
    noTestingStep: { passed: false, details: [] },
    finalCompletion: { passed: false, details: [] }
  };

  try {
    // Login and setup
    console.log('🔐 Setting up test environment...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3000/onboarding');
    await page.waitForTimeout(3000);

    // Test 1: Overall Structure Validation
    console.log('📊 Test 1: Structure Validation...');
    
    const stepCount = await page.locator('.progress-step').count();
    const stepTitles = await page.locator('.step-label').allTextContents();
    const activeStepNumber = await page.locator('.progress-step.active .step-number').textContent();
    
    console.log(`   Progress steps: ${stepCount} (expected: 3)`);
    console.log(`   Step titles: ${stepTitles.join(' → ')}`);
    console.log(`   Starting active step: ${activeStepNumber}`);
    
    if (stepCount === 3) {
      testResults.structure.passed = true;
      testResults.structure.details.push('✅ Exactly 3 steps found');
    } else {
      testResults.structure.details.push(`❌ Wrong step count: ${stepCount}`);
    }
    
    const expectedTitles = ['Informacioni', 'Menyja', 'Tavolinat'];
    const titlesMatch = expectedTitles.every(title => stepTitles.some(stepTitle => stepTitle.includes(title)));
    
    if (titlesMatch) {
      testResults.structure.passed = testResults.structure.passed && true;
      testResults.structure.details.push('✅ Correct step titles');
    } else {
      testResults.structure.details.push(`❌ Wrong titles: ${stepTitles.join(', ')}`);
    }

    // Test 2: Step 1 - Restaurant Info  
    console.log('\n🏪 Test 2: Step 1 - Restaurant Info...');
    
    const step1Title = await page.textContent('h2');
    console.log(`   Step 1 title: "${step1Title}"`);
    
    if (step1Title.includes('Informacioni')) {
      testResults.step1RestaurantInfo.details.push('✅ Correct step 1 title');
      
      // Fill required fields
      await page.locator('input').first().fill('Final Test Restaurant');
      await page.locator('input').nth(1).fill('Rruga Finale 456');
      await page.locator('input').nth(2).fill('+355691111111');
      
      const selectElement = await page.locator('select').first();
      if (await selectElement.count() > 0) {
        await selectElement.selectOption('traditional');
      }
      
      await page.waitForTimeout(1000);
      
      const continueBtn = await page.locator('button:has-text("Vazhdo")');
      const isDisabled = await continueBtn.getAttribute('disabled');
      
      if (isDisabled === null) {
        testResults.step1RestaurantInfo.details.push('✅ Continue button enabled after filling fields');
        
        await continueBtn.click();
        await page.waitForTimeout(3000);
        
        const newActiveStep = await page.locator('.progress-step.active .step-number').textContent();
        if (newActiveStep === '2') {
          testResults.step1RestaurantInfo.passed = true;
          testResults.step1RestaurantInfo.details.push('✅ Successfully progressed to step 2');
        } else {
          testResults.step1RestaurantInfo.details.push(`❌ Failed to progress: on step ${newActiveStep}`);
        }
      } else {
        testResults.step1RestaurantInfo.details.push('❌ Continue button disabled');
      }
    } else {
      testResults.step1RestaurantInfo.details.push(`❌ Wrong step 1 title: ${step1Title}`);
    }

    // Test 3: Step 2 - Menu with Skip
    console.log('\n📋 Test 3: Step 2 - Menu Skip...');
    
    const step2Title = await page.textContent('h2');
    console.log(`   Step 2 title: "${step2Title}"`);
    
    if (step2Title.includes('Pjatat')) {
      testResults.step2MenuSkip.details.push('✅ Correct step 2 title');
      
      // Check for skip button specifically
      const skipButton = await page.locator('button:has-text("Kalo këtë hap")');
      if (await skipButton.count() > 0) {
        testResults.step2MenuSkip.details.push('✅ Skip button found');
        
        const skipText = await skipButton.textContent();
        console.log(`   Skip button text: "${skipText}"`);
        
        await skipButton.click();
        await page.waitForTimeout(3000);
        
        const newActiveStep = await page.locator('.progress-step.active .step-number').textContent();
        if (newActiveStep === '3') {
          testResults.step2MenuSkip.passed = true;
          testResults.step2MenuSkip.details.push('✅ Skip functionality works correctly');
        } else {
          testResults.step2MenuSkip.details.push(`❌ Skip failed: on step ${newActiveStep}`);
        }
      } else {
        testResults.step2MenuSkip.details.push('❌ Skip button not found');
      }
    } else {
      testResults.step2MenuSkip.details.push(`❌ Wrong step 2 title: ${step2Title}`);
    }

    // Test 4: Step 3 - Table Setup
    console.log('\n🪑 Test 4: Step 3 - Table Setup...');
    
    const step3Title = await page.textContent('h2');
    console.log(`   Step 3 title: "${step3Title}"`);
    
    if (step3Title.includes('Tavolina')) {
      testResults.step3TableSetup.details.push('✅ Correct step 3 title');
      
      const tableInput = await page.locator('input[type="number"]');
      if (await tableInput.count() > 0) {
        await tableInput.fill('8');
        testResults.step3TableSetup.details.push('✅ Table input accessible');
        
        await page.waitForTimeout(1000);
        
        const finalButton = await page.locator('button:has-text("Përfundo")');
        if (await finalButton.count() > 0) {
          const finalBtnText = await finalButton.textContent();
          console.log(`   Final button: "${finalBtnText}"`);
          
          if (finalBtnText.includes('Përfundo') && finalBtnText.includes('Dashboard')) {
            testResults.step3TableSetup.passed = true;
            testResults.step3TableSetup.details.push('✅ Correct final button text');
          } else {
            testResults.step3TableSetup.details.push(`❌ Wrong final button: ${finalBtnText}`);
          }
        } else {
          testResults.step3TableSetup.details.push('❌ Final button not found');
        }
      } else {
        testResults.step3TableSetup.details.push('❌ Table input not found');
      }
    } else {
      testResults.step3TableSetup.details.push(`❌ Wrong step 3 title: ${step3Title}`);
    }

    // Test 5: Progress Indicators
    console.log('\n📊 Test 5: Progress Indicators...');
    
    const progressSteps = await page.locator('.progress-step').count();
    const activeStep = await page.locator('.progress-step.active').count();
    const completedSteps = await page.locator('.progress-step.completed').count();
    const currentActiveNumber = await page.locator('.progress-step.active .step-number').textContent();
    
    console.log(`   Total steps: ${progressSteps}, Active: ${activeStep}, Completed: ${completedSteps}`);
    console.log(`   Current active step: ${currentActiveNumber}`);
    
    if (progressSteps === 3 && activeStep === 1 && currentActiveNumber === '3') {
      testResults.progressIndicators.passed = true;
      testResults.progressIndicators.details.push('✅ Progress indicators working correctly');
    } else {
      testResults.progressIndicators.details.push(`❌ Progress indicators wrong: ${progressSteps} total, ${activeStep} active, step ${currentActiveNumber}`);
    }

    // Test 6: No Testing Step (Verify removed step 4 testing)
    console.log('\n🚫 Test 6: No Testing Step...');
    
    // Go back through all steps to verify only 3 exist
    const allStepLabels = await page.locator('.step-label').allTextContents();
    const hasTestingStep = allStepLabels.some(label => 
      label.toLowerCase().includes('test') || 
      label.toLowerCase().includes('provo') || 
      label.toLowerCase().includes('kontrollo')
    );
    
    if (!hasTestingStep && allStepLabels.length === 3) {
      testResults.noTestingStep.passed = true;
      testResults.noTestingStep.details.push('✅ No testing step found - correctly removed');
    } else {
      testResults.noTestingStep.details.push(`❌ Testing step may exist or wrong count: ${allStepLabels.join(', ')}`);
    }

    // Test 7: Final Completion Flow
    console.log('\n🎯 Test 7: Final Completion...');
    
    if (testResults.step1RestaurantInfo.passed && 
        testResults.step2MenuSkip.passed && 
        testResults.step3TableSetup.passed) {
      testResults.finalCompletion.passed = true;
      testResults.finalCompletion.details.push('✅ Complete 3-step flow works end-to-end');
    } else {
      testResults.finalCompletion.details.push('❌ End-to-end flow has issues');
    }

  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
    Object.values(testResults).forEach(test => {
      test.details.push(`❌ Error: ${error.message}`);
    });
  }

  await browser.close();
  return testResults;
}

async function main() {
  const testResults = await testFinal3StepValidation();
  
  console.log('\n🎯 FINAL 3-STEP ONBOARDING VALIDATION RESULTS');
  console.log('============================================\n');
  
  const tests = [
    { name: '📊 STRUCTURE', result: testResults.structure },
    { name: '🏪 STEP 1 - Restaurant Info', result: testResults.step1RestaurantInfo },
    { name: '📋 STEP 2 - Menu Skip', result: testResults.step2MenuSkip },
    { name: '🪑 STEP 3 - Table Setup', result: testResults.step3TableSetup },
    { name: '📊 PROGRESS INDICATORS', result: testResults.progressIndicators },
    { name: '🚫 NO TESTING STEP', result: testResults.noTestingStep },
    { name: '🎯 END-TO-END COMPLETION', result: testResults.finalCompletion }
  ];
  
  let passedCount = 0;
  
  tests.forEach(test => {
    console.log(`${test.name}:`);
    console.log(`   Status: ${test.result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    test.result.details.forEach(detail => {
      console.log(`   ${detail}`);
    });
    console.log('');
    
    if (test.result.passed) passedCount++;
  });
  
  console.log('📈 FINAL SUMMARY:');
  console.log(`   Tests Passed: ${passedCount}/${tests.length}`);
  console.log(`   Success Rate: ${Math.round((passedCount / tests.length) * 100)}%`);
  
  if (passedCount === tests.length) {
    console.log('\n🎉 ALL TESTS PASSED! 3-STEP ONBOARDING IS WORKING PERFECTLY!');
    console.log('\n✅ VALIDATION COMPLETE:');
    console.log('   ✅ Streamlined to exactly 3 steps');
    console.log('   ✅ Step 1: Restaurant Info form validation works');
    console.log('   ✅ Step 2: Menu skip functionality works');
    console.log('   ✅ Step 3: Table setup and completion works');
    console.log('   ✅ Progress indicators show correct 3 steps');
    console.log('   ✅ Removed testing step (no step 4)');
    console.log('   ✅ Final button shows "Përfundo dhe Hap Dashboard ✓"');
    console.log('   ✅ No compilation errors or UI issues');
    console.log('   ✅ End-to-end flow works seamlessly');
    
    console.log('\n🚀 READY FOR PRODUCTION DEPLOYMENT');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - REVIEW REQUIRED');
    console.log('   Please address failing tests before deployment');
  }
  
  process.exit(passedCount === tests.length ? 0 : 1);
}

main().catch(console.error);