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

    console.log(`🔍 Making request to: ${reqOptions.method} ${url}`);
    console.log(`📋 Headers:`, reqOptions.headers);
    if (postData) {
      console.log(`📦 Body:`, postData);
    }

    const req = client.request(reqOptions, (res) => {
      let responseData = '';
      
      console.log(`📊 Response Status: ${res.statusCode}`);
      console.log(`📋 Response Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log(`📄 Response Body:`, parsedData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          console.log(`📄 Response Body (raw):`, responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error:`, error);
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

async function debugAuthIssue() {
  console.log('🔬 Debug Authentication Issue');
  console.log('='.repeat(50));
  console.log('📍 API Base URL:', API_BASE_URL);
  
  try {
    // Step 1: Test login and examine the token
    console.log('\n1️⃣ Testing login and token structure...');
    const loginResponse = await makeRequest(
      `${API_BASE_URL}/auth/login`, 
      { method: 'POST' }, 
      TEST_CREDENTIALS
    );
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed - cannot proceed');
      return;
    }
    
    const authToken = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    
    console.log('\n🔍 TOKEN ANALYSIS:');
    console.log('Token length:', authToken ? authToken.length : 'N/A');
    console.log('Token format:', authToken ? authToken.substring(0, 20) + '...' : 'N/A');
    console.log('User ID:', userId);
    console.log('User data:', loginResponse.data.user);
    
    // Check if it's a JWT token
    if (authToken && authToken.includes('.')) {
      const parts = authToken.split('.');
      console.log('JWT parts count:', parts.length);
      if (parts.length === 3) {
        try {
          const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('JWT Header:', header);
          console.log('JWT Payload:', payload);
          console.log('JWT Expiry:', new Date(payload.exp * 1000).toISOString());
        } catch (e) {
          console.log('❌ Failed to decode JWT:', e.message);
        }
      }
    } else {
      console.log('⚠️ Token does not appear to be JWT format');
    }
    
    // Step 2: Test with a simple protected endpoint first
    console.log('\n2️⃣ Testing simple protected endpoint (health check)...');
    try {
      const healthResponse = await makeRequest(
        `${API_BASE_URL}/health`,
        { 
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );
      console.log('Health check response:', healthResponse.statusCode);
    } catch (e) {
      console.log('Health check failed:', e.message);
    }
    
    // Step 3: Test user profile endpoint with detailed debugging
    console.log('\n3️⃣ Testing user profile endpoint with debugging...');
    
    // First try with the user ID from login response
    const profileResponse = await makeRequest(
      `${API_BASE_URL}/users/${userId}`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    if (profileResponse.statusCode === 401) {
      console.log('\n🔍 401 Error Analysis:');
      console.log('Response:', profileResponse.data);
      
      // Try different token formats
      console.log('\n4️⃣ Testing different auth header formats...');
      
      const formats = [
        `Bearer ${authToken}`,
        `${authToken}`,
        `Token ${authToken}`,
        `JWT ${authToken}`
      ];
      
      for (const format of formats) {
        console.log(`\n🧪 Testing format: "${format.substring(0, 20)}..."`);
        try {
          const testResponse = await makeRequest(
            `${API_BASE_URL}/users/${userId}`,
            { 
              method: 'GET',
              headers: { 'Authorization': format }
            }
          );
          console.log(`Result: ${testResponse.statusCode}`);
          if (testResponse.statusCode === 200) {
            console.log('✅ This format works!');
            break;
          }
        } catch (e) {
          console.log(`Error: ${e.message}`);
        }
      }
      
      // Step 5: Check if there's a mismatch between production and development APIs
      console.log('\n5️⃣ Testing local emulator (if running)...');
      try {
        const localLoginResponse = await makeRequest(
          'http://127.0.0.1:5001/qr-restaurant-api/europe-west1/api/v1/auth/login',
          { method: 'POST' }, 
          TEST_CREDENTIALS
        );
        console.log('Local emulator login status:', localLoginResponse.statusCode);
        
        if (localLoginResponse.statusCode === 200) {
          console.log('🔍 Local emulator is working - this might be the issue!');
          console.log('The application might still be configured to use local emulator');
        }
      } catch (e) {
        console.log('Local emulator not accessible (this is expected if not running)');
      }
      
    } else {
      console.log('✅ Profile fetch successful!');
    }
    
    // Final diagnosis
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(50));
    
    if (profileResponse.statusCode === 401) {
      console.log('❌ ISSUE CONFIRMED: Authentication is failing');
      console.log('\n🔍 POSSIBLE CAUSES:');
      console.log('1. The React application is still using cached old API configuration');
      console.log('2. The token format is incompatible between login and profile endpoints');
      console.log('3. There might be CORS or security header issues');
      console.log('4. The backend expects a different token format');
      console.log('5. Session/token validation logic has changed');
      
      console.log('\n💡 RECOMMENDED SOLUTIONS:');
      console.log('1. Clear browser cache and localStorage');
      console.log('2. Check if React app is reading environment variables correctly');
      console.log('3. Verify CORS settings on the API');
      console.log('4. Check if there are multiple authentication mechanisms');
      console.log('5. Compare working vs non-working requests in network tab');
      
    } else {
      console.log('🎉 SUCCESS: Authentication is working correctly!');
      console.log('✅ The .env.local fix appears to be working');
    }
    
  } catch (error) {
    console.error('💥 Debug Error:', error.message);
  }
}

// Check if we should test React environment variable loading
async function checkReactEnvLoading() {
  console.log('\n🔧 Testing React Environment Variable Loading...');
  
  // Create a simple test file to check what React sees
  const testScript = `
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All REACT_APP vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
  `;
  
  // Write to public folder so it can be served
  require('fs').writeFileSync('/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/admin-portal/public/env-test.js', testScript);
  
  console.log('✅ Created env-test.js in public folder');
  console.log('📝 Visit http://localhost:3002/env-test.js to see what React sees');
}

// Run the debug
if (require.main === module) {
  debugAuthIssue().then(() => {
    checkReactEnvLoading();
  });
}

module.exports = { debugAuthIssue };