const { chromium } = require('playwright');

async function diagnoseOnboardingFlow() {
  console.log('🔍 ONBOARDING FLOW DIAGNOSIS');
  console.log('===========================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = [];
  let currentStep = 1;

  try {
    // Navigate to onboarding
    console.log('📍 Navigating to onboarding page...');
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForTimeout(2000);

    // Check if onboarding page loads
    const pageTitle = await page.textContent('h2').catch(() => null);
    console.log(`🏷️  Page title: ${pageTitle || 'NOT FOUND'}`);
    
    if (!pageTitle) {
      issues.push('❌ CRITICAL: Onboarding page does not load properly');
      return issues;
    }

    // Test each step systematically
    for (let step = 1; step <= 5; step++) {
      console.log(`\n📋 TESTING STEP ${step}`);
      console.log('─'.repeat(20));

      // Check step visibility
      const stepTitle = await page.textContent('h2').catch(() => null);
      console.log(`   Title: ${stepTitle || 'MISSING'}`);

      // Check progress bar
      const progressBar = await page.locator('.progress-bar').count();
      console.log(`   Progress bar: ${progressBar > 0 ? '✅' : '❌'}`);
      
      if (progressBar === 0) {
        issues.push(`❌ Step ${step}: Progress bar missing`);
      }

      // Check current step indicator
      const activeStep = await page.locator('.progress-step.active').count();
      console.log(`   Active step indicator: ${activeStep > 0 ? '✅' : '❌'}`);

      // Step-specific checks
      switch (step) {
        case 1:
          await testStep1(page, issues);
          break;
        case 2:
          await testStep2(page, issues);
          break;
        case 3:
          await testStep3(page, issues);
          break;
        case 4:
          await testStep4(page, issues);
          break;
        case 5:
          await testStep5(page, issues);
          break;
      }

      // Try to navigate to next step
      const nextButton = await page.locator('button:has-text("Vazhdo")').count();
      const continueButton = await page.locator('button:has-text("Përfundo")').count();
      const dashboardButton = await page.locator('button:has-text("Shko te Dashboard")').count();
      
      console.log(`   Next button: ${nextButton > 0 ? '✅' : '❌'}`);
      console.log(`   Continue button: ${continueButton > 0 ? '✅' : '❌'}`);
      console.log(`   Dashboard button: ${dashboardButton > 0 ? '✅' : '❌'}`);

      if (step < 5) {
        if (nextButton === 0) {
          issues.push(`❌ Step ${step}: No "Vazhdo" button found`);
          break;
        }

        // Try clicking next
        try {
          await page.click('button:has-text("Vazhdo")');
          await page.waitForTimeout(1000);
          
          // Check if step actually changed
          const newStepTitle = await page.textContent('h2').catch(() => null);
          if (newStepTitle === stepTitle) {
            issues.push(`❌ Step ${step}: Navigation button doesn't work`);
            break;
          }
        } catch (error) {
          issues.push(`❌ Step ${step}: Button click failed - ${error.message}`);
          break;
        }
      } else {
        // Final step - test dashboard navigation
        if (dashboardButton === 0) {
          issues.push(`❌ Step 5: No "Shko te Dashboard" button found`);
        }
      }
    }

  } catch (error) {
    issues.push(`❌ CRITICAL ERROR: ${error.message}`);
  }

  await browser.close();
  return issues;
}

async function testStep1(page, issues) {
  // Test restaurant info form
  const nameInput = await page.locator('input[placeholder*="emri"]').count();
  const addressInput = await page.locator('input[placeholder*="adres"]').count();
  const phoneInput = await page.locator('input[placeholder*="telefon"]').count();
  
  console.log(`   Name input: ${nameInput > 0 ? '✅' : '❌'}`);
  console.log(`   Address input: ${addressInput > 0 ? '✅' : '❌'}`);
  console.log(`   Phone input: ${phoneInput > 0 ? '✅' : '❌'}`);
  
  if (nameInput === 0) issues.push('❌ Step 1: Name input missing');
  if (addressInput === 0) issues.push('❌ Step 1: Address input missing');
  if (phoneInput === 0) issues.push('❌ Step 1: Phone input missing');

  // Try filling form
  if (nameInput > 0) {
    await page.fill('input[placeholder*="emri"]', 'Test Restaurant');
  }
  if (addressInput > 0) {
    await page.fill('input[placeholder*="adres"]', 'Test Address 123');
  }
  if (phoneInput > 0) {
    await page.fill('input[placeholder*="telefon"]', '+355691234567');
  }
}

async function testStep2(page, issues) {
  // Test menu categories display
  const categories = await page.locator('.category-item, .menu-category').count();
  console.log(`   Menu categories: ${categories}`);
  
  if (categories === 0) {
    issues.push('❌ Step 2: No menu categories displayed');
  }

  // Check if categories are clickable/interactive
  const categoryButtons = await page.locator('button, .clickable').count();
  console.log(`   Interactive elements: ${categoryButtons}`);
}

async function testStep3(page, issues) {
  // Test menu items step - should be simplified
  const description = await page.textContent('.step-description').catch(() => null);
  console.log(`   Description: ${description ? '✅' : '❌'}`);
  
  if (!description) {
    issues.push('❌ Step 3: Step description missing');
  }
}

async function testStep4(page, issues) {
  // Test table configuration
  const tableInput = await page.locator('input[type="number"], input[placeholder*="tavolina"]').count();
  console.log(`   Table count input: ${tableInput > 0 ? '✅' : '❌'}`);
  
  if (tableInput === 0) {
    issues.push('❌ Step 4: Table count input missing');
  } else {
    await page.fill('input[type="number"], input[placeholder*="tavolina"]', '12');
  }
}

async function testStep5(page, issues) {
  // Test final step
  const summary = await page.locator('.summary, .completion').count();
  console.log(`   Summary section: ${summary > 0 ? '✅' : '❌'}`);
  
  if (summary === 0) {
    issues.push('❌ Step 5: Summary section missing');
  }
}

async function main() {
  const issues = await diagnoseOnboardingFlow();
  
  console.log('\n🚨 DIAGNOSIS COMPLETE');
  console.log('====================\n');
  
  if (issues.length === 0) {
    console.log('✅ No issues found - onboarding flow working correctly!');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('─'.repeat(30));
    console.log('1. Check component state management');
    console.log('2. Verify button event handlers');
    console.log('3. Ensure form inputs are properly rendered');
    console.log('4. Test step progression logic');
    console.log('5. Validate CSS classes and styling');
  }
  
  process.exit(issues.length === 0 ? 0 : 1);
}

main().catch(console.error);