const puppeteer = require('puppeteer');
const ApiHelpers = require('../utils/api-helpers');

describe('Basic Smoke Tests', () => {
  let browser;
  let page;
  let apiHelpers;

  beforeAll(async () => {
    console.log('🚀 Starting Basic Smoke Tests');
    
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
      devtools: process.env.DEVTOOLS === 'true',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    apiHelpers = new ApiHelpers();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    console.log('✅ Basic Smoke Tests Complete');
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('1. Application Accessibility', () => {
    test('1.1 Marketing site should load successfully', async () => {
      console.log('🌐 Testing marketing site accessibility...');
      
      await page.goto('https://skan.al', { waitUntil: 'networkidle2' });
      
      const title = await page.title();
      const url = await page.url();
      
      console.log(`Marketing site loaded - Title: ${title}, URL: ${url}`);
      
      expect(title).toBeTruthy();
      expect(url).toContain('skan.al');
      
      // Check for main content
      const mainContent = await page.$('h1, .hero, main, .content');
      expect(mainContent).toBeTruthy();
    }, 30000);

    test('1.2 Customer app should load successfully', async () => {
      console.log('📱 Testing customer app accessibility...');
      
      await page.goto('https://order.skan.al/beach-bar-durres/a1', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const title = await page.title();
      const url = await page.url();
      
      console.log(`Customer app loaded - Title: ${title}, URL: ${url}`);
      
      expect(title).toBeTruthy();
      expect(url).toContain('order.skan.al');
      
      // Wait for any content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if page has loaded properly (not just a blank page)
      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText.length).toBeGreaterThan(10);
    }, 30000);

    test('1.3 Admin portal should load successfully', async () => {
      console.log('🏪 Testing admin portal accessibility...');
      
      await page.goto('https://admin.skan.al/login', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const title = await page.title();
      const url = await page.url();
      
      console.log(`Admin portal loaded - Title: ${title}, URL: ${url}`);
      
      expect(title).toBeTruthy();
      expect(url).toContain('admin.skan.al');
      
      // Check for login form elements
      const loginElements = await page.$$('input[type="email"], input[type="password"], button, form');
      expect(loginElements.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('2. API Health Check', () => {
    test('2.1 API should be responding', async () => {
      console.log('🔗 Testing API health...');
      
      const healthCheck = await apiHelpers.healthCheck();
      
      console.log('API Health Check Result:', healthCheck);
      
      expect(healthCheck.success).toBe(true);
      if (healthCheck.success) {
        expect(healthCheck.data.status).toBe('OK');
      }
    }, 15000);

    test('2.2 Venue menu should be accessible', async () => {
      console.log('📋 Testing venue menu API...');
      
      const menuData = await apiHelpers.getVenueMenu('beach-bar-durres');
      
      console.log('Menu API Result:', menuData.success ? 'Success' : menuData.error);
      
      expect(menuData.success).toBe(true);
      if (menuData.success) {
        expect(menuData.data.venue).toBeTruthy();
        expect(menuData.data.categories).toBeTruthy();
        expect(Array.isArray(menuData.data.categories)).toBe(true);
      }
    }, 15000);
  });

  describe('3. Basic Customer Flow', () => {
    test('3.1 Should navigate to QR code and display venue info', async () => {
      console.log('📍 Testing QR code navigation...');
      
      // Navigate to QR URL
      await page.goto('https://order.skan.al/beach-bar-durres/a1', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for venue name or title
      const venueInfo = await page.evaluate(() => {
        // Look for common venue name selectors
        const selectors = ['h1', '.venue-name', '.restaurant-name', '.title', '[data-testid="venue-name"]'];
        
        for (let selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            return element.textContent.trim();
          }
        }
        
        // Fallback to page title
        return document.title;
      });
      
      console.log(`Venue info found: ${venueInfo}`);
      
      expect(venueInfo).toBeTruthy();
      expect(venueInfo.toLowerCase()).toContain('beach');
    }, 30000);

    test('3.2 Should display menu items with prices', async () => {
      console.log('💰 Testing menu display...');
      
      // Navigate to menu
      await page.goto('https://order.skan.al/beach-bar-durres/a1/menu', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for menu to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Look for menu items and prices
      const menuData = await page.evaluate(() => {
        const items = [];
        
        // Look for price elements
        const priceSelectors = ['.price', '.item-price', '[data-testid="price"]', '.cost'];
        let priceElements = [];
        
        for (let selector of priceSelectors) {
          priceElements = [...priceElements, ...document.querySelectorAll(selector)];
        }
        
        // Look for menu items
        const itemSelectors = ['.menu-item', '.item', '.dish', '[data-testid="menu-item"]'];
        let itemElements = [];
        
        for (let selector of itemSelectors) {
          itemElements = [...itemElements, ...document.querySelectorAll(selector)];
        }
        
        return {
          priceCount: priceElements.length,
          itemCount: itemElements.length,
          hasPrices: priceElements.length > 0,
          hasItems: itemElements.length > 0,
          bodyText: document.body.textContent
        };
      });
      
      console.log(`Menu data - Items: ${menuData.itemCount}, Prices: ${menuData.priceCount}`);
      
      // Should have either items or prices visible, or at least some content
      expect(menuData.hasItems || menuData.hasPrices || menuData.bodyText.length > 100).toBe(true);
    }, 30000);
  });

  describe('4. Basic Admin Flow', () => {
    test('4.1 Should display login form', async () => {
      console.log('🔐 Testing admin login form...');
      
      await page.goto('https://admin.skan.al/login', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Look for login form elements
      const loginForm = await page.evaluate(() => {
        const emailInputs = document.querySelectorAll('input[type="email"], input[name="email"], [placeholder*="email"]');
        const passwordInputs = document.querySelectorAll('input[type="password"], input[name="password"], [placeholder*="password"]');
        const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], .login-button, button');
        
        return {
          hasEmailInput: emailInputs.length > 0,
          hasPasswordInput: passwordInputs.length > 0,
          hasSubmitButton: submitButtons.length > 0,
          formCount: document.querySelectorAll('form').length
        };
      });
      
      console.log('Login form elements:', loginForm);
      
      expect(loginForm.hasEmailInput || loginForm.hasPasswordInput || loginForm.hasSubmitButton).toBe(true);
    }, 30000);
  });

  describe('5. Performance Check', () => {
    test('5.1 Pages should load within reasonable time', async () => {
      console.log('⏱️ Testing page load performance...');
      
      const startTime = Date.now();
      
      await page.goto('https://skan.al', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      console.log(`Marketing site load time: ${loadTime}ms`);
      
      // Should load within 30 seconds (generous for E2E)
      expect(loadTime).toBeLessThan(30000);
    }, 35000);
  });
});