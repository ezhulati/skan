#!/usr/bin/env node

// Test Runner for Enterprise Order Management System
// Executes comprehensive testing suite and generates detailed reports

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class EnterpriseTestRunner {
    constructor() {
        this.testResults = {
            startTime: new Date(),
            endTime: null,
            duration: 0,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            categories: {
                api: { passed: 0, failed: 0, skipped: 0 },
                frontend: { passed: 0, failed: 0, skipped: 0 },
                performance: { passed: 0, failed: 0, skipped: 0 },
                integration: { passed: 0, failed: 0, skipped: 0 },
                security: { passed: 0, failed: 0, skipped: 0 }
            },
            errors: [],
            warnings: [],
            recommendations: []
        };
        
        this.config = {
            timeout: 120000, // 2 minutes per test
            retries: 2,
            parallel: false, // Run sequentially for better error tracking
            outputDir: path.join(__dirname, 'results'),
            verbose: true
        };
    }

    // Main test execution
    async runAllTests() {
        console.log('🚀 Starting Enterprise Order Management System Tests\n');
        console.log('========================================================');
        
        try {
            this.setupTestEnvironment();
            await this.validateTestPrerequisites();
            await this.executeTestSuite();
            this.generateReport();
            this.analyzeResults();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            this.testResults.errors.push({
                type: 'execution_error',
                message: error.message,
                timestamp: new Date()
            });
        } finally {
            this.testResults.endTime = new Date();
            this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
            this.saveResults();
        }
    }

    // Setup test environment
    setupTestEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        // Create output directory
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }

        // Check for required dependencies
        const requiredPackages = ['@playwright/test'];
        const missingPackages = [];

        for (const pkg of requiredPackages) {
            try {
                require.resolve(pkg);
            } catch (error) {
                missingPackages.push(pkg);
            }
        }

        if (missingPackages.length > 0) {
            console.log(`📦 Installing missing packages: ${missingPackages.join(', ')}`);
            try {
                execSync(`npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
            } catch (error) {
                this.testResults.warnings.push({
                    type: 'dependency_warning',
                    message: `Could not install packages: ${missingPackages.join(', ')}`,
                    suggestion: 'Please install manually if tests fail'
                });
            }
        }

        console.log('✅ Test environment setup complete\n');
    }

    // Validate prerequisites
    async validateTestPrerequisites() {
        console.log('🔍 Validating test prerequisites...');
        
        const checks = [
            this.checkApiAvailability(),
            this.checkTestCredentials(),
            this.checkTestVenue()
        ];

        const results = await Promise.allSettled(checks);
        
        results.forEach((result, index) => {
            const checkNames = ['API Availability', 'Test Credentials', 'Test Venue'];
            if (result.status === 'fulfilled') {
                console.log(`✅ ${checkNames[index]}: OK`);
            } else {
                console.log(`⚠️ ${checkNames[index]}: ${result.reason}`);
                this.testResults.warnings.push({
                    type: 'prerequisite_warning',
                    check: checkNames[index],
                    message: result.reason
                });
            }
        });

        console.log('✅ Prerequisites validation complete\n');
    }

    // Check API availability
    async checkApiAvailability() {
        const apiUrl = process.env.API_BASE_URL || 'https://api-mkazmlu7ta-ew.a.run.app';
        
        try {
            const response = await fetch(`${apiUrl}/health`);
            if (response.ok) {
                return 'API is available';
            } else {
                throw new Error(`API returned status ${response.status}`);
            }
        } catch (error) {
            throw new Error(`API not available: ${error.message}`);
        }
    }

    // Check test credentials
    async checkTestCredentials() {
        const email = 'manager_email1@gmail.com';
        const password = 'admin123';
        const apiUrl = process.env.API_BASE_URL || 'https://api-mkazmlu7ta-ew.a.run.app';
        
        try {
            const response = await fetch(`${apiUrl}/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                return 'Test credentials are valid';
            } else {
                throw new Error(`Login failed with status ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Credential check failed: ${error.message}`);
        }
    }

    // Check test venue
    async checkTestVenue() {
        const venueId = 'beach-bar-durres';
        const apiUrl = process.env.API_BASE_URL || 'https://api-mkazmlu7ta-ew.a.run.app';
        
        try {
            const response = await fetch(`${apiUrl}/v1/venue/${venueId}/menu`);
            if (response.ok) {
                return 'Test venue is available';
            } else {
                throw new Error(`Venue not found: status ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Venue check failed: ${error.message}`);
        }
    }

    // Execute the main test suite
    async executeTestSuite() {
        console.log('🧪 Executing test suite...\n');
        
        const testFile = path.join(__dirname, 'enterprise-order-system.test.js');
        
        try {
            // Run Playwright tests
            const command = `npx playwright test ${testFile} --reporter=json`;
            const result = execSync(command, { 
                encoding: 'utf8',
                timeout: this.config.timeout * 10, // Allow time for all tests
                stdio: 'pipe'
            });
            
            this.parseTestResults(result);
            
        } catch (error) {
            // Even if tests fail, we want to capture the output
            if (error.stdout) {
                this.parseTestResults(error.stdout);
            }
            
            this.testResults.errors.push({
                type: 'test_execution_error',
                message: error.message,
                output: error.stdout || error.stderr
            });
        }
    }

    // Parse test results from Playwright output
    parseTestResults(output) {
        try {
            const results = JSON.parse(output);
            
            if (results.suites) {
                results.suites.forEach(suite => {
                    suite.specs.forEach(spec => {
                        this.testResults.totalTests++;
                        
                        const category = this.categorizeTest(spec.title);
                        
                        if (spec.ok) {
                            this.testResults.passedTests++;
                            this.testResults.categories[category].passed++;
                        } else {
                            this.testResults.failedTests++;
                            this.testResults.categories[category].failed++;
                            
                            this.testResults.errors.push({
                                type: 'test_failure',
                                test: spec.title,
                                category: category,
                                error: spec.tests[0]?.results[0]?.error?.message
                            });
                        }
                    });
                });
            }
        } catch (error) {
            // Fallback parsing for non-JSON output
            this.parseTextResults(output);
        }
    }

    // Fallback text parsing
    parseTextResults(output) {
        const lines = output.split('\n');
        let category = 'api';
        
        lines.forEach(line => {
            if (line.includes('Enterprise Order Management API Tests')) {
                category = 'api';
            } else if (line.includes('Enterprise Dashboard Frontend Tests')) {
                category = 'frontend';
            } else if (line.includes('Performance and Load Tests')) {
                category = 'performance';
            } else if (line.includes('System Integration Tests')) {
                category = 'integration';
            } else if (line.includes('Security Tests')) {
                category = 'security';
            }
            
            if (line.includes('✅')) {
                this.testResults.totalTests++;
                this.testResults.passedTests++;
                this.testResults.categories[category].passed++;
            } else if (line.includes('❌') || line.includes('FAIL')) {
                this.testResults.totalTests++;
                this.testResults.failedTests++;
                this.testResults.categories[category].failed++;
            }
        });
    }

    // Categorize test by title
    categorizeTest(title) {
        if (title.toLowerCase().includes('api')) return 'api';
        if (title.toLowerCase().includes('frontend') || title.toLowerCase().includes('dashboard')) return 'frontend';
        if (title.toLowerCase().includes('performance') || title.toLowerCase().includes('load')) return 'performance';
        if (title.toLowerCase().includes('integration')) return 'integration';
        if (title.toLowerCase().includes('security')) return 'security';
        return 'api'; // default
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        
        const passRate = this.testResults.totalTests > 0 
            ? ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)
            : 0;
        
        console.log(`Total Tests: ${this.testResults.totalTests}`);
        console.log(`Passed: ${this.testResults.passedTests} (${passRate}%)`);
        console.log(`Failed: ${this.testResults.failedTests}`);
        console.log(`Duration: ${(this.testResults.duration / 1000).toFixed(1)}s`);
        
        console.log('\n📈 Results by Category:');
        Object.entries(this.testResults.categories).forEach(([category, results]) => {
            const total = results.passed + results.failed + results.skipped;
            if (total > 0) {
                const rate = ((results.passed / total) * 100).toFixed(1);
                console.log(`  ${category.toUpperCase()}: ${results.passed}/${total} (${rate}%)`);
            }
        });
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.testResults.errors.slice(0, 5).forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.message}`);
            });
            if (this.testResults.errors.length > 5) {
                console.log(`  ... and ${this.testResults.errors.length - 5} more errors`);
            }
        }
        
        if (this.testResults.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.testResults.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning.message}`);
            });
        }
    }

    // Analyze results and provide recommendations
    analyzeResults() {
        console.log('\n🔍 Analysis & Recommendations');
        console.log('===============================');
        
        const passRate = this.testResults.totalTests > 0 
            ? (this.testResults.passedTests / this.testResults.totalTests) * 100
            : 0;
        
        if (passRate >= 90) {
            console.log('🎉 Excellent! System is ready for production');
            this.testResults.recommendations.push('System shows excellent stability and functionality');
        } else if (passRate >= 75) {
            console.log('✅ Good! Minor issues need attention');
            this.testResults.recommendations.push('Address failing tests before production deployment');
        } else if (passRate >= 50) {
            console.log('⚠️ Moderate issues detected');
            this.testResults.recommendations.push('Significant testing failures require investigation');
        } else {
            console.log('❌ Critical issues detected');
            this.testResults.recommendations.push('System not ready for production - major fixes required');
        }
        
        // Category-specific recommendations
        Object.entries(this.testResults.categories).forEach(([category, results]) => {
            const total = results.passed + results.failed + results.skipped;
            if (total > 0) {
                const rate = (results.passed / total) * 100;
                
                if (rate < 80) {
                    switch (category) {
                        case 'api':
                            this.testResults.recommendations.push('API endpoints need stability improvements');
                            break;
                        case 'frontend':
                            this.testResults.recommendations.push('Frontend components need UI/UX fixes');
                            break;
                        case 'performance':
                            this.testResults.recommendations.push('Performance optimization required');
                            break;
                        case 'integration':
                            this.testResults.recommendations.push('System integration issues need resolution');
                            break;
                        case 'security':
                            this.testResults.recommendations.push('Security vulnerabilities must be addressed');
                            break;
                    }
                }
            }
        });
        
        // Performance recommendations
        if (this.testResults.duration > 60000) { // Over 1 minute
            this.testResults.recommendations.push('Consider optimizing test execution time');
        }
        
        this.testResults.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }

    // Save results to file
    saveResults() {
        const resultsFile = path.join(this.config.outputDir, `test-results-${Date.now()}.json`);
        const htmlFile = path.join(this.config.outputDir, `test-report-${Date.now()}.html`);
        
        // Save JSON results
        fs.writeFileSync(resultsFile, JSON.stringify(this.testResults, null, 2));
        
        // Generate HTML report
        const htmlReport = this.generateHtmlReport();
        fs.writeFileSync(htmlFile, htmlReport);
        
        console.log(`\n📄 Results saved to: ${resultsFile}`);
        console.log(`📄 HTML report: ${htmlFile}`);
    }

    // Generate HTML report
    generateHtmlReport() {
        const passRate = this.testResults.totalTests > 0 
            ? ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)
            : 0;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Enterprise Order Management System - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .categories { margin: 20px 0; }
        .category { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .recommendations { background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .errors { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Enterprise Order Management System</h1>
        <h2>Test Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Duration: ${(this.testResults.duration / 1000).toFixed(1)} seconds</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${this.testResults.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value passed">${this.testResults.passedTests}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value failed">${this.testResults.failedTests}</div>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <div class="value">${passRate}%</div>
        </div>
    </div>
    
    <div class="categories">
        <h3>Results by Category</h3>
        ${Object.entries(this.testResults.categories).map(([category, results]) => {
            const total = results.passed + results.failed + results.skipped;
            const rate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
            return `
                <div class="category">
                    <strong>${category.toUpperCase()}</strong>: 
                    ${results.passed}/${total} passed (${rate}%)
                </div>
            `;
        }).join('')}
    </div>
    
    ${this.testResults.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
                ${this.testResults.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    ` : ''}
    
    ${this.testResults.errors.length > 0 ? `
        <div class="errors">
            <h3>Errors</h3>
            <ul>
                ${this.testResults.errors.map(error => `<li><strong>${error.type}</strong>: ${error.message}</li>`).join('')}
            </ul>
        </div>
    ` : ''}
</body>
</html>
        `;
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new EnterpriseTestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = EnterpriseTestRunner;