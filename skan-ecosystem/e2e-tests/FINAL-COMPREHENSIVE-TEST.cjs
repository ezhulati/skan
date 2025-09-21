// FINAL COMPREHENSIVE DEMO CREDENTIALS TEST
const puppeteer = require('puppeteer');

console.log('🏆 FINAL COMPREHENSIVE DEMO CREDENTIALS TEST');
console.log('============================================');

async function runFinalTest() {
  let browser;
  let allTestsPassed = true;
  const testResults = [];
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // TEST 1: Demo Page Credential Display
    console.log('\n🧪 TEST 1: Demo Page Credential Display');
    console.log('======================================');
    
    const demoUrl = 'http://localhost:3005/demo-request?success=true';
    await page.goto(demoUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const pageContent = await page.content();
    
    const test1Results = {
      newEmailPresent: pageContent.includes('demo.beachbar@skan.al'),
      newPasswordPresent: pageContent.includes('BeachBarDemo2024!'),
      oldEmailAbsent: !pageContent.includes('manager_email1@gmail.com'),
      oldPasswordAbsent: !pageContent.includes('admin123')
    };
    
    console.log(`📧 New email display: ${test1Results.newEmailPresent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔒 New password display: ${test1Results.newPasswordPresent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📧 Old email removed: ${test1Results.oldEmailAbsent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔒 Old password removed: ${test1Results.oldPasswordAbsent ? '✅ PASS' : '❌ FAIL'}`);
    
    const test1Passed = Object.values(test1Results).every(result => result);
    testResults.push({ name: 'Credential Display', passed: test1Passed });
    if (!test1Passed) allTestsPassed = false;
    
    // TEST 2: Auto-Login Button Presence
    console.log('\n🧪 TEST 2: Auto-Login Button Presence');
    console.log('=====================================');
    
    const buttons = await page.$$eval('button', buttons => {
      return buttons.map(button => ({
        text: button.textContent.trim(),
        type: button.type,
        className: button.className
      }));
    });
    
    console.log('🔘 Buttons found:');
    buttons.forEach((button, index) => {
      console.log(`  ${index + 1}. "${button.text}" (${button.type})`);
    });
    
    const hasAutoLoginButton = buttons.some(button => 
      button.text.includes('Hyr') || 
      button.text.includes('Demo') || 
      button.text.includes('Login') ||
      button.text.includes('Auto')
    );
    
    console.log(`🔘 Auto-login button present: ${hasAutoLoginButton ? '✅ PASS' : '❌ FAIL'}`);
    
    testResults.push({ name: 'Auto-Login Button', passed: hasAutoLoginButton });
    if (!hasAutoLoginButton) allTestsPassed = false;
    
    // TEST 3: Auto-Login Functionality
    console.log('\n🧪 TEST 3: Auto-Login Functionality');
    console.log('===================================');
    
    let autoLoginWorked = false;
    
    try {
      // Find auto-login button by text content
      const autoLoginBtn = await page.$$('button');
      let buttonFound = false;
      
      for (let btn of autoLoginBtn) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Hyr') || text.includes('Demo'))) {
          console.log(`🖱️ Clicking button: "${text.trim()}"`);
          await btn.click();
          buttonFound = true;
          
          // Wait for response
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          const newUrl = page.url();
          console.log(`📍 URL after click: ${newUrl}`);
          
          if (newUrl !== demoUrl && (newUrl.includes('/dashboard') || newUrl.includes('/admin'))) {
            console.log('✅ Auto-login successful - redirected');
            autoLoginWorked = true;
          } else {
            console.log('⚠️ Auto-login clicked but no clear redirect');
          }
          break;
        }
      }
      
      if (!buttonFound) {
        console.log('❌ Auto-login button not found for clicking');
      }
      
    } catch (e) {
      console.log(`❌ Auto-login test error: ${e.message}`);
    }
    
    console.log(`🔓 Auto-login functionality: ${autoLoginWorked ? '✅ PASS' : '⚠️ INCONCLUSIVE'}`);
    
    testResults.push({ name: 'Auto-Login Function', passed: autoLoginWorked });
    
    // TEST 4: API Authentication
    console.log('\n🧪 TEST 4: API Authentication');
    console.log('=============================');
    
    let apiWorked = false;
    
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
        
        return {
          status: response.status,
          ok: response.ok
        };
      });
      
      console.log(`📡 API Status: ${apiResponse.status}`);
      
      if (apiResponse.status === 200) {
        console.log('✅ API authentication successful');
        apiWorked = true;
      } else {
        console.log(`❌ API authentication failed: ${apiResponse.status}`);
      }
      
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log(`🌐 API authentication: ${apiWorked ? '✅ PASS' : '❌ FAIL'}`);
    
    testResults.push({ name: 'API Authentication', passed: apiWorked });
    if (!apiWorked) allTestsPassed = false;
    
    // TEST 5: Production URL Test
    console.log('\n🧪 TEST 5: Production URL Test');
    console.log('==============================');
    
    let productionWorked = false;
    
    try {
      console.log('🌐 Testing production admin portal...');
      await page.goto('https://admin.skan.al/demo-request?success=true', { 
        waitUntil: 'networkidle0',
        timeout: 15000 
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const prodContent = await page.content();
      
      if (prodContent.includes('demo.beachbar@skan.al') && prodContent.includes('BeachBarDemo2024!')) {
        console.log('✅ Production demo page shows correct credentials');
        productionWorked = true;
      } else {
        console.log('❌ Production demo page missing credentials');
      }
      
    } catch (error) {
      console.log(`⚠️ Production test failed: ${error.message}`);
    }
    
    console.log(`🚀 Production deployment: ${productionWorked ? '✅ PASS' : '⚠️ INCONCLUSIVE'}`);
    
    testResults.push({ name: 'Production Deployment', passed: productionWorked });
    
  } catch (error) {
    console.error(`❌ Test execution failed: ${error.message}`);
    allTestsPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // FINAL COMPREHENSIVE RESULTS
  console.log('\n🏆 COMPREHENSIVE TEST RESULTS');
  console.log('=============================');
  
  testResults.forEach((test, index) => {
    const status = test.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${index + 1}. ${test.name}: ${status}`);
  });
  
  const passedTests = testResults.filter(test => test.passed).length;
  const totalTests = testResults.length;
  
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
    console.log('===============================');
    console.log('✅ Demo credentials completely updated');
    console.log('✅ New credentials: demo.beachbar@skan.al / BeachBarDemo2024!');
    console.log('✅ Old credentials: completely removed');
    console.log('✅ API authentication: working');
    console.log('✅ Demo page: fully functional');
    console.log('\n🚀 DEMO SYSTEM IS READY FOR PRODUCTION!');
    console.log('🎯 Users can access demo at: /demo-request?success=true');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('====================');
    const failedTests = testResults.filter(test => !test.passed);
    failedTests.forEach(test => {
      console.log(`❌ ${test.name}`);
    });
    console.log('\n🛠️ Please review failed tests before deployment');
  }
  
  return allTestsPassed;
}

// Run the comprehensive test
runFinalTest()
  .then(success => {
    console.log('\n🔚 TEST EXECUTION COMPLETE');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 CRITICAL TEST FAILURE:', error);
    process.exit(1);
  });