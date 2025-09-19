const { chromium } = require('playwright');

async function testAuthenticatedOnboarding() {
  console.log('🔍 TESTING ONBOARDING WITH AUTHENTICATION');
  console.log('=========================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = [];

  try {
    // Step 1: Login first
    console.log('🔐 Step 1: Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);

    // Fill login form
    await page.fill('input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[type="password"]', 'demo123');
    
    console.log('   Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Check if login was successful
    const currentUrl = page.url();
    console.log(`   Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      issues.push('❌ CRITICAL: Login failed - still on login page');
      return issues;
    }

    console.log('✅ Login successful!');

    // Step 2: Navigate to onboarding
    console.log('\n📍 Step 2: Navigating to onboarding...');
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForTimeout(2000);

    // Check what loads now
    const title = await page.textContent('h2').catch(() => null);
    console.log(`🏷️  Page title: "${title}"`);

    const finalUrl = page.url();
    console.log(`🌐 Final URL: ${finalUrl}`);

    // Check for onboarding elements
    const onboardingWizard = await page.locator('.onboarding-wizard').count();
    const progressBar = await page.locator('.progress-bar').count();
    const loadingSpinner = await page.locator('div[style*="animation: spin"]').count();

    console.log(`\n🎯 ONBOARDING ELEMENTS:`);
    console.log(`   .onboarding-wizard: ${onboardingWizard > 0 ? '✅' : '❌'}`);
    console.log(`   .progress-bar: ${progressBar > 0 ? '✅' : '❌'}`);
    console.log(`   Loading spinner: ${loadingSpinner > 0 ? '⏳ YES' : '✅ NO'}`);

    if (onboardingWizard === 0) {
      issues.push('❌ CRITICAL: Onboarding wizard component not found');
    }

    // Wait for loading to complete if spinner is present
    if (loadingSpinner > 0) {
      console.log('\n⏰ Waiting for loading to complete...');
      await page.waitForTimeout(5000);
      
      const finalSpinner = await page.locator('div[style*="animation: spin"]').count();
      const finalTitle = await page.textContent('h2').catch(() => null);
      
      console.log(`🔄 After waiting - Title: "${finalTitle}"`);
      console.log(`🔄 After waiting - Spinner: ${finalSpinner > 0 ? '⏳ STILL LOADING' : '✅ LOADED'}`);
      
      if (finalSpinner > 0) {
        issues.push('❌ CRITICAL: Onboarding stuck in loading state');
      }
    }

    // Test onboarding functionality if it loaded
    if (onboardingWizard > 0 && loadingSpinner === 0) {
      console.log('\n🧪 Step 3: Testing onboarding functionality...');
      await testOnboardingSteps(page, issues);
    }

  } catch (error) {
    issues.push(`❌ CRITICAL ERROR: ${error.message}`);
  }

  await browser.close();
  return issues;
}

async function testOnboardingSteps(page, issues) {
  // Test Step 1 - Restaurant Info
  console.log('   Testing Step 1: Restaurant Info');
  
  const nameInput = await page.locator('input[value=""]').first().count();
  const continueButton = await page.locator('button:has-text("Vazhdo")').count();
  
  console.log(`     Name input: ${nameInput > 0 ? '✅' : '❌'}`);
  console.log(`     Continue button: ${continueButton > 0 ? '✅' : '❌'}`);
  
  if (nameInput === 0) issues.push('❌ Step 1: Restaurant name input missing');
  if (continueButton === 0) issues.push('❌ Step 1: Continue button missing');

  // Try filling and proceeding
  if (nameInput > 0) {
    const inputs = await page.locator('.field-input').all();
    if (inputs.length >= 3) {
      await inputs[0].fill('Test Restaurant');
      await inputs[1].fill('Test Address 123');
      await inputs[2].fill('+355691234567');
      console.log('     ✅ Filled restaurant info form');
    }
  }

  if (continueButton > 0) {
    await page.click('button:has-text("Vazhdo")');
    await page.waitForTimeout(1000);
    
    const newTitle = await page.textContent('h2').catch(() => null);
    console.log(`     After continue - Title: "${newTitle}"`);
    
    if (newTitle && newTitle !== 'Informacioni i Restorantit') {
      console.log('     ✅ Successfully progressed to next step');
    } else {
      issues.push('❌ Step 1: Continue button doesn\'t work');
    }
  }
}

async function main() {
  const issues = await testAuthenticatedOnboarding();
  
  console.log('\n🚨 TEST COMPLETE');
  console.log('================\n');
  
  if (issues.length === 0) {
    console.log('✅ All tests passed - onboarding working correctly!');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  process.exit(issues.length === 0 ? 0 : 1);
}

main().catch(console.error);