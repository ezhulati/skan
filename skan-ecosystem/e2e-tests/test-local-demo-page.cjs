// Test Local Demo Page
const puppeteer = require('puppeteer');

console.log('🧪 TESTING LOCAL DEMO PAGE');
console.log('===========================');

async function testLocalDemoPage() {
  let browser;
  let success = true;
  
  try {
    console.log('🚀 Starting browser...');
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Test local admin portal
    console.log('\n📋 Testing Local Demo Page: http://localhost:3005/demo-request');
    console.log('============================================================');
    
    await page.goto('http://localhost:3005/demo-request', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get page content
    const pageContent = await page.content();
    console.log('\n📄 Page loaded successfully');
    
    // Check for new credentials
    if (pageContent.includes('demo.beachbar@skan.al')) {
      console.log('✅ Email: demo.beachbar@skan.al found');
    } else {
      console.log('❌ Email: demo.beachbar@skan.al NOT found');
      success = false;
    }
    
    if (pageContent.includes('BeachBarDemo2024!')) {
      console.log('✅ Password: BeachBarDemo2024! found');
    } else {
      console.log('❌ Password: BeachBarDemo2024! NOT found');
      success = false;
    }
    
    // Check for old credentials (should NOT be present)
    if (pageContent.includes('manager_email1@gmail.com')) {
      console.log('❌ Old email still present: manager_email1@gmail.com');
      success = false;
    } else {
      console.log('✅ Old email not present');
    }
    
    if (pageContent.includes('admin123')) {
      console.log('❌ Old password still present: admin123');
      success = false;
    } else {
      console.log('✅ Old password not present');
    }
    
    // Look for auto-login button
    const buttons = await page.$$eval('button', buttons => {
      return buttons.map(button => ({
        text: button.textContent.trim(),
        onclick: button.getAttribute('onclick') || '',
        className: button.className
      }));
    });
    
    console.log('\n🔘 Buttons found on page:');
    buttons.forEach((button, index) => {
      console.log(`  ${index + 1}. "${button.text}" (class: ${button.className})`);
    });
    
    // Test auto-login button functionality
    const autoLoginButton = buttons.find(button => 
      button.text.toLowerCase().includes('demo') || 
      button.text.toLowerCase().includes('login') ||
      button.onclick.includes('login')
    );
    
    if (autoLoginButton) {
      console.log(`✅ Auto-login button found: "${autoLoginButton.text}"`);
      
      // Try to click it
      try {
        await page.click(`button:contains("${autoLoginButton.text}")`);
        console.log('🖱️ Auto-login button clicked');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const currentUrl = page.url();
        console.log(`📍 URL after click: ${currentUrl}`);
        
      } catch (e) {
        console.log('⚠️ Could not click auto-login button');
      }
    } else {
      console.log('❌ No auto-login button found');
      success = false;
    }
    
    // Test direct API call with new credentials
    console.log('\n🌐 Testing API with new credentials...');
    try {
      const apiResponse = await page.evaluate(async () => {
        const response = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'demo.beachbar@skan.al',
            password: 'BeachBarDemo2024!'
          }),
        });
        
        const data = await response.text();
        return {
          status: response.status,
          data: data
        };
      });
      
      console.log(`📡 API Response Status: ${apiResponse.status}`);
      
      if (apiResponse.status === 200) {
        console.log('✅ API login successful with new credentials');
      } else {
        console.log(`❌ API login failed: ${apiResponse.status}`);
        console.log(`Response: ${apiResponse.data}`);
        success = false;
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
      success = false;
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    success = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Final Results
  console.log('\n🎯 FINAL RESULTS');
  console.log('================');
  
  if (success) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Demo page displays correct credentials');
    console.log('✅ Old credentials are removed');
    console.log('✅ Auto-login functionality present');
    console.log('✅ API accepts new credentials');
    console.log('\n🚀 Demo credentials are fully operational!');
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log('🛠️ Issues need to be fixed before demo is ready');
  }
  
  return success;
}

// Run the test
testLocalDemoPage()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });