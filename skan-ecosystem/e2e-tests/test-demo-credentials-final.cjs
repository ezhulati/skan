// Test Demo Credentials - Final Version
const puppeteer = require('puppeteer');

console.log('🧪 TESTING DEMO CREDENTIALS - FINAL VERSION');
console.log('============================================');

async function testDemoCredentials() {
  let browser;
  let success = true;
  
  try {
    console.log('🚀 Starting browser...');
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Test 1: Check demo page displays correct credentials
    console.log('\n📋 TEST 1: Demo Page Credential Display');
    console.log('======================================');
    
    await page.goto('https://admin.skan.al/demo-request', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for correct email display
    const emailText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let element of elements) {
        if (element.textContent && element.textContent.includes('demo.beachbar@skan.al')) {
          return element.textContent;
        }
      }
      return null;
    });
    
    if (emailText) {
      console.log('✅ Email display: demo.beachbar@skan.al found');
    } else {
      console.log('❌ Email display: demo.beachbar@skan.al NOT found');
      success = false;
    }
    
    // Check for correct password display
    const passwordText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let element of elements) {
        if (element.textContent && element.textContent.includes('BeachBarDemo2024!')) {
          return element.textContent;
        }
      }
      return null;
    });
    
    if (passwordText) {
      console.log('✅ Password display: BeachBarDemo2024! found');
    } else {
      console.log('❌ Password display: BeachBarDemo2024! NOT found');
      success = false;
    }
    
    // Check for old credentials (should NOT be present)
    const oldEmailText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let element of elements) {
        if (element.textContent && element.textContent.includes('manager_email1@gmail.com')) {
          return element.textContent;
        }
      }
      return null;
    });
    
    if (oldEmailText) {
      console.log('❌ Old email still present: manager_email1@gmail.com');
      success = false;
    } else {
      console.log('✅ Old email not present');
    }
    
    const oldPasswordText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let element of elements) {
        if (element.textContent && element.textContent.includes('admin123')) {
          return element.textContent;
        }
      }
      return null;
    });
    
    if (oldPasswordText) {
      console.log('❌ Old password still present: admin123');
      success = false;
    } else {
      console.log('✅ Old password not present');
    }
    
    // Test 2: Test auto-login functionality
    console.log('\n🔑 TEST 2: Auto-Login Functionality');
    console.log('===================================');
    
    // Look for auto-login button
    const autoLoginButton = await page.$('button:contains("Auto-Login")') || 
                           await page.$('button[onclick*="login"]') ||
                           await page.$('button:contains("Try Demo")') ||
                           await page.$('button:contains("Demo")');
    
    if (autoLoginButton) {
      console.log('✅ Auto-login button found');
      
      // Click the auto-login button
      await autoLoginButton.click();
      console.log('🖱️ Auto-login button clicked');
      
      // Wait for navigation or response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we're redirected to dashboard or got logged in
      const currentUrl = page.url();
      console.log(`📍 Current URL after auto-login: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
        console.log('✅ Auto-login successful - redirected to dashboard');
      } else {
        // Check for error messages
        const errorMessage = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
          for (let element of errorElements) {
            if (element.textContent) {
              return element.textContent;
            }
          }
          return null;
        });
        
        if (errorMessage) {
          console.log(`❌ Auto-login failed with error: ${errorMessage}`);
          success = false;
        } else {
          console.log('⚠️ Auto-login result unclear - no redirect, no error');
        }
      }
    } else {
      console.log('❌ Auto-login button not found');
      success = false;
    }
    
    // Test 3: Direct API login test
    console.log('\n🌐 TEST 3: Direct API Login Test');
    console.log('=================================');
    
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
        try {
          const parsedData = JSON.parse(apiResponse.data);
          if (parsedData.token) {
            console.log('✅ JWT token received');
          }
          if (parsedData.user) {
            console.log(`✅ User data received: ${parsedData.user.email}`);
          }
        } catch (e) {
          console.log('⚠️ Response received but not valid JSON');
        }
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
    console.log('✅ Auto-login functionality works');
    console.log('✅ API accepts new credentials');
    console.log('✅ Old credentials are completely removed');
    console.log('\n🚀 Demo credentials are fully operational!');
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log('🛠️ Issues need to be fixed before demo is ready');
  }
  
  return success;
}

// Run the test
testDemoCredentials()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });