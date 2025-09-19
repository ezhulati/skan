const puppeteer = require('puppeteer');

async function debugAdminLogin() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000
  });
  
  try {
    const page = await browser.newPage();
    
    // Monitor network requests to see what's actually sent
    page.on('request', request => {
      if (request.url().includes('/auth/login')) {
        console.log('🔍 Login request intercepted:');
        console.log('URL:', request.url());
        console.log('Method:', request.method());
        console.log('Headers:', request.headers());
        console.log('Payload:', request.postData());
      }
    });
    
    console.log('🚀 Opening admin portal...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    console.log('📝 Filling login form...');
    
    // Clear and type email
    await page.click('#email');
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.type('#email', 'manager_email1@gmail.com');
    
    // Clear and type password  
    await page.click('#password');
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.type('#password', 'demo123');
    
    // Check form values before submission
    const emailValue = await page.$eval('#email', el => el.value);
    const passwordValue = await page.$eval('#password', el => el.value);
    
    console.log('📋 Form values before submission:');
    console.log('Email:', emailValue);
    console.log('Password:', passwordValue);
    
    // Add a delay to see the form
    await page.waitForTimeout(3000);
    
    console.log('✉️ Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    console.log('✅ Form submission complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Keep browser open for inspection
    console.log('🔍 Keeping browser open for inspection...');
    // await browser.close();
  }
}

debugAdminLogin();