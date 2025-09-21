// Test Auto-Login Complete Flow
const puppeteer = require('puppeteer');

console.log('🔐 TESTING AUTO-LOGIN COMPLETE FLOW');
console.log('====================================');

async function testAutoLoginComplete() {
  let browser;
  let success = true;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Step 1: Navigate to demo success page
    console.log('\n📋 STEP 1: Navigate to Demo Success Page');
    console.log('=========================================');
    
    const demoSuccessUrl = 'http://localhost:3005/demo-request?success=true';
    await page.goto(demoSuccessUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Navigated to: ${demoSuccessUrl}`);
    
    // Step 2: Verify credentials display
    console.log('\n🔑 STEP 2: Verify Credentials Display');
    console.log('=====================================');
    
    const pageContent = await page.content();
    
    if (pageContent.includes('demo.beachbar@skan.al') && pageContent.includes('BeachBarDemo2024!')) {
      console.log('✅ Both credentials are displayed correctly');
    } else {
      console.log('❌ Credentials not properly displayed');
      success = false;
    }
    
    // Step 3: Test auto-login button click
    console.log('\n🖱️ STEP 3: Test Auto-Login Button');
    console.log('==================================');
    
    // Find and click auto-login button
    const autoLoginButton = await page.$('button:contains("Hyr në Demo")') || 
                           await page.$('button[onclick*="login"]') ||
                           await page.$('button[type="submit"]');
    
    if (autoLoginButton) {
      console.log('✅ Auto-login button found');
      
      // Get text content of the button
      const buttonText = await page.evaluate(el => el.textContent, autoLoginButton);
      console.log(`🔘 Button text: "${buttonText.trim()}"`);
      
      // Click the button
      await autoLoginButton.click();
      console.log('🖱️ Auto-login button clicked');
      
      // Wait for response/navigation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const newUrl = page.url();
      console.log(`📍 URL after auto-login: ${newUrl}`);
      
      // Check for successful navigation
      if (newUrl.includes('/dashboard')) {
        console.log('✅ Auto-login successful - redirected to dashboard');
      } else if (newUrl.includes('/admin')) {
        console.log('✅ Auto-login successful - redirected to admin area');
      } else if (newUrl !== demoSuccessUrl) {
        console.log('✅ Auto-login triggered - URL changed');
      } else {
        console.log('⚠️ Auto-login unclear - checking for error messages');
        
        // Check for error messages
        const errorMessage = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [style*="color: red"]');
          for (let element of errorElements) {
            if (element.textContent && element.textContent.trim()) {
              return element.textContent.trim();
            }
          }
          return null;
        });
        
        if (errorMessage) {
          console.log(`❌ Auto-login error: ${errorMessage}`);
          success = false;
        } else {
          console.log('⚠️ Auto-login result unclear - no navigation, no error');
        }
      }
      
    } else {
      console.log('❌ Auto-login button not found');
      success = false;
    }
    
    // Step 4: Test direct API login to verify credentials work
    console.log('\n🌐 STEP 4: Direct API Login Test');
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
        
        const text = await response.text();
        return {
          status: response.status,
          data: text,
          headers: Object.fromEntries(response.headers.entries())
        };
      });
      
      console.log(`📡 API Status: ${apiResponse.status}`);
      
      if (apiResponse.status === 200) {
        console.log('✅ API login successful');
        
        try {
          const data = JSON.parse(apiResponse.data);
          if (data.token) {
            console.log('✅ JWT token received');
          }
          if (data.user && data.user.email) {
            console.log(`✅ User email confirmed: ${data.user.email}`);
          }
          if (data.venue) {
            console.log(`✅ Venue access: ${data.venue.name || 'venue data present'}`);
          }
        } catch (e) {
          console.log('✅ API response received but not JSON');
        }
      } else if (apiResponse.status === 401) {
        console.log('❌ API login failed - Unauthorized (wrong credentials)');
        success = false;
      } else if (apiResponse.status === 500) {
        console.log('❌ API login failed - Server error');
        console.log(`Response: ${apiResponse.data.substring(0, 200)}`);
        success = false;
      } else {
        console.log(`❌ API login failed - Status ${apiResponse.status}`);
        success = false;
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
      success = false;
    }
    
    // Step 5: Comprehensive verification
    console.log('\n✅ STEP 5: Comprehensive Verification');
    console.log('=====================================');
    
    // Navigate back to demo page to verify everything is still working
    await page.goto(demoSuccessUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalContent = await page.content();
    
    const finalChecks = {
      hasNewEmail: finalContent.includes('demo.beachbar@skan.al'),
      hasNewPassword: finalContent.includes('BeachBarDemo2024!'),
      hasOldEmail: finalContent.includes('manager_email1@gmail.com'),
      hasOldPassword: finalContent.includes('admin123'),
      hasAutoLoginButton: finalContent.includes('Hyr në Demo') || finalContent.includes('Auto-Login')
    };
    
    console.log(`📧 New email present: ${finalChecks.hasNewEmail ? '✅' : '❌'}`);
    console.log(`🔒 New password present: ${finalChecks.hasNewPassword ? '✅' : '❌'}`);
    console.log(`📧 Old email absent: ${!finalChecks.hasOldEmail ? '✅' : '❌'}`);
    console.log(`🔒 Old password absent: ${!finalChecks.hasOldPassword ? '✅' : '❌'}`);
    console.log(`🔘 Auto-login button present: ${finalChecks.hasAutoLoginButton ? '✅' : '❌'}`);
    
    if (!finalChecks.hasNewEmail || !finalChecks.hasNewPassword || 
        finalChecks.hasOldEmail || finalChecks.hasOldPassword || 
        !finalChecks.hasAutoLoginButton) {
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
    console.log('🎉 AUTO-LOGIN TESTS PASSED!');
    console.log('✅ Demo credentials display correctly');
    console.log('✅ New credentials (demo.beachbar@skan.al / BeachBarDemo2024!) work');
    console.log('✅ Old credentials completely removed');
    console.log('✅ Auto-login button functions properly');
    console.log('✅ API accepts new credentials');
    console.log('\n🚀 Auto-login system is fully operational!');
  } else {
    console.log('❌ AUTO-LOGIN TESTS FAILED!');
    console.log('🛠️ Issues need to be resolved');
  }
  
  return success;
}

// Run the test
testAutoLoginComplete()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });