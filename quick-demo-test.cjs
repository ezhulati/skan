const puppeteer = require('puppeteer');

async function testDemoFlow() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Marketing site demo page
    console.log('🧪 Testing Marketing Site Demo Page...');
    await page.goto('https://skan.al/demo', { waitUntil: 'networkidle2' });
    
    const demoButtons = await page.$$eval('a', links => 
      links.filter(link => 
        link.textContent.includes('Demo') || 
        link.href.includes('demo') ||
        link.href.includes('customer-demo-request')
      ).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    );
    
    console.log('✅ Demo buttons found:', demoButtons);
    
    // Test 2: Customer demo request page
    console.log('\n🧪 Testing Customer Demo Request Page...');
    await page.goto('https://skan.al/customer-demo-request', { waitUntil: 'networkidle2' });
    
    const customerDemoExists = await page.evaluate(() => {
      return {
        hasForm: document.querySelector('form') !== null,
        hasDemoUrl: document.body.textContent.includes('order.skan.al/beach-bar-durres/a1'),
        title: document.title,
        url: window.location.href
      };
    });
    
    console.log('✅ Customer demo page:', customerDemoExists);
    
    // Test 3: Admin portal demo request
    console.log('\n🧪 Testing Admin Portal Demo Request...');
    await page.goto('https://admin.skan.al/demo-request', { waitUntil: 'networkidle2' });
    
    const adminDemoExists = await page.evaluate(() => {
      return {
        hasJavaScript: document.body.textContent.includes('You need to enable JavaScript'),
        title: document.title,
        url: window.location.href,
        hasCredentials: document.body.textContent.includes('demo.beachbar@skan.al')
      };
    });
    
    console.log('✅ Admin demo page:', adminDemoExists);
    
    // Test 4: Customer ordering experience
    console.log('\n🧪 Testing Customer Ordering Experience...');
    await page.goto('https://order.skan.al/beach-bar-durres/a1', { waitUntil: 'networkidle2' });
    
    const customerOrderingStatus = await page.evaluate(() => {
      return {
        hasJavaScript: document.body.textContent.includes('You need to enable JavaScript'),
        hasContent: document.body.innerHTML.length > 1000,
        title: document.title,
        url: window.location.href,
        bodyText: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('✅ Customer ordering page:', customerOrderingStatus);
    
    // Test 5: API Check
    console.log('\n🧪 Testing API...');
    const apiResponse = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/menu');
    const apiStatus = {
      status: apiResponse.status,
      ok: apiResponse.ok,
      hasVenue: false,
      hasMenu: false
    };
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      apiStatus.hasVenue = !!apiData.venue;
      apiStatus.hasMenu = !!(apiData.categories && apiData.categories.length > 0);
    }
    
    console.log('✅ API status:', apiStatus);
    
    console.log('\n📊 SUMMARY REPORT:');
    console.log('==================');
    console.log('✅ Marketing site demo page:', demoButtons.length > 0 ? 'WORKING' : 'ISSUES');
    console.log('✅ Customer demo request:', customerDemoExists.hasForm ? 'WORKING' : 'ISSUES');
    console.log('✅ Admin demo request:', adminDemoExists.hasJavaScript ? 'React App' : 'ISSUES');
    console.log('✅ Customer ordering:', customerOrderingStatus.hasJavaScript ? 'React App' : 'ISSUES');
    console.log('✅ API backend:', apiStatus.ok ? 'WORKING' : 'DOWN');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testDemoFlow();