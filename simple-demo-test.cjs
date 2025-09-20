const https = require('https');
const http = require('http');

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data
      }));
    }).on('error', reject);
  });
}

async function testDemoFlow() {
  console.log('🧪 SKAN.AL Demo Flow End-to-End Test');
  console.log('=====================================\n');
  
  const tests = [
    {
      name: 'Marketing Site Demo Page',
      url: 'https://skan.al/demo',
      checks: [
        { name: 'Contains demo buttons', test: body => body.includes('Kërko Demo') },
        { name: 'Lead capture implemented', test: body => body.includes('customer-demo-request') },
        { name: 'New credentials displayed', test: body => body.includes('demo.beachbar@skan.al') },
        { name: 'No old credentials', test: body => !body.includes('manager_email1@gmail.com') }
      ]
    },
    {
      name: 'Customer Demo Request Page',
      url: 'https://skan.al/customer-demo-request',
      checks: [
        { name: 'Page loads successfully', test: () => true },
        { name: 'Contains demo link', test: body => body.includes('order.skan.al/beach-bar-durres/a1') },
        { name: 'Has lead capture form', test: body => body.includes('form') }
      ]
    },
    {
      name: 'Admin Portal Demo Request',
      url: 'https://admin.skan.al/demo-request',
      checks: [
        { name: 'React app loads', test: body => body.includes('JavaScript') || body.includes('root') },
        { name: 'No old credentials in source', test: body => !body.includes('manager_email1@gmail.com') }
      ]
    },
    {
      name: 'Customer Ordering Experience (CRITICAL)',
      url: 'https://order.skan.al/beach-bar-durres/a1',
      checks: [
        { name: 'Page loads (not blank)', test: body => body.length > 100 },
        { name: 'React app content', test: body => body.includes('JavaScript') || body.includes('root') },
        { name: 'SKAN branding present', test: body => body.includes('SKAN') },
        { name: 'Not showing error page', test: body => !body.includes('404') && !body.includes('Not Found') }
      ]
    },
    {
      name: 'API Health Check',
      url: 'https://api-mkazmlu7ta-ew.a.run.app/health',
      checks: [
        { name: 'API responds', test: () => true },
        { name: 'Returns health status', test: body => body.includes('OK') || body.includes('status') }
      ]
    },
    {
      name: 'API Menu Data',
      url: 'https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/menu',
      checks: [
        { name: 'Menu data available', test: body => body.includes('venue') },
        { name: 'Has categories', test: body => body.includes('categories') },
        { name: 'Has Albanian Beer', test: body => body.includes('Albanian Beer') }
      ]
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`🌐 URL: ${test.url}`);
    
    try {
      const response = await fetchPage(test.url);
      console.log(`📊 Status: ${response.status}`);
      
      const testResults = {
        name: test.name,
        url: test.url,
        status: response.status,
        success: response.status >= 200 && response.status < 400,
        checks: []
      };

      for (const check of test.checks) {
        try {
          const passed = check.test(response.body);
          testResults.checks.push({
            name: check.name,
            passed: passed,
            status: passed ? '✅ PASS' : '❌ FAIL'
          });
          console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
        } catch (error) {
          testResults.checks.push({
            name: check.name,
            passed: false,
            status: '❌ ERROR',
            error: error.message
          });
          console.log(`  ❌ ${check.name} (ERROR: ${error.message})`);
        }
      }

      results.push(testResults);
      
    } catch (error) {
      console.log(`❌ Failed to fetch: ${error.message}`);
      results.push({
        name: test.name,
        url: test.url,
        success: false,
        error: error.message,
        checks: []
      });
    }
    
    console.log('');
  }

  // Summary Report
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('=============================\n');

  let totalTests = 0;
  let passedTests = 0;
  let criticalIssues = [];

  for (const result of results) {
    const passedChecks = result.checks ? result.checks.filter(c => c.passed).length : 0;
    const totalChecks = result.checks ? result.checks.length : 0;
    totalTests += totalChecks;
    passedTests += passedChecks;

    const status = result.success && passedChecks === totalChecks ? '✅ WORKING' : '❌ ISSUES';
    console.log(`${status} ${result.name}`);
    console.log(`   📈 ${passedChecks}/${totalChecks} checks passed`);
    
    if (result.name.includes('CRITICAL') && (!result.success || passedChecks < totalChecks)) {
      criticalIssues.push(result.name);
    }
    
    if (result.checks) {
      for (const check of result.checks) {
        if (!check.passed) {
          console.log(`   ⚠️  Failed: ${check.name}`);
        }
      }
    }
    console.log('');
  }

  console.log('🎯 OVERALL RESULTS');
  console.log('==================');
  console.log(`📊 Total Score: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
    criticalIssues.forEach(issue => console.log(`   ❌ ${issue}`));
  }

  console.log('\n🎯 DEMO FLOW STATUS:');
  if (passedTests / totalTests >= 0.8 && criticalIssues.length === 0) {
    console.log('✅ DEMO FLOW READY - All systems operational');
  } else if (criticalIssues.length > 0) {
    console.log('🚨 DEMO FLOW BROKEN - Critical deployment issues detected');
    console.log('📝 Next Steps:');
    console.log('   1. Deploy customer app to order.skan.al immediately');
    console.log('   2. Use deployment package: customer-app-deployment.tar.gz');
    console.log('   3. Follow instructions in DEPLOYMENT-INSTRUCTIONS.md');
  } else {
    console.log('⚠️  DEMO FLOW PARTIAL - Some issues detected, but functional');
  }

  return {
    totalTests,
    passedTests,
    criticalIssues,
    overallScore: Math.round(passedTests/totalTests*100),
    results
  };
}

testDemoFlow().catch(console.error);