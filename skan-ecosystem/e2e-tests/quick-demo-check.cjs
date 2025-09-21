// Quick Demo Page Check
const puppeteer = require('puppeteer');

console.log('⚡ QUICK DEMO PAGE CHECK');
console.log('=======================');

async function quickCheck() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('🔍 Checking local demo page...');
    await page.goto('http://localhost:3005/demo-request', { waitUntil: 'networkidle0' });
    
    const content = await page.content();
    
    console.log('\n📋 Credential Check:');
    console.log('====================');
    
    if (content.includes('demo.beachbar@skan.al')) {
      console.log('✅ NEW EMAIL: demo.beachbar@skan.al');
    } else {
      console.log('❌ NEW EMAIL: NOT FOUND');
    }
    
    if (content.includes('BeachBarDemo2024!')) {
      console.log('✅ NEW PASSWORD: BeachBarDemo2024!');
    } else {
      console.log('❌ NEW PASSWORD: NOT FOUND');
    }
    
    if (content.includes('manager_email1@gmail.com')) {
      console.log('❌ OLD EMAIL: STILL PRESENT');
    } else {
      console.log('✅ OLD EMAIL: REMOVED');
    }
    
    if (content.includes('admin123')) {
      console.log('❌ OLD PASSWORD: STILL PRESENT');
    } else {
      console.log('✅ OLD PASSWORD: REMOVED');
    }
    
    // Check URL
    console.log(`\n📍 Page URL: ${page.url()}`);
    console.log(`📄 Page Title: ${await page.title()}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

quickCheck();