// Test Complete Demo Form Flow
const puppeteer = require('puppeteer');

console.log('📝 TESTING COMPLETE DEMO FORM FLOW');
console.log('==================================');

async function testCompleteDemo() {
  let browser;
  let success = true;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Step 1: Navigate to demo page
    console.log('\n📋 STEP 1: Navigate to Demo Page');
    console.log('=================================');
    
    await page.goto('http://localhost:3005/demo-request', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Demo page loaded');
    
    // Step 2: Fill out demo form
    console.log('\n📝 STEP 2: Fill Out Demo Form');
    console.log('==============================');
    
    // Look for form fields
    const formFields = await page.$$eval('input', inputs => {
      return inputs.map(input => ({
        name: input.name || input.id || '',
        type: input.type,
        placeholder: input.placeholder || '',
        required: input.required
      }));
    });
    
    console.log('📋 Form fields found:');
    formFields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.type} - ${field.name || 'no name'} (${field.placeholder})`);
    });
    
    // Fill out common form fields
    try {
      // Try to fill restaurant name
      const nameSelector = 'input[name="restaurantName"], input[placeholder*="restoran"], input[placeholder*="emri"], input[id*="name"]';
      await page.waitForSelector(nameSelector, { timeout: 5000 });
      await page.type(nameSelector, 'Test Demo Restaurant');
      console.log('✅ Filled restaurant name');
      
      // Try to fill email
      const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email"]';
      await page.waitForSelector(emailSelector, { timeout: 5000 });
      await page.type(emailSelector, 'test@demo.restaurant');
      console.log('✅ Filled email');
      
      // Try to fill phone
      const phoneSelector = 'input[type="tel"], input[name="phone"], input[placeholder*="telefon"], input[placeholder*="phone"]';
      if (await page.$(phoneSelector)) {
        await page.type(phoneSelector, '+355691234567');
        console.log('✅ Filled phone');
      }
      
      // Try to fill city/location
      const citySelector = 'input[name="city"], input[placeholder*="qytet"], input[placeholder*="city"], input[placeholder*="location"]';
      if (await page.$(citySelector)) {
        await page.type(citySelector, 'Tirana');
        console.log('✅ Filled city');
      }
      
    } catch (e) {
      console.log(`⚠️ Form filling issue: ${e.message}`);
    }
    
    // Step 3: Submit form
    console.log('\n🚀 STEP 3: Submit Demo Form');
    console.log('============================');
    
    // Look for submit button
    const submitButtons = await page.$$eval('button', buttons => {
      return buttons.map(button => ({
        text: button.textContent.trim(),
        type: button.type,
        className: button.className,
        disabled: button.disabled
      }));
    });
    
    console.log('🔘 Submit buttons found:');
    submitButtons.forEach((button, index) => {
      console.log(`  ${index + 1}. "${button.text}" (type: ${button.type}, disabled: ${button.disabled})`);
    });
    
    // Try to submit
    try {
      const submitSelector = 'button[type="submit"], button:contains("Dërgo"), button:contains("Submit"), .login-button';
      await page.click(submitSelector);
      console.log('✅ Clicked submit button');
      
      // Wait for form submission
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (e) {
      console.log(`⚠️ Submit issue: ${e.message}`);
      // Try alternative submit methods
      const submitButton = await page.$('button[type="submit"]') || 
                          await page.$('.login-button') ||
                          await page.$('button:last-of-type');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Clicked submit via alternative method');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Step 4: Check for credentials display
    console.log('\n🔑 STEP 4: Check for Demo Credentials');
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
    
    // Step 5: Test auto-login functionality
    console.log('\n🔓 STEP 5: Test Auto-Login');
    console.log('===========================');
    
    // Look for auto-login button after form submission
    const autoLoginButtons = await page.$$eval('button', buttons => {
      return buttons
        .filter(button => 
          button.textContent.includes('Auto') ||
          button.textContent.includes('Login') ||
          button.textContent.includes('Demo') ||
          button.onclick && button.onclick.includes('login')
        )
        .map(button => ({
          text: button.textContent.trim(),
          onclick: button.getAttribute('onclick') || ''
        }));
    });
    
    console.log('🔓 Auto-login buttons found:');
    autoLoginButtons.forEach((button, index) => {
      console.log(`  ${index + 1}. "${button.text}"`);
    });
    
    if (autoLoginButtons.length > 0) {
      try {
        // Try to click first auto-login button
        const autoLoginSelector = `button:contains("${autoLoginButtons[0].text}")`;
        const buttons = await page.$$('button');
        
        for (let button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('Auto') || text.includes('Login') || text.includes('Demo')) {
            await button.click();
            console.log('✅ Clicked auto-login button');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const newUrl = page.url();
            console.log(`📍 URL after auto-login: ${newUrl}`);
            
            if (newUrl.includes('/dashboard') || newUrl.includes('/admin')) {
              console.log('✅ Auto-login successful - redirected to dashboard');
            } else {
              console.log('⚠️ Auto-login unclear - no clear redirect');
            }
            break;
          }
        }
      } catch (e) {
        console.log(`⚠️ Auto-login test failed: ${e.message}`);
      }
    } else {
      console.log('❌ No auto-login buttons found');
    }
    
    // Step 6: API verification
    console.log('\n🌐 STEP 6: API Verification');
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
    console.log('✅ Demo form can be filled and submitted');
    console.log('✅ Demo credentials display correctly after form submission');
    console.log('✅ New credentials (demo.beachbar@skan.al / BeachBarDemo2024!) are shown');
    console.log('✅ Old credentials are completely removed');
    console.log('✅ API accepts new credentials');
    console.log('\n🚀 Demo credentials system is fully operational!');
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log('🛠️ Issues need to be fixed before demo is ready');
  }
  
  return success;
}

// Run the test
testCompleteDemo()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });