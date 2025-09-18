const { chromium } = require('playwright');

async function debugProduction() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track network requests
  page.on('request', request => {
    if (request.url().includes('auth/login')) {
      console.log(`🌐 LOGIN REQUEST: ${request.method()} ${request.url()}`);
      console.log(`📦 Request body:`, request.postData());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('auth/login')) {
      console.log(`📥 LOGIN RESPONSE: ${response.status()}`);
      try {
        const responseBody = await response.text();
        console.log(`📋 Response body:`, responseBody);
      } catch (e) {
        console.log(`📋 Could not read response body`);
      }
    }
  });

  try {
    console.log('🚀 Going to production demo page...');
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForTimeout(3000);
    
    console.log('📝 Filling form...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Debug Test');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'User');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'debug@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Debug Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(4000);
    
    // Check password in the page source
    const pageContent = await page.content();
    console.log('🔍 Checking page source for passwords...');
    
    const demo123Count = (pageContent.match(/demo123/g) || []).length;
    const demo1234Count = (pageContent.match(/demo1234/g) || []).length;
    
    console.log(`🔑 "demo123" appears ${demo123Count} times in page`);
    console.log(`🔑 "demo1234" appears ${demo1234Count} times in page`);
    
    // Look for the actual password being displayed in credentials
    const credentialsElement = await page.locator('div:has-text("Password:")').textContent().catch(() => '');
    console.log('🔐 Credentials element text:', credentialsElement);
    
    console.log('🖱️ Clicking login button...');
    await page.click('button:has-text("Hyr në Demo")');
    await page.waitForTimeout(8000);
    
    const finalUrl = page.url();
    console.log('🌐 Final URL:', finalUrl);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugProduction().catch(console.error);