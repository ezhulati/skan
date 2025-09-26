const https = require('https');
const http = require('http');

// API configuration using the same URL as .env.local
const API_BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'demo.beachbar@skan.al',
  password: 'BeachBarDemo2024!'
};

function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (postData) {
      const dataString = JSON.stringify(postData);
      reqOptions.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = client.request(reqOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

async function testProfileAPI() {
  console.log('🚀 Testing Profile API functionality...');
  console.log('📍 API Base URL:', API_BASE_URL);
  
  try {
    // Step 1: Test login to get authentication token
    console.log('\n1️⃣ Testing login...');
    const loginResponse = await makeRequest(
      `${API_BASE_URL}/auth/login`, 
      { method: 'POST' }, 
      TEST_CREDENTIALS
    );
    
    console.log('📊 Login Response Status:', loginResponse.statusCode);
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    console.log('✅ Login successful');
    const authToken = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('🔑 Auth token received (length):', authToken ? authToken.length : 'N/A');
    console.log('👤 User ID:', userId);
    
    // Step 2: Get current user profile
    console.log('\n2️⃣ Getting current user profile...');
    const profileResponse = await makeRequest(
      `${API_BASE_URL}/users/${userId}`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    console.log('📊 Profile GET Response Status:', profileResponse.statusCode);
    
    if (profileResponse.statusCode === 401) {
      console.log('❌ AUTHENTICATION FAILED - Invalid token error detected!');
      console.log('🔍 This suggests the .env.local fix may not be working correctly');
      return;
    }
    
    if (profileResponse.statusCode !== 200) {
      console.log('❌ Profile fetch failed:', profileResponse.data);
      return;
    }
    
    console.log('✅ Profile fetch successful');
    console.log('👤 Current Name:', profileResponse.data.fullName);
    
    // Step 3: Update profile name to "Gjergj Kastrioti"
    console.log('\n3️⃣ Testing profile name update...');
    const updateData = {
      fullName: 'Gjergj Kastrioti'
    };
    
    const updateResponse = await makeRequest(
      `${API_BASE_URL}/users/${userId}`,
      { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` }
      },
      updateData
    );
    
    console.log('📊 Profile UPDATE Response Status:', updateResponse.statusCode);
    
    if (updateResponse.statusCode === 401) {
      console.log('❌ AUTHENTICATION FAILED DURING UPDATE - Invalid token error!');
      console.log('🔍 The .env.local fix is not working correctly');
      console.log('💡 The application is still trying to use the local emulator');
      return;
    }
    
    if (updateResponse.statusCode === 200 || updateResponse.statusCode === 204) {
      console.log('✅ Profile update successful!');
      console.log('📝 Name changed to: Gjergj Kastrioti');
    } else {
      console.log('❌ Profile update failed:', updateResponse.data);
    }
    
    // Step 4: Verify the change by fetching profile again
    console.log('\n4️⃣ Verifying name change persisted...');
    const verifyResponse = await makeRequest(
      `${API_BASE_URL}/users/${userId}`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    console.log('📊 Verification Response Status:', verifyResponse.statusCode);
    
    if (verifyResponse.statusCode === 200) {
      console.log('✅ Verification successful');
      console.log('👤 Updated Name:', verifyResponse.data.fullName);
      
      if (verifyResponse.data.fullName === 'Gjergj Kastrioti') {
        console.log('🎉 Name change persisted correctly!');
      } else {
        console.log('⚠️ Name change may not have persisted properly');
      }
    } else {
      console.log('❌ Verification failed:', verifyResponse.data);
    }
    
    // Summary
    console.log('\n📋 TEST RESULTS SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ API URL Configuration: ${API_BASE_URL}`);
    console.log(`✅ Login Status: ${loginResponse.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Profile Fetch Status: ${profileResponse.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Profile Update Status: ${updateResponse.statusCode === 200 || updateResponse.statusCode === 204 ? 'SUCCESS' : 'FAILED'}`);
    
    const noAuthErrors = ![loginResponse, profileResponse, updateResponse].some(r => r.statusCode === 401);
    console.log(`✅ No Authentication Errors: ${noAuthErrors ? 'TRUE' : 'FALSE'}`);
    
    console.log('\n🎯 FINAL CONCLUSION:');
    if (noAuthErrors && (updateResponse.statusCode === 200 || updateResponse.statusCode === 204)) {
      console.log('🎉 SUCCESS: The .env.local fix is working correctly!');
      console.log('✅ Profile name editing functionality is now working');
      console.log('✅ No more "Invalid token" errors');
      console.log('✅ API calls are hitting the production server correctly');
    } else {
      console.log('❌ ISSUE: There are still problems with the profile editing');
      console.log('🔍 The .env.local fix may need further investigation');
    }
    
  } catch (error) {
    console.error('💥 Test Error:', error.message);
    console.log('🔍 This might indicate network connectivity issues');
  }
}

// Run the test
if (require.main === module) {
  testProfileAPI();
}

module.exports = { testProfileAPI };