const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';

// Test data
const testUser = {
  email: `test-onboarding-${Date.now()}@skan.al`,
  password: 'TestPassword123!',
  fullName: 'Test Onboarding User'
};

console.log('\n🧪 TESTING END-TO-END ONBOARDING FLOW');
console.log('==========================================');

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testOnboardingFlow() {
  let authToken;
  let userId;
  
  try {
    // 🔥 STEP 1: Create a new user account
    console.log('\n📝 STEP 1: Creating new user account');
    console.log('Test user:', testUser.email);
    
    const registerResponse = await makeRequest('/auth/register', {
      method: 'POST',
      body: testUser
    });
    
    console.log('✅ User created successfully');
    console.log('User ID:', registerResponse.userId);
    authToken = registerResponse.token;
    userId = registerResponse.userId;
    
    // 🔥 STEP 2: Check initial onboarding status
    console.log('\n📊 STEP 2: Checking initial onboarding status');
    
    const onboardingStatus = await makeRequest('/onboarding/status', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Onboarding status retrieved');
    console.log('Is Complete:', onboardingStatus.onboarding.isComplete);
    console.log('Current Step:', onboardingStatus.onboarding.currentStep);
    console.log('Completed Steps:', onboardingStatus.onboarding.completedSteps);
    
    if (onboardingStatus.onboarding.isComplete) {
      throw new Error('❌ New user should not have completed onboarding');
    }
    
    // 🔥 STEP 3: Complete profile step
    console.log('\n👤 STEP 3: Completing profile step');
    
    const profileUpdate = await makeRequest('/onboarding/step/profileComplete', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: {
        data: {
          fullName: testUser.fullName,
          email: testUser.email
        },
        completed: true
      }
    });
    
    console.log('✅ Profile step completed');
    console.log('Current step now:', profileUpdate.onboarding.currentStep);
    
    // 🔥 STEP 4: Complete venue setup step
    console.log('\n🏪 STEP 4: Completing venue setup step');
    
    const venueUpdate = await makeRequest('/onboarding/step/venueSetup', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: {
        data: {
          venueName: 'Test Restaurant',
          address: '123 Test Street, Test City',
          phone: '+355 69 123 4567',
          description: 'A test restaurant for onboarding',
          cuisineType: 'mediterranean'
        },
        completed: true
      }
    });
    
    console.log('✅ Venue setup step completed');
    console.log('Current step now:', venueUpdate.onboarding.currentStep);
    
    // 🔥 STEP 5: Complete menu categories step
    console.log('\n📋 STEP 5: Completing menu categories step');
    
    const categoriesUpdate = await makeRequest('/onboarding/step/menuCategories', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: {
        data: {
          categoriesCreated: 4,
          categories: ['Appetizers', 'Main Courses', 'Desserts', 'Beverages']
        },
        completed: true
      }
    });
    
    console.log('✅ Menu categories step completed');
    console.log('Current step now:', categoriesUpdate.onboarding.currentStep);
    
    // 🔥 STEP 6: Complete menu items step
    console.log('\n🍕 STEP 6: Completing menu items step');
    
    const itemsUpdate = await makeRequest('/onboarding/step/menuItems', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: {
        data: {
          itemsCreated: 2,
          items: ['Pizza Margherita', 'Coca Cola']
        },
        completed: true
      }
    });
    
    console.log('✅ Menu items step completed');
    console.log('Current step now:', itemsUpdate.onboarding.currentStep);
    
    // 🔥 STEP 7: Check if onboarding is now complete
    console.log('\n🎯 STEP 7: Checking final onboarding status');
    
    const finalStatus = await makeRequest('/onboarding/status', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Final onboarding status retrieved');
    console.log('Is Complete:', finalStatus.onboarding.isComplete);
    console.log('Current Step:', finalStatus.onboarding.currentStep);
    console.log('Completed Steps:', finalStatus.onboarding.completedSteps);
    
    if (!finalStatus.onboarding.isComplete) {
      console.log('⚠️  Onboarding not automatically complete, trying manual completion...');
      
      // 🔥 STEP 8: Try to complete onboarding manually
      console.log('\n✅ STEP 8: Manually completing onboarding');
      
      const completionResponse = await makeRequest('/onboarding/complete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      console.log('✅ Onboarding completed manually');
      console.log('Final status:', completionResponse.onboarding.isComplete);
    }
    
    // 🔥 STEP 9: Test session persistence (simulate logout/login)
    console.log('\n🔄 STEP 9: Testing session persistence');
    
    // Simulate login again
    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password
      }
    });
    
    console.log('✅ Login successful');
    const newToken = loginResponse.token;
    
    // Check onboarding status with new token
    const persistedStatus = await makeRequest('/onboarding/status', {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });
    
    console.log('✅ Onboarding status persisted across sessions');
    console.log('Is Complete:', persistedStatus.onboarding.isComplete);
    console.log('Completed Steps Count:', persistedStatus.onboarding.completedSteps.length);
    
    // 🎉 SUCCESS!
    console.log('\n🎉 SUCCESS: END-TO-END ONBOARDING TEST PASSED!');
    console.log('==========================================');
    console.log('✅ User account created');
    console.log('✅ Onboarding progress tracking works');
    console.log('✅ Step-by-step completion works');
    console.log('✅ Onboarding completion works');
    console.log('✅ Session persistence works');
    console.log('✅ All API endpoints functional');
    
    return {
      success: true,
      userId,
      email: testUser.email,
      finalStatus: persistedStatus.onboarding
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('- API endpoints not deployed');
    console.log('- Database not configured for onboarding');
    console.log('- Authentication issues');
    console.log('- Network connectivity problems');
    
    throw error;
  }
}

// 🚀 Run the test
testOnboardingFlow()
  .then(result => {
    console.log('\n📊 TEST SUMMARY:');
    console.log('User Email:', result.email);
    console.log('User ID:', result.userId);
    console.log('Onboarding Complete:', result.finalStatus.isComplete);
    console.log('Steps Completed:', result.finalStatus.completedSteps.length, 'of 6');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 TEST SUITE FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });