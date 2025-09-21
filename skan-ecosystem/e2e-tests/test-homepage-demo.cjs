// Test Homepage Demo Flow
const puppeteer = require('puppeteer');

console.log('🏠 TESTING HOMEPAGE DEMO FLOW');
console.log('=============================');

async function testHomepageDemo() {
  let browser;
  let success = true;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Test 1: Check homepage
    console.log('\n🏠 TEST 1: Homepage Check');
    console.log('=========================');
    
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`📄 Page Title: ${await page.title()}`);
    
    // Check if this redirects to login
    if (currentUrl.includes('/login')) {
      console.log('📍 Redirected to login page');
      
      // Check for demo credentials on login page
      const loginContent = await page.content();
      
      if (loginContent.includes('demo.beachbar@skan.al')) {
        console.log('✅ NEW EMAIL: demo.beachbar@skan.al found on login page');
      } else {
        console.log('❌ NEW EMAIL: NOT FOUND on login page');
      }
      
      if (loginContent.includes('BeachBarDemo2024!')) {
        console.log('✅ NEW PASSWORD: BeachBarDemo2024! found on login page');
      } else {
        console.log('❌ NEW PASSWORD: NOT FOUND on login page');
      }
      
      // Look for demo button or link
      const demoElements = await page.$$eval('*', elements => {
        return elements
          .filter(el => el.textContent && (
            el.textContent.toLowerCase().includes('demo') ||
            el.textContent.toLowerCase().includes('try') ||
            el.textContent.toLowerCase().includes('kërkese')
          ))
          .map(el => ({
            tag: el.tagName,
            text: el.textContent.trim(),
            href: el.href || '',
            onclick: el.getAttribute('onclick') || ''
          }));
      });
      
      console.log('\n🎯 Demo-related elements:');
      demoElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tag}: "${el.text}"`);
        if (el.href) console.log(`     → href: ${el.href}`);
        if (el.onclick) console.log(`     → onclick: ${el.onclick}`);
      });
      
      // Check for /demo-request navigation
      if (demoElements.length > 0) {
        try {
          console.log('\n🖱️ Trying to navigate to demo page...');
          await page.goto('http://localhost:3005/demo-request', { waitUntil: 'networkidle0' });
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('📍 Now at demo-request page');
          
          const demoContent = await page.content();
          
          if (demoContent.includes('demo.beachbar@skan.al')) {
            console.log('✅ NEW EMAIL: demo.beachbar@skan.al found on demo page');
          } else {
            console.log('❌ NEW EMAIL: NOT FOUND on demo page');
            success = false;
          }
          
          if (demoContent.includes('BeachBarDemo2024!')) {
            console.log('✅ NEW PASSWORD: BeachBarDemo2024! found on demo page');
          } else {
            console.log('❌ NEW PASSWORD: NOT FOUND on demo page');
            success = false;
          }
          
          // Check old credentials
          if (demoContent.includes('manager_email1@gmail.com')) {
            console.log('❌ OLD EMAIL: STILL PRESENT on demo page');
            success = false;
          } else {
            console.log('✅ OLD EMAIL: REMOVED from demo page');
          }
          
          if (demoContent.includes('admin123')) {
            console.log('❌ OLD PASSWORD: STILL PRESENT on demo page');
            success = false;
          } else {
            console.log('✅ OLD PASSWORD: REMOVED from demo page');
          }
          
        } catch (e) {
          console.log(`❌ Failed to navigate to demo page: ${e.message}`);
          success = false;
        }
      }
    } else {
      console.log('📍 Not redirected - checking current page content');
      
      const content = await page.content();
      
      if (content.includes('demo.beachbar@skan.al')) {
        console.log('✅ NEW EMAIL: demo.beachbar@skan.al found on homepage');
      } else {
        console.log('❌ NEW EMAIL: NOT FOUND on homepage');
      }
      
      if (content.includes('BeachBarDemo2024!')) {
        console.log('✅ NEW PASSWORD: BeachBarDemo2024! found on homepage');
      } else {
        console.log('❌ NEW PASSWORD: NOT FOUND on homepage');
      }
    }
    
    // Test 2: API Test
    console.log('\n🌐 TEST 2: API Verification');
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
    console.log('✅ New credentials are working');
    console.log('✅ API accepts demo.beachbar@skan.al / BeachBarDemo2024!');
    console.log('\n🚀 Demo credentials are ready!');
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log('🛠️ Issues need to be fixed');
  }
  
  return success;
}

// Run the test
testHomepageDemo()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });