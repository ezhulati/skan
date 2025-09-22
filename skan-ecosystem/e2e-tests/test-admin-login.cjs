const puppeteer = require('puppeteer');

async function testAdminLogin() {
  console.log('🧪 Testing Beach Bar Admin Portal Login with Puppeteer...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    });

    const page = await browser.newPage();
    
    console.log('📱 Navigating to admin portal login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Wait for login form to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    console.log('✅ Login form loaded successfully');
    
    // Fill in Beach Bar credentials
    console.log('🔑 Entering Beach Bar credentials...');
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    
    // Submit login form
    console.log('🚀 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for either successful login redirect or error message
    try {
      // Wait for dashboard or error - give it up to 10 seconds
      await Promise.race([
        page.waitForSelector('.dashboard', { timeout: 10000 }).then(() => 'dashboard'),
        page.waitForSelector('[data-testid="error"]', { timeout: 10000 }).then(() => 'error'),
        page.waitForNavigation({ timeout: 10000 }).then(() => 'navigation'),
        page.waitForSelector('h1', { timeout: 10000 }).then(() => 'content')
      ]);
      
      // Check current URL and page content
      const currentUrl = page.url();
      const pageTitle = await page.title();
      const bodyText = await page.evaluate(() => document.body.textContent);
      
      console.log('📍 Current URL:', currentUrl);
      console.log('📋 Page Title:', pageTitle);
      
      // Check for success indicators
      if (currentUrl.includes('/dashboard') || bodyText.includes('Beach Bar')) {
        console.log('✅ LOGIN SUCCESSFUL! Beach Bar dashboard loaded');
        
        // Check for Beach Bar specific content
        const venueContent = await page.evaluate(() => {
          return document.body.textContent.toLowerCase();
        });
        
        if (venueContent.includes('beach bar') || venueContent.includes('durrës')) {
          console.log('🏖️  Beach Bar venue detected in dashboard!');
        }
        
        return { success: true, url: currentUrl, title: pageTitle };
        
      } else if (bodyText.includes('Login failed') || bodyText.includes('error')) {
        console.log('❌ LOGIN FAILED - Error message detected');
        return { success: false, error: 'Login failed error detected' };
        
      } else {
        console.log('⚠️  Unclear login result - checking page content...');
        console.log('Page content:', bodyText.substring(0, 200));
        return { success: false, error: 'Unclear login result' };
      }
      
    } catch (error) {
      console.log('⏰ Timeout waiting for login result');
      const currentUrl = page.url();
      const bodyText = await page.evaluate(() => document.body.textContent);
      
      console.log('📍 Final URL:', currentUrl);
      console.log('📄 Page content:', bodyText.substring(0, 200));
      
      return { success: false, error: 'Login timeout', url: currentUrl };
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
    return { success: false, error: error.message };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testAdminLogin()
  .then(result => {
    console.log('\n🏁 TEST RESULT:');
    if (result.success) {
      console.log('✅ Beach Bar admin login is WORKING!');
    } else {
      console.log('❌ Beach Bar admin login FAILED:', result.error);
    }
  })
  .catch(console.error);