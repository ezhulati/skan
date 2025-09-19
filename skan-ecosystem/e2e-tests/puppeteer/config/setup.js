// Global test setup for Puppeteer E2E tests
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Extend Jest timeout for E2E tests
jest.setTimeout(60000);

// Global test utilities
global.testUtils = {
  // Wait for element with timeout
  waitForElement: async (page, selector, timeout = 10000) => {
    try {
      await page.waitForSelector(selector, { timeout, visible: true });
      return true;
    } catch (error) {
      console.error(`Element not found: ${selector}`, error.message);
      return false;
    }
  },

  // Wait for navigation with timeout
  waitForNavigation: async (page, timeout = 10000) => {
    try {
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2', 
        timeout 
      });
      return true;
    } catch (error) {
      console.error('Navigation timeout:', error.message);
      return false;
    }
  },

  // Take screenshot for debugging
  takeScreenshot: async (page, name) => {
    const screenshotsDir = path.join(__dirname, '../reports/screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    
    console.log(`Screenshot saved: ${filepath}`);
    return filepath;
  },

  // Wait for API response
  waitForApiResponse: async (page, urlPattern, timeout = 10000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`API response timeout: ${urlPattern}`));
      }, timeout);

      page.on('response', (response) => {
        if (response.url().includes(urlPattern)) {
          clearTimeout(timer);
          resolve(response);
        }
      });
    });
  },

  // Simulate mobile device
  setMobileViewport: async (page) => {
    await page.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
  },

  // Generate random test data
  generateTestData: () => ({
    customerName: `Test Customer ${Math.floor(Math.random() * 1000)}`,
    email: `test${Date.now()}@example.com`,
    orderNote: `Test order ${Date.now()}`
  })
};

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Create reports directory
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Make puppeteer available globally
global.puppeteer = puppeteer;

console.log('Puppeteer E2E Test Setup Complete');
console.log('Base URLs:', global.BASE_URLS);
console.log('Reports directory:', reportsDir);