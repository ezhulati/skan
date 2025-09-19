const { chromium } = require('playwright');

async function debugOnboarding() {
  console.log('🔍 DEBUGGING ONBOARDING LOADING ISSUE');
  console.log('=====================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs
  page.on('console', msg => {
    console.log(`🖥️  CONSOLE: ${msg.text()}`);
  });

  // Listen to errors
  page.on('pageerror', err => {
    console.log(`❌ ERROR: ${err.message}`);
  });

  try {
    console.log('📍 Navigating to onboarding...');
    await page.goto('http://localhost:3000/onboarding');
    
    console.log('\n⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Check what's actually rendered
    const title = await page.textContent('h2').catch(() => null);
    console.log(`🏷️  H2 Title: "${title}"`);

    const body = await page.textContent('body').catch(() => null);
    console.log(`📄 Body content preview: "${body?.substring(0, 200)}..."`);

    // Check for loading spinner
    const loadingSpinner = await page.locator('div[style*="animation: spin"]').count();
    console.log(`⏳ Loading spinner present: ${loadingSpinner > 0 ? 'YES' : 'NO'}`);

    // Check for onboarding-specific elements
    const onboardingWizard = await page.locator('.onboarding-wizard').count();
    const onboardingContainer = await page.locator('.onboarding-container').count();
    const progressBar = await page.locator('.progress-bar').count();
    
    console.log(`\n🎯 ONBOARDING ELEMENTS:`);
    console.log(`   .onboarding-wizard: ${onboardingWizard}`);
    console.log(`   .onboarding-container: ${onboardingContainer}`);
    console.log(`   .progress-bar: ${progressBar}`);

    // Check authentication state
    const token = await page.evaluate(() => localStorage.getItem('skan_auth_token'));
    const user = await page.evaluate(() => localStorage.getItem('skan_user'));
    
    console.log(`\n🔐 AUTH STATE:`);
    console.log(`   Token present: ${token ? 'YES' : 'NO'}`);
    console.log(`   User data: ${user ? 'YES' : 'NO'}`);

    if (token) {
      console.log(`   Token preview: ${token.substring(0, 20)}...`);
    }

    // Check current URL
    const currentUrl = page.url();
    console.log(`\n🌐 Current URL: ${currentUrl}`);

    // Wait and check again
    console.log('\n⏰ Waiting 5 more seconds to see if loading completes...');
    await page.waitForTimeout(5000);

    const finalTitle = await page.textContent('h2').catch(() => null);
    const finalSpinner = await page.locator('div[style*="animation: spin"]').count();
    
    console.log(`🔄 Final H2 Title: "${finalTitle}"`);
    console.log(`🔄 Final loading spinner: ${finalSpinner > 0 ? 'STILL PRESENT' : 'GONE'}`);

    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/onboarding-debug.png' });
    console.log('📸 Screenshot saved to /tmp/onboarding-debug.png');

  } catch (error) {
    console.log(`💥 Error during debugging: ${error.message}`);
  }

  await browser.close();
}

debugOnboarding().catch(console.error);