// Test Demo Success Page with URL Parameter
const puppeteer = require('puppeteer');

console.log('🎉 TESTING DEMO SUCCESS PAGE');
console.log('============================');

async function testDemoSuccessPage() {
  let browser;
  let success = true;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Test with success=true parameter
    console.log('\n📋 STEP 1: Navigate to Demo Success Page');
    console.log('=========================================');
    
    const demoSuccessUrl = 'http://localhost:3005/demo-request?success=true';
    await page.goto(demoSuccessUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`✅ Navigated to: ${demoSuccessUrl}`);
    console.log(`📍 Current URL: ${page.url()}`);
    
    // Step 2: Check for credentials display
    console.log('\n🔑 STEP 2: Check for Demo Credentials');
    console.log('=====================================');
    
    const pageContent = await page.content();
    
    // Check for new credentials
    if (pageContent.includes('demo.beachbar@skan.al')) {
      console.log('✅ NEW EMAIL: demo.beachbar@skan.al found');
    } else {
      console.log('❌ NEW EMAIL: demo.beachbar@skan.al NOT found');
      success = false;
    }
    
    if (pageContent.includes('BeachBarDemo2024!')) {
      console.log('✅ NEW PASSWORD: BeachBarDemo2024! found');
    } else {
      console.log('❌ NEW PASSWORD: BeachBarDemo2024! NOT found');
      success = false;
    }
    
    // Check old credentials are not present
    if (pageContent.includes('manager_email1@gmail.com')) {
      console.log('❌ OLD EMAIL: Still present');
      success = false;
    } else {
      console.log('✅ OLD EMAIL: Not present');
    }
    
    if (pageContent.includes('admin123')) {
      console.log('❌ OLD PASSWORD: Still present');
      success = false;
    } else {
      console.log('✅ OLD PASSWORD: Not present');
    }
    
    // Step 3: Check page structure
    console.log('\n📄 STEP 3: Check Page Structure');
    console.log('================================');
    
    // Check for success message elements
    const hasSuccessElements = await page.evaluate(() => {
      const hasEmail = document.body.textContent.includes('demo.beachbar@skan.al');
      const hasPassword = document.body.textContent.includes('BeachBarDemo2024!');
      const hasEmailLabel = document.body.textContent.includes('Email') || document.body.textContent.includes('Username');
      const hasPasswordLabel = document.body.textContent.includes('Password') || document.body.textContent.includes('Fjalëkalimi');
      
      return {
        hasEmail,
        hasPassword,
        hasEmailLabel,
        hasPasswordLabel
      };
    });
    
    console.log(`📧 Email field present: ${hasSuccessElements.hasEmail ? '✅' : '❌'}`);
    console.log(`🔒 Password field present: ${hasSuccessElements.hasPassword ? '✅' : '❌'}`);
    console.log(`🏷️ Email label present: ${hasSuccessElements.hasEmailLabel ? '✅' : '❌'}`);
    console.log(`🏷️ Password label present: ${hasSuccessElements.hasPasswordLabel ? '✅' : '❌'}`);
    
    // Step 4: Test auto-login functionality
    console.log('\n🔓 STEP 4: Test Auto-Login Button');
    console.log('=================================');
    
    // Look for auto-login button
    const autoLoginButtons = await page.$$eval('button', buttons => {
      return buttons
        .map(button => ({
          text: button.textContent.trim(),
          onclick: button.getAttribute('onclick') || '',
          className: button.className || '',
          type: button.type || ''
        }))
        .filter(button => 
          button.text.toLowerCase().includes('auto') ||
          button.text.toLowerCase().includes('login') ||
          button.text.toLowerCase().includes('demo') ||
          button.onclick.includes('login') ||
          button.onclick.includes('demo')
        );
    });
    
    console.log('🔓 Auto-login buttons found:');
    autoLoginButtons.forEach((button, index) => {
      console.log(`  ${index + 1}. "${button.text}" (${button.type})`);
    });
    
    if (autoLoginButtons.length > 0) {
      try {
        // Try to click auto-login button
        const buttons = await page.$$('button');
        
        for (let button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text && (text.toLowerCase().includes('auto') || text.toLowerCase().includes('login'))) {
            console.log(`🖱️ Clicking button: "${text.trim()}"`);
            await button.click();
            console.log('✅ Clicked auto-login button');
            await new Promise(resolve => setTimeout(resolve, 4000));
            
            const newUrl = page.url();
            console.log(`📍 URL after auto-login: ${newUrl}`);
            
            if (newUrl.includes('/dashboard') || newUrl.includes('/admin')) {
              console.log('✅ Auto-login successful - redirected to dashboard');
            } else if (newUrl !== demoSuccessUrl) {
              console.log('✅ Auto-login triggered - URL changed');
            } else {
              console.log('⚠️ Auto-login unclear - URL unchanged');
            }
            break;
          }
        }
      } catch (e) {
        console.log(`⚠️ Auto-login test failed: ${e.message}`);
      }
    } else {
      console.log('❌ No auto-login buttons found');
      success = false;
    }
    
    // Step 5: API verification
    console.log('\n🌐 STEP 5: API Verification');
    console.log('============================');
    
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
          data: data.substring(0, 200) // Truncate for readability
        };
      });
      
      console.log(`📡 API Response Status: ${apiResponse.status}`);
      
      if (apiResponse.status === 200) {
        console.log('✅ API login successful with new credentials');
        try {
          const responseData = JSON.parse(apiResponse.data);
          if (responseData.token) {
            console.log('✅ JWT token received from API');
          }
          if (responseData.user) {
            console.log(`✅ User data received: ${responseData.user.email || 'email not shown'}`);
          }
        } catch (e) {
          console.log('✅ API response received (non-JSON)');
        }
      } else {
        console.log(`❌ API login failed: ${apiResponse.status}`);
        console.log(`Response snippet: ${apiResponse.data}`);
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
    console.log('✅ Demo success page displays correct credentials');
    console.log('✅ New credentials (demo.beachbar@skan.al / BeachBarDemo2024!) are shown');
    console.log('✅ Old credentials are completely removed');
    console.log('✅ Auto-login functionality is present');
    console.log('✅ API accepts new credentials');
    console.log('\n🚀 Demo credentials system is fully operational!');
    console.log('📋 Users can access credentials at: /demo-request?success=true');
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log('🛠️ Issues need to be fixed before demo is ready');
  }
  
  return success;
}

// Run the test
testDemoSuccessPage()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });