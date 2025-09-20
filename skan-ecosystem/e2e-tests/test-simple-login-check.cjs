const { chromium } = require('playwright');

async function testSimpleLogin() {
  console.log('🔍 SIMPLE LOGIN PAGE CHECK');
  console.log('==========================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(3000);

    console.log('2. Taking screenshot...');
    await page.screenshot({ path: 'login-page-debug.png' });

    console.log('3. Getting page title...');
    const title = await page.title();
    console.log(`   Page title: "${title}"`);

    console.log('4. Getting page content preview...');
    const bodyText = await page.textContent('body').catch(() => 'Could not get body text');
    console.log(`   Body preview: "${bodyText.substring(0, 200)}..."`);

    console.log('5. Looking for login form elements...');
    const emailInputs = await page.locator('input[type="email"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    const submitButtons = await page.locator('button[type="submit"]').count();
    
    console.log(`   Email inputs found: ${emailInputs}`);
    console.log(`   Password inputs found: ${passwordInputs}`);
    console.log(`   Submit buttons found: ${submitButtons}`);

    console.log('6. Looking for any input fields...');
    const allInputs = await page.locator('input').count();
    const allButtons = await page.locator('button').count();
    console.log(`   Total inputs: ${allInputs}`);
    console.log(`   Total buttons: ${allButtons}`);

    if (allInputs > 0) {
      console.log('7. Getting input details...');
      const inputs = await page.locator('input').all();
      for (let i = 0; i < Math.min(inputs.length, 3); i++) {
        const type = await inputs[i].getAttribute('type');
        const placeholder = await inputs[i].getAttribute('placeholder');
        console.log(`   Input ${i + 1}: type="${type}", placeholder="${placeholder}"`);
      }
    }

    console.log('\n✅ Page check complete - see login-page-debug.png for screenshot');

  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
  }

  await browser.close();
}

testSimpleLogin().catch(console.error);