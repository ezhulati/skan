#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 SKAN.AL Puppeteer E2E Test Suite');
console.log('=====================================');

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      testSuites: []
    };
    this.startTime = Date.now();
  }

  async runTests() {
    console.log('📋 Starting comprehensive E2E test execution...\n');

    // Ensure reports directory exists
    this.ensureDirectoriesExist();

    // Check test environment
    await this.checkEnvironment();

    // Run test suites
    const testSuites = [
      {
        name: 'Customer Journey Tests',
        script: 'test:customer',
        description: 'Complete customer QR ordering flow'
      },
      {
        name: 'Restaurant Operations Tests',
        script: 'test:admin',
        description: 'Restaurant admin portal functionality'
      },
      {
        name: 'Onboarding Flow Tests',
        script: 'test:onboarding',
        description: 'Restaurant setup and configuration'
      }
    ];

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    // Generate final report
    this.generateFinalReport();
  }

  ensureDirectoriesExist() {
    const dirs = ['reports', 'reports/screenshots'];
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  async checkEnvironment() {
    console.log('🔍 Checking test environment...');
    
    // Check if we can reach the applications
    const urls = [
      'https://skan.al',
      'https://order.skan.al',
      'https://admin.skan.al',
      'https://api.skan.al/health'
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url);
        console.log(`✅ ${url} - ${response.status}`);
      } catch (error) {
        console.log(`❌ ${url} - ${error.message}`);
      }
    }
    
    console.log('');
  }

  async runTestSuite(suite) {
    console.log(`🧪 Running: ${suite.name}`);
    console.log(`📝 ${suite.description}`);
    console.log('─'.repeat(50));

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const testProcess = spawn('npm', ['run', suite.script], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;
        
        this.results.total++;
        if (success) {
          this.results.passed++;
          console.log(`✅ ${suite.name} completed in ${duration}ms\n`);
        } else {
          this.results.failed++;
          console.log(`❌ ${suite.name} failed after ${duration}ms\n`);
        }

        this.results.testSuites.push({
          name: suite.name,
          success,
          duration,
          exitCode: code
        });

        resolve();
      });

      testProcess.on('error', (error) => {
        console.error(`❌ Error running ${suite.name}:`, error.message);
        this.results.failed++;
        this.results.total++;
        
        this.results.testSuites.push({
          name: suite.name,
          success: false,
          duration: Date.now() - startTime,
          error: error.message
        });
        
        resolve();
      });
    });
  }

  generateFinalReport() {
    const totalDuration = Date.now() - this.startTime;
    const successRate = this.results.total > 0 ? 
      ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;

    console.log('📊 FINAL TEST RESULTS');
    console.log('=====================');
    console.log(`Total Test Suites: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log('');

    // Detailed results
    console.log('📋 Test Suite Details:');
    this.results.testSuites.forEach(suite => {
      const status = suite.success ? '✅' : '❌';
      const duration = (suite.duration / 1000).toFixed(1);
      console.log(`${status} ${suite.name} (${duration}s)`);
      if (suite.error) {
        console.log(`   Error: ${suite.error}`);
      }
    });

    // Save results to file
    const reportPath = path.join(__dirname, '..', 'reports', 'test-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Results saved to: ${reportPath}`);

    // Exit with appropriate code
    if (this.results.failed > 0) {
      console.log('\n❌ Some tests failed. Check the detailed results above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
  }
}

// Run the tests
const runner = new TestRunner();
runner.runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});