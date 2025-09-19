const puppeteer = require('puppeteer');

// Debug test for the progress bar
async function debugProgressBar() {
  console.log('🔍 Debugging Progress Bar...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`PAGE LOG: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  try {
    // Login first
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'manager_email1@gmail.com');
    await page.type('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Navigate to onboarding
    await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Debug: Check what elements actually exist
    console.log('🔍 Checking for any onboarding elements...');
    
    const allClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const classes = new Set();
      elements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls.includes('progress') || cls.includes('step') || cls.includes('onboard')) {
              classes.add(cls);
            }
          });
        }
      });
      return Array.from(classes);
    });
    
    console.log('Found CSS classes related to progress/step/onboard:', allClasses);

    // Check if onboarding wizard exists at all
    const onboardingWizard = await page.$('.onboarding-wizard');
    console.log(`Onboarding wizard exists: ${onboardingWizard !== null}`);

    const onboardingContainer = await page.$('.onboarding-container');
    console.log(`Onboarding container exists: ${onboardingContainer !== null}`);

    const onboardingHeader = await page.$('.onboarding-header');
    console.log(`Onboarding header exists: ${onboardingHeader !== null}`);

    // Check page content
    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log('Page contains onboarding text:', pageContent.includes('onboard') || pageContent.includes('Mirë se vini'));

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check if we're in a loading state
    const loadingSpinner = await page.$('[style*="spin"]');
    console.log(`Loading spinner present: ${loadingSpinner !== null}`);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'onboarding-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as onboarding-debug.png');

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Browser left open for manual inspection...');
    // await browser.close();
  }
}

// Run the debug
debugProgressBar().catch(console.error);