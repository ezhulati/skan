const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 SKAN.AL COMPREHENSIVE TEST SUITE');
console.log('===================================');
console.log('Running all user flow tests...\n');

const testSuite = [
  {
    name: 'Customer Menu Browsing',
    script: 'test-customer-menu-browsing.cjs',
    description: 'Tests customer menu viewing, language switching, and cart simulation'
  },
  {
    name: 'Customer-Restaurant Order Flow',
    script: 'test-customer-restaurant-flow.cjs',
    description: 'Tests complete order lifecycle from customer to restaurant'
  },
  {
    name: 'Order Management Flow',
    script: 'test-order-management-flow.cjs',
    description: 'Tests restaurant manager order processing and status updates'
  },
  {
    name: 'User Management Flow',
    script: 'test-user-management-flow.cjs',
    description: 'Tests user invitation, creation, management, and permissions'
  },
  {
    name: 'Onboarding Flow',
    script: 'test-onboarding-flow.cjs',
    description: 'Tests restaurant owner onboarding and setup process'
  }
];

async function runAllTests() {
  const results = {
    total: testSuite.length,
    passed: 0,
    failed: 0,
    errors: [],
    details: []
  };

  console.log(`📋 Running ${testSuite.length} test suites...\n`);

  for (let i = 0; i < testSuite.length; i++) {
    const test = testSuite[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST ${i + 1}/${testSuite.length}: ${test.name}`);
    console.log(`📄 ${test.description}`);
    console.log(`📁 ${test.script}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();

    try {
      // Check if test file exists
      const testPath = path.join(__dirname, test.script);
      if (!fs.existsSync(testPath)) {
        throw new Error(`Test file not found: ${test.script}`);
      }

      // Run the test
      const output = execSync(`node "${testPath}"`, {
        encoding: 'utf8',
        stdio: 'inherit',
        timeout: 60000 // 60 second timeout per test
      });

      const duration = Date.now() - startTime;
      
      console.log(`\n✅ ${test.name} PASSED (${duration}ms)`);
      
      results.passed++;
      results.details.push({
        name: test.name,
        status: 'PASSED',
        duration: duration,
        error: null
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`\n❌ ${test.name} FAILED (${duration}ms)`);
      console.error(`Error: ${error.message}`);
      
      results.failed++;
      results.errors.push({
        test: test.name,
        error: error.message
      });
      results.details.push({
        name: test.name,
        status: 'FAILED',
        duration: duration,
        error: error.message
      });
    }

    // Add delay between tests
    if (i < testSuite.length - 1) {
      console.log('\n⏱️  Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

function generateTestReport(results) {
  console.log('\n\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('=============================');

  // Overall summary
  console.log(`\n📈 SUMMARY:`);
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  // Detailed results
  console.log(`\n📋 DETAILED RESULTS:`);
  for (const detail of results.details) {
    const status = detail.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${detail.name} (${detail.duration}ms)`);
    if (detail.error) {
      console.log(`   Error: ${detail.error}`);
    }
  }

  // Failed tests summary
  if (results.failed > 0) {
    console.log(`\n🚨 FAILED TESTS:`);
    for (const error of results.errors) {
      console.log(`❌ ${error.test}`);
      console.log(`   ${error.error}`);
    }
  }

  // Coverage analysis
  console.log(`\n🎯 TEST COVERAGE ANALYSIS:`);
  console.log(`✅ Customer Experience Tests: ${results.details.filter(d => d.name.includes('Customer')).length}/2`);
  console.log(`✅ Restaurant Management Tests: ${results.details.filter(d => d.name.includes('Order') || d.name.includes('User')).length}/2`);
  console.log(`✅ Onboarding Tests: ${results.details.filter(d => d.name.includes('Onboarding')).length}/1`);

  // Performance analysis
  const totalDuration = results.details.reduce((sum, detail) => sum + detail.duration, 0);
  const avgDuration = totalDuration / results.details.length;
  console.log(`\n⏱️  PERFORMANCE:`);
  console.log(`Total Execution Time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
  console.log(`Average Test Duration: ${avgDuration.toFixed(0)}ms`);

  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (results.failed === 0) {
    console.log(`🎉 All tests passed! The SKAN.AL system is fully functional.`);
    console.log(`🔄 Continue running these tests regularly to maintain quality.`);
    console.log(`📈 Consider adding more edge case testing.`);
  } else {
    console.log(`🔧 Fix failing tests before deploying to production.`);
    console.log(`🐛 Investigate root causes of failures.`);
    console.log(`🔄 Re-run tests after fixes.`);
  }

  // System health
  console.log(`\n🏥 SYSTEM HEALTH:`);
  if (results.passed >= results.total * 0.8) {
    console.log(`💚 System Health: GOOD (${results.passed}/${results.total} tests passing)`);
  } else if (results.passed >= results.total * 0.6) {
    console.log(`💛 System Health: FAIR (${results.passed}/${results.total} tests passing)`);
  } else {
    console.log(`❤️  System Health: POOR (${results.passed}/${results.total} tests passing)`);
  }

  return results;
}

// 🚀 Run the complete test suite
runAllTests()
  .then(generateTestReport)
  .then(results => {
    console.log('\n' + '='.repeat(60));
    
    if (results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED - SKAN.AL SYSTEM IS FULLY FUNCTIONAL! 🎉');
      process.exit(0);
    } else {
      console.log(`💥 ${results.failed} TESTS FAILED - SYSTEM NEEDS ATTENTION 💥`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 TEST SUITE EXECUTION FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });