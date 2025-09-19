const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';

console.log('\n⚡ TESTING BASIC PERFORMANCE METRICS');
console.log('===================================');

async function makeRequest(path, options = {}) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    
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
        const duration = Date.now() - startTime;
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ data: parsed, duration, statusCode: res.statusCode });
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

async function testApiPerformance() {
  try {
    console.log('\n🏃‍♂️ STEP 1: Testing API response times');
    
    const tests = [
      { name: 'Menu Loading', path: '/venue/beach-bar-durres/menu', target: 500 },
      { name: 'Login Request', path: '/auth/login', method: 'POST', body: { email: 'manager_email1@gmail.com', password: 'admin123' }, target: 500 },
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`\n📊 Testing ${test.name}...`);
      
      const response = await makeRequest(test.path, {
        method: test.method,
        body: test.body
      });
      
      const status = response.duration <= test.target ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}: ${response.duration}ms (target: ${test.target}ms)`);
      
      results.push({
        name: test.name,
        duration: response.duration,
        target: test.target,
        status: response.duration <= test.target ? 'PASS' : 'FAIL'
      });
    }
    
    console.log('\n🏎️  STEP 2: Concurrent load testing (10 requests)');
    
    const concurrentTests = [];
    for (let i = 0; i < 10; i++) {
      concurrentTests.push(makeRequest('/venue/beach-bar-durres/menu'));
    }
    
    const concurrentResults = await Promise.all(concurrentTests);
    const avgConcurrentTime = concurrentResults.reduce((sum, result) => sum + result.duration, 0) / concurrentResults.length;
    const maxConcurrentTime = Math.max(...concurrentResults.map(r => r.duration));
    
    console.log(`✅ 10 concurrent requests completed`);
    console.log(`Average response time: ${avgConcurrentTime.toFixed(0)}ms`);
    console.log(`Maximum response time: ${maxConcurrentTime}ms`);
    
    const concurrentStatus = maxConcurrentTime <= 1000 ? 'PASS' : 'FAIL';
    console.log(`${concurrentStatus === 'PASS' ? '✅' : '❌'} Concurrent load test: ${concurrentStatus} (max: ${maxConcurrentTime}ms, target: <1000ms)`);
    
    results.push({
      name: 'Concurrent Load (10 req)',
      duration: maxConcurrentTime,
      target: 1000,
      status: concurrentStatus
    });
    
    console.log('\n🎉 PERFORMANCE TEST SUMMARY');
    console.log('===========================');
    
    let passedTests = 0;
    for (const result of results) {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.duration}ms (target: ${result.target}ms)`);
      if (result.status === 'PASS') passedTests++;
    }
    
    const overallStatus = passedTests === results.length ? 'PASS' : 'FAIL';
    console.log(`\n🏆 Overall Performance: ${overallStatus} (${passedTests}/${results.length} tests passed)`);
    
    return {
      success: overallStatus === 'PASS',
      results,
      passedTests,
      totalTests: results.length,
      avgConcurrentTime,
      maxConcurrentTime
    };
    
  } catch (error) {
    console.error('\n❌ PERFORMANCE TEST FAILED:', error.message);
    throw error;
  }
}

// 🚀 Run the test
testApiPerformance()
  .then(result => {
    console.log('\n📊 PERFORMANCE TEST COMPLETE');
    console.log(`Success: ${result.success}`);
    console.log(`Passed: ${result.passedTests}/${result.totalTests}`);
    console.log(`Avg Concurrent: ${result.avgConcurrentTime.toFixed(0)}ms`);
    console.log(`Max Concurrent: ${result.maxConcurrentTime}ms`);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 PERFORMANCE TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });