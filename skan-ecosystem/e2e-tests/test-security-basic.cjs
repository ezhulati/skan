const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';

console.log('\n🔒 TESTING BASIC SECURITY MEASURES');
console.log('=================================');

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
          const parsed = data ? JSON.parse(data) : {};
          resolve({ 
            data: parsed, 
            statusCode: res.statusCode,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            data: data,
            statusCode: res.statusCode,
            headers: res.headers
          });
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

async function testSecurityMeasures() {
  try {
    console.log('\n🔐 STEP 1: Testing authentication requirements');
    
    // Test accessing protected endpoint without auth
    const noAuthResponse = await makeRequest('/users');
    const authRequiredTest = noAuthResponse.statusCode === 401;
    console.log(`${authRequiredTest ? '✅' : '❌'} Protected endpoint requires auth: ${noAuthResponse.statusCode} (expected: 401)`);
    
    // Get valid token for further tests
    console.log('\n🔑 STEP 2: Getting valid authentication token');
    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'manager_email1@gmail.com',
        password: 'demo123'
      }
    });
    
    const loginSuccessful = loginResponse.statusCode === 200;
    console.log(`${loginSuccessful ? '✅' : '❌'} Valid login returns 200: ${loginResponse.statusCode}`);
    
    if (!loginSuccessful) {
      throw new Error('Cannot obtain valid token for security tests');
    }
    
    const validToken = loginResponse.data.token;
    const userRole = loginResponse.data.user.role;
    console.log(`🎫 Token obtained for user role: ${userRole}`);
    
    console.log('\n🛡️  STEP 3: Testing invalid token rejection');
    
    // Test with invalid token
    const invalidTokenResponse = await makeRequest('/users', {
      headers: { 'Authorization': 'Bearer invalid-token-12345' }
    });
    const invalidTokenRejected = invalidTokenResponse.statusCode === 401;
    console.log(`${invalidTokenRejected ? '✅' : '❌'} Invalid token rejected: ${invalidTokenResponse.statusCode} (expected: 401)`);
    
    console.log('\n🔒 STEP 4: Testing password validation');
    
    // Test login with invalid credentials
    const invalidLoginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'manager_email1@gmail.com',
        password: 'wrongpassword'
      }
    });
    const invalidCredsRejected = invalidLoginResponse.statusCode === 401;
    console.log(`${invalidCredsRejected ? '✅' : '❌'} Invalid credentials rejected: ${invalidLoginResponse.statusCode} (expected: 401)`);
    
    console.log('\n👥 STEP 5: Testing role-based access control');
    
    // Test accessing with valid token
    const authorizedResponse = await makeRequest('/users', {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const authorizedAccess = authorizedResponse.statusCode === 200;
    console.log(`${authorizedAccess ? '✅' : '❌'} Valid token allows access: ${authorizedResponse.statusCode} (expected: 200)`);
    
    console.log('\n🧪 STEP 6: Testing SQL injection protection');
    
    // Test potential SQL injection in login
    const sqlInjectionResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: "admin@test.com' OR '1'='1",
        password: "anything"
      }
    });
    const sqlInjectionBlocked = sqlInjectionResponse.statusCode === 401;
    console.log(`${sqlInjectionBlocked ? '✅' : '❌'} SQL injection attempt blocked: ${sqlInjectionResponse.statusCode} (expected: 401)`);
    
    console.log('\n🌐 STEP 7: Testing CORS headers');
    
    const corsResponse = await makeRequest('/venue/beach-bar-durres/menu');
    const corsHeaders = corsResponse.headers['access-control-allow-origin'];
    const corsConfigured = corsHeaders !== undefined;
    console.log(`${corsConfigured ? '✅' : '❌'} CORS headers present: ${corsConfigured ? 'Yes' : 'No'}`);
    
    // Compile results
    const tests = [
      { name: 'Auth Required for Protected Endpoints', passed: authRequiredTest },
      { name: 'Valid Login Returns 200', passed: loginSuccessful },
      { name: 'Invalid Token Rejected', passed: invalidTokenRejected },
      { name: 'Invalid Credentials Rejected', passed: invalidCredsRejected },
      { name: 'Valid Token Allows Access', passed: authorizedAccess },
      { name: 'SQL Injection Protection', passed: sqlInjectionBlocked },
      { name: 'CORS Headers Present', passed: corsConfigured }
    ];
    
    console.log('\n🔒 SECURITY TEST SUMMARY');
    console.log('========================');
    
    let passedTests = 0;
    for (const test of tests) {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}: ${test.passed ? 'PASS' : 'FAIL'}`);
      if (test.passed) passedTests++;
    }
    
    const overallStatus = passedTests === tests.length ? 'PASS' : 'FAIL';
    console.log(`\n🛡️  Overall Security: ${overallStatus} (${passedTests}/${tests.length} tests passed)`);
    
    if (passedTests < tests.length) {
      console.log('\n⚠️  Security Issues Found:');
      for (const test of tests) {
        if (!test.passed) {
          console.log(`   • ${test.name}`);
        }
      }
    }
    
    return {
      success: overallStatus === 'PASS',
      passedTests,
      totalTests: tests.length,
      tests
    };
    
  } catch (error) {
    console.error('\n❌ SECURITY TEST FAILED:', error.message);
    throw error;
  }
}

// 🚀 Run the test
testSecurityMeasures()
  .then(result => {
    console.log('\n📊 SECURITY TEST COMPLETE');
    console.log(`Success: ${result.success}`);
    console.log(`Passed: ${result.passedTests}/${result.totalTests}`);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 SECURITY TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });
