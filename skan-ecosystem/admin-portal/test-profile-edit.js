const puppeteer = require('puppeteer');

async function testProfileEdit() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  console.log('🚀 Starting profile edit test...');
  
  try {
    // Step 1: Navigate to admin portal
    console.log('📍 Navigating to admin portal...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    // Step 2: Login with demo credentials
    console.log('🔐 Logging in with demo credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    
    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('✅ Successfully logged in');
    
    // Step 3: Navigate to profile page
    console.log('👤 Navigating to profile page...');
    await page.goto('http://localhost:3002/profile', { waitUntil: 'networkidle2' });
    
    // Step 4: Click edit button
    console.log('✏️ Looking for edit button...');
    await page.waitForSelector('button[data-testid="edit-profile-btn"], button:contains("Ndrysho"), .edit-btn, [aria-label*="edit"], [title*="edit"]', { timeout: 10000 });
    
    // Try multiple selectors to find the edit button
    const editButtonSelectors = [
      'button[data-testid="edit-profile-btn"]',
      'button[aria-label*="edit"]',
      'button[title*="edit"]',
      'button[class*="edit"]',
      'button:has-text("Ndrysho")',
      'button:has-text("Edit")',
      '.edit-btn',
      '[role="button"][aria-label*="edit"]'
    ];
    
    let editButton = null;
    for (const selector of editButtonSelectors) {
      try {
        editButton = await page.$(selector);
        if (editButton) {
          console.log(`✅ Found edit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!editButton) {
      // Take screenshot to see the page
      await page.screenshot({ path: 'profile-page-debug.png', fullPage: true });
      console.log('📸 Screenshot saved as profile-page-debug.png');
      
      // Log page content
      const content = await page.content();
      console.log('📄 Page HTML length:', content.length);
      
      // Find all buttons
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent.trim(),
          classes: btn.className,
          id: btn.id,
          ariaLabel: btn.getAttribute('aria-label'),
          title: btn.title
        }))
      );
      console.log('🔍 All buttons found:', buttons);
      
      throw new Error('Edit button not found');
    }
    
    await editButton.click();
    console.log('✅ Clicked edit button');
    
    // Step 5: Change name field
    console.log('📝 Looking for name input field...');
    await page.waitForSelector('input[name="fullName"], input[name="name"], input[id*="name"], input[placeholder*="name"], input[aria-label*="name"]', { timeout: 5000 });
    
    const nameInputSelectors = [
      'input[name="fullName"]',
      'input[name="name"]',
      'input[id*="name"]',
      'input[placeholder*="name"]',
      'input[aria-label*="name"]',
      'input[type="text"]:first-of-type'
    ];
    
    let nameInput = null;
    for (const selector of nameInputSelectors) {
      try {
        nameInput = await page.$(selector);
        if (nameInput) {
          console.log(`✅ Found name input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!nameInput) {
      // Find all inputs
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          name: input.name,
          id: input.id,
          type: input.type,
          placeholder: input.placeholder,
          ariaLabel: input.getAttribute('aria-label'),
          value: input.value
        }))
      );
      console.log('🔍 All inputs found:', inputs);
      throw new Error('Name input not found');
    }
    
    // Clear existing value and type new name
    await nameInput.click({ clickCount: 3 }); // Select all text
    await nameInput.type('Gjergj Kastrioti');
    console.log('✅ Changed name to "Gjergj Kastrioti"');
    
    // Step 6: Click save button
    console.log('💾 Looking for save button...');
    
    const saveButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Ruaj Ndryshimet")',
      'button:has-text("Save Changes")',
      'button:has-text("Save")',
      'button:has-text("Ruaj")',
      'button[data-testid="save-btn"]',
      '.save-btn',
      'button[class*="save"]'
    ];
    
    let saveButton = null;
    for (const selector of saveButtonSelectors) {
      try {
        saveButton = await page.$(selector);
        if (saveButton) {
          console.log(`✅ Found save button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!saveButton) {
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent.trim(),
          classes: btn.className,
          type: btn.type
        }))
      );
      console.log('🔍 All buttons after edit:', buttons);
      throw new Error('Save button not found');
    }
    
    // Monitor network requests to check for API calls
    const apiResponses = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('api')) {
        apiResponses.push({
          url: url,
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await saveButton.click();
    console.log('✅ Clicked save button');
    
    // Step 7: Wait for API response and check for errors
    console.log('⏳ Waiting for API response...');
    await page.waitForTimeout(3000); // Wait for API call
    
    // Check for API responses
    console.log('🌐 API Responses:', apiResponses);
    
    // Check for error messages
    const errorMessages = await page.$$eval('[class*="error"], [class*="alert"], .text-red-500, .text-danger', 
      elements => elements.map(el => el.textContent.trim())
    );
    
    if (errorMessages.length > 0) {
      console.log('❌ Error messages found:', errorMessages);
    } else {
      console.log('✅ No error messages found');
    }
    
    // Step 8: Check for success indicators
    const successMessages = await page.$$eval('[class*="success"], [class*="alert-success"], .text-green-500, .text-success', 
      elements => elements.map(el => el.textContent.trim())
    );
    
    if (successMessages.length > 0) {
      console.log('✅ Success messages found:', successMessages);
    }
    
    // Step 9: Refresh page to verify persistence
    console.log('🔄 Refreshing page to verify persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Check if the name is still "Gjergj Kastrioti"
    await page.waitForTimeout(2000);
    const displayedName = await page.$eval('body', body => {
      // Look for the name in various places
      const nameElements = body.querySelectorAll('[data-testid*="name"], [id*="name"], .profile-name, .user-name, h1, h2, h3');
      for (let elem of nameElements) {
        if (elem.textContent.includes('Gjergj Kastrioti')) {
          return elem.textContent.trim();
        }
      }
      return 'Name not found';
    }).catch(() => 'Name check failed');
    
    console.log('👤 Displayed name after refresh:', displayedName);
    
    // Final summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('='.repeat(50));
    console.log('✅ Admin portal loads correctly');
    console.log('✅ Login with demo credentials successful');
    console.log('✅ Navigation to profile page successful');
    console.log('✅ Edit button found and clicked');
    console.log('✅ Name field found and updated');
    console.log('✅ Save button found and clicked');
    
    const hasApiErrors = apiResponses.some(response => response.status === 401 || response.status >= 400);
    if (hasApiErrors) {
      console.log('❌ API errors detected:', apiResponses.filter(r => r.status >= 400));
    } else {
      console.log('✅ No API errors detected');
    }
    
    if (errorMessages.length > 0) {
      console.log('❌ UI error messages found');
    } else {
      console.log('✅ No UI error messages');
    }
    
    if (displayedName.includes('Gjergj Kastrioti')) {
      console.log('✅ Name change persisted after refresh');
    } else {
      console.log('❌ Name change may not have persisted');
    }
    
    console.log('\n🎯 CONCLUSION:');
    if (!hasApiErrors && errorMessages.length === 0 && displayedName.includes('Gjergj Kastrioti')) {
      console.log('🎉 Profile editing functionality is working correctly!');
      console.log('✅ The .env.local fix has resolved the "Invalid token" issue');
    } else {
      console.log('⚠️ There may still be some issues with the profile editing functionality');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved as error-screenshot.png');
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available
async function checkPuppeteer() {
  try {
    require('puppeteer');
    return true;
  } catch (e) {
    return false;
  }
}

// Run the test
if (require.main === module) {
  checkPuppeteer().then(available => {
    if (available) {
      testProfileEdit();
    } else {
      console.log('❌ Puppeteer not available. Installing...');
      console.log('Run: npm install puppeteer');
      
      // Alternative: Manual testing instructions
      console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
      console.log('1. Open browser and go to: http://localhost:3002');
      console.log('2. Login with: demo.beachbar@skan.al / BeachBarDemo2024!');
      console.log('3. Navigate to: http://localhost:3002/profile');
      console.log('4. Click the edit button');
      console.log('5. Change name to: Gjergj Kastrioti');
      console.log('6. Click "Ruaj Ndryshimet" (Save Changes)');
      console.log('7. Check for success message and no errors');
      console.log('8. Refresh page to verify persistence');
    }
  });
}

module.exports = { testProfileEdit };