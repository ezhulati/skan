const puppeteer = require('puppeteer');
const ApiHelpers = require('../utils/api-helpers');

describe('Debug Customer Menu Display Issues', () => {
  let browser;
  let page;
  let apiHelpers;

  beforeAll(async () => {
    console.log('🔍 Starting Customer Menu Debug Analysis');
    
    browser = await puppeteer.launch({
      headless: false, // Run in headed mode to see what's happening
      slowMo: 500,     // Slow down for debugging
      devtools: true,  // Open DevTools
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
    console.log('✅ Customer Menu Debug Complete');
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 }); // Use desktop viewport
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('1. Investigate actual DOM structure and content', async () => {
    console.log('🔍 Analyzing customer menu page DOM structure...');
    
    // Navigate to menu page
    await page.goto('https://order.skan.al/beach-bar-durres/a1/menu', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get complete page analysis
    const pageAnalysis = await page.evaluate(() => {
      // Get all text content
      const bodyText = document.body.textContent || '';
      
      // Find all potential menu-related elements
      const allElements = document.querySelectorAll('*');
      const elementAnalysis = [];
      
      for (let el of allElements) {
        if (el.textContent && el.textContent.trim()) {
          const text = el.textContent.trim();
          const className = el.className || '';
          const tagName = el.tagName.toLowerCase();
          const id = el.id || '';
          
          // Look for price patterns (€, numbers, currency)
          const hasPrice = /[€$£]\s*\d+|\d+\s*[€$£]|\d+\.\d+/.test(text);
          
          // Look for menu item patterns
          const couldBeMenuItem = text.length > 3 && text.length < 100 && 
                                 !text.includes('\n') && 
                                 (className.includes('item') || 
                                  className.includes('menu') || 
                                  className.includes('product') ||
                                  tagName === 'h3' || 
                                  tagName === 'h4' || 
                                  tagName === 'h5');
          
          if (hasPrice || couldBeMenuItem || className.includes('menu') || className.includes('item')) {
            elementAnalysis.push({
              tagName,
              className,
              id,
              text: text.substring(0, 100), // Limit text length
              hasPrice,
              couldBeMenuItem,
              textLength: text.length
            });
          }
        }
      }
      
      // Get page title and URL
      const title = document.title;
      const url = window.location.href;
      
      // Get all class names in the page
      const allClasses = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls && !allClasses.includes(cls)) {
              allClasses.push(cls);
            }
          });
        }
      });
      
      // Look for React/JavaScript errors
      const hasReactRoot = !!document.querySelector('#root, [data-reactroot]');
      const hasJavaScriptErrors = window.jsErrors || [];
      
      // Check for loading states
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="loading"]');
      
      return {
        title,
        url,
        bodyTextLength: bodyText.length,
        bodyTextPreview: bodyText.substring(0, 500),
        elementAnalysis: elementAnalysis.slice(0, 20), // Limit to first 20 relevant elements
        allClasses: allClasses.slice(0, 50), // Limit to first 50 classes
        hasReactRoot,
        hasJavaScriptErrors,
        loadingElementsCount: loadingElements.length,
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log('📋 Page Analysis Results:');
    console.log('Title:', pageAnalysis.title);
    console.log('URL:', pageAnalysis.url);
    console.log('Body Text Length:', pageAnalysis.bodyTextLength);
    console.log('Total Elements:', pageAnalysis.totalElements);
    console.log('Has React Root:', pageAnalysis.hasReactRoot);
    console.log('Loading Elements:', pageAnalysis.loadingElementsCount);
    
    console.log('\n📝 Body Text Preview:');
    console.log(pageAnalysis.bodyTextPreview);
    
    console.log('\n🎨 Available CSS Classes:');
    console.log(pageAnalysis.allClasses.join(', '));
    
    console.log('\n🔍 Potential Menu Elements:');
    pageAnalysis.elementAnalysis.forEach((el, index) => {
      console.log(`${index + 1}. ${el.tagName}.${el.className} - "${el.text}" (Price: ${el.hasPrice}, MenuItem: ${el.couldBeMenuItem})`);
    });
    
    // Take screenshot for visual debugging
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/menu-debug.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved to reports/menu-debug.png');
    
    // Check if page is still loading
    expect(pageAnalysis.bodyTextLength).toBeGreaterThan(100);
  }, 60000);

  test('2. Compare API data with frontend display', async () => {
    console.log('🔄 Comparing API data with frontend display...');
    
    // Get API data
    const apiData = await apiHelpers.getVenueMenu('beach-bar-durres');
    console.log('📡 API Response Success:', apiData.success);
    
    if (apiData.success) {
      console.log('🏪 Venue:', apiData.data.venue.name);
      console.log('📂 Categories:', apiData.data.categories.length);
      
      // Log first few items for comparison
      apiData.data.categories.forEach((category, catIndex) => {
        console.log(`\nCategory ${catIndex + 1}: ${category.name} (${category.items.length} items)`);
        category.items.slice(0, 3).forEach((item, itemIndex) => {
          console.log(`  Item ${itemIndex + 1}: ${item.name} - €${item.price}`);
        });
      });
    }
    
    // Navigate to frontend
    await page.goto('https://order.skan.al/beach-bar-durres/a1/menu', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if frontend is making API calls
    const networkActivity = await page.evaluate(() => {
      // Check for fetch/XHR activity
      const performanceEntries = performance.getEntriesByType('resource');
      const apiCalls = performanceEntries.filter(entry => 
        entry.name.includes('api') || 
        entry.name.includes('menu') ||
        entry.name.includes('venue')
      );
      
      return {
        totalRequests: performanceEntries.length,
        apiCalls: apiCalls.map(call => call.name)
      };
    });
    
    console.log('\n🌐 Network Activity:');
    console.log('Total Requests:', networkActivity.totalRequests);
    console.log('API Calls:', networkActivity.apiCalls);
    
    expect(apiData.success).toBe(true);
  }, 60000);

  test('3. Test different viewport sizes', async () => {
    console.log('📱 Testing different viewport sizes...');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📐 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewport(viewport);
      await page.goto('https://order.skan.al/beach-bar-durres/a1/menu', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const viewportAnalysis = await page.evaluate(() => {
        const menuElements = document.querySelectorAll('[class*="menu"], [class*="item"], [class*="product"]');
        const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"]');
        const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });
        
        return {
          menuElementsCount: menuElements.length,
          priceElementsCount: priceElements.length,
          visibleElementsCount: visibleElements.length,
          bodyText: document.body.textContent.substring(0, 200)
        };
      });
      
      console.log(`${viewport.name} - Menu Elements: ${viewportAnalysis.menuElementsCount}, Prices: ${viewportAnalysis.priceElementsCount}, Visible: ${viewportAnalysis.visibleElementsCount}`);
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/menu-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
    }
  }, 120000);

  test('4. Test JavaScript console errors', async () => {
    console.log('🐛 Checking for JavaScript errors...');
    
    const consoleMessages = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    await page.goto('https://order.skan.al/beach-bar-durres/a1/menu', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📝 Console Messages:');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
    });
    
    console.log('\n❌ JavaScript Errors:');
    jsErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.message}`);
    });
    
    // Log to file for detailed analysis
    const debugData = {
      timestamp: new Date().toISOString(),
      consoleMessages,
      jsErrors,
      url: await page.url()
    };
    
    require('fs').writeFileSync(
      '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/puppeteer/reports/debug-log.json',
      JSON.stringify(debugData, null, 2)
    );
    
    console.log('💾 Debug data saved to reports/debug-log.json');
    
    // Errors shouldn't prevent the test from completing
    expect(true).toBe(true);
  }, 60000);
});