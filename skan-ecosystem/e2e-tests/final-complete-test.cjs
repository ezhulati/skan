const { chromium } = require('playwright');

async function finalCompleteTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Track all navigation
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`🧭 Navigated to: ${frame.url()}`);
    }
  });

  // Track requests
  page.on('request', request => {
    if (request.url().includes('auth/login')) {
      console.log(`🌐 LOGIN REQUEST: ${request.method()} ${request.url()}`);
      console.log(`📦 Request body:`, request.postData());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('auth/login')) {
      console.log(`📥 LOGIN RESPONSE: ${response.status()}`);
      if (response.status() === 200) {
        try {
          const responseBody = await response.text();
          const data = JSON.parse(responseBody);
          console.log(`✅ Login successful! Token: ${data.token.substring(0, 20)}...`);
          console.log(`👤 User: ${data.user.fullName} (${data.user.role})`);
        } catch (e) {
          console.log(`📋 Response received but couldn't parse`);
        }
      }
    }
  });

  try {
    console.log('🚀 Starting FINAL COMPLETE TEST...');
    
    // Step 1: Go to demo request page
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForTimeout(3000);
    console.log('✅ Demo request page loaded');
    
    // Step 2: Fill and submit form
    console.log('📝 Filling demo form...');
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Final Complete Test');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'User');
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'finalcomplete@test.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Final Test Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(4000);
    console.log('✅ Demo form submitted');
    
    // Step 3: Verify success page and credentials
    const successVisible = await page.locator('text=Demo u aktivizua').isVisible().catch(() => false);
    console.log(`✅ Success page visible: ${successVisible}`);
    
    if (successVisible) {
      // Check displayed credentials
      const pageContent = await page.content();
      const hasAdmin123 = pageContent.includes('admin123');
      const hasManagerEmail = pageContent.includes('manager_email1@gmail.com');
      
      console.log(`🔑 Shows admin123 password: ${hasAdmin123}`);
      console.log(`📧 Shows manager email: ${hasManagerEmail}`);
      
      // Step 4: Test auto-login button
      const loginButton = await page.locator('button:has-text("Hyr në Demo")').isVisible().catch(() => false);
      console.log(`🔘 Login button visible: ${loginButton}`);
      
      if (loginButton) {
        console.log('🖱️ Clicking "Hyr në Demo" button...');
        
        // Wait for the click and navigation
        const [response] = await Promise.all([
          page.waitForResponse(response => response.url().includes('auth/login')),
          page.click('button:has-text("Hyr në Demo")')
        ]);
        
        console.log(`📥 API Response Status: ${response.status()}`);
        
        if (response.status() === 200) {
          console.log('✅ API login successful! Waiting for redirect...');
          
          // Wait longer for potential redirect
          await page.waitForTimeout(8000);
          
          const currentUrl = page.url();
          console.log(`🌐 Current URL: ${currentUrl}`);
          
          // Check if we're on dashboard
          const onDashboard = currentUrl.includes('/dashboard');
          console.log(`📊 Successfully on dashboard: ${onDashboard}`);
          
          if (onDashboard) {
            console.log('🎉🎉🎉 COMPLETE SUCCESS! Auto-login works 100%! 🎉🎉🎉');
            
            // Verify dashboard elements
            const dashboardTitle = await page.locator('h1, .dashboard-title').textContent().catch(() => '');
            console.log(`📋 Dashboard title: ${dashboardTitle}`);
            
            // Check localStorage
            const token = await page.evaluate(() => localStorage.getItem('token'));
            const user = await page.evaluate(() => localStorage.getItem('user'));
            console.log(`💾 Token stored: ${token ? 'YES' : 'NO'}`);
            console.log(`👤 User data stored: ${user ? 'YES' : 'NO'}`);
            
          } else {
            console.log('❌ ISSUE: API login successful but no redirect to dashboard');
            console.log('🔍 Checking for JavaScript errors or redirect issues...');
            
            // Check if redirect is happening client-side
            await page.waitForTimeout(3000);
            const finalUrl = page.url();
            console.log(`🌐 Final URL after waiting: ${finalUrl}`);
          }
        } else {
          console.log(`❌ API login failed with status: ${response.status()}`);
        }
        
      } else {
        console.log('❌ Login button not found');
      }
    } else {
      console.log('❌ Success page not visible');
    }
    
    await page.screenshot({ path: 'final-complete-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

finalCompleteTest().catch(console.error);