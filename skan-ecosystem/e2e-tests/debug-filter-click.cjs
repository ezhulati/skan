const { chromium } = require('playwright');

async function debugFilterClick() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages to debug
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]: ${msg.text()}`);
  });

  try {
    console.log('🔍 Debugging Filter Click Issue');
    console.log('='.repeat(50));

    // Setup auth and navigate
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const mockAuth = {
        user: {
          id: "demo-user-1",
          email: "manager_email1@gmail.com",
          fullName: "Demo Manager",
          role: "manager",
          venueId: "demo-venue-1"
        },
        venue: {
          id: "demo-venue-1",
          name: "Demo Restaurant",
          slug: "demo-restaurant"
        },
        token: "valid-demo-token-123"
      };
      localStorage.setItem('restaurantAuth', JSON.stringify(mockAuth));
    });

    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(4000);

    console.log('1. Adding debug logging to React component:');
    
    // Inject debug code into the page
    await page.evaluate(() => {
      // Override console.log to capture selectedStatus changes
      const originalLog = console.log;
      window.debugSelectedStatus = null;
      
      // Try to hook into React state changes
      const buttons = document.querySelectorAll('.filter-button');
      buttons.forEach((button, index) => {
        const text = button.textContent;
        console.log(`Filter button ${index}: "${text}"`);
        
        // Add click listener to debug
        button.addEventListener('click', () => {
          console.log(`Clicked filter button: "${text}"`);
        });
      });
    });

    console.log('\n2. Testing each filter button:');
    
    const filters = ['Të gjitha', 'Aktive', 'Të reja', 'Duke u përgatitur', 'Gati', 'Shërbyer'];
    
    for (const filterName of filters) {
      console.log(`\n   Testing "${filterName}" button:`);
      
      await page.click(`button:has-text("${filterName}")`);
      await page.waitForTimeout(1000);
      
      // Check which button is now active
      const activeButton = await page.locator('.filter-button.active').textContent();
      console.log(`     Active button text: "${activeButton}"`);
      
      // Get current selectedStatus from React state if possible
      const currentStatus = await page.evaluate(() => {
        // Try to extract from URL or DOM data attributes
        const activeBtn = document.querySelector('.filter-button.active');
        return activeBtn ? activeBtn.textContent : 'unknown';
      });
      
      // Count orders shown
      const orderCount = await page.locator('.order-card').count();
      console.log(`     Orders shown: ${orderCount}`);
      
      // Get statuses of visible orders
      if (orderCount > 0) {
        const orderStatuses = [];
        for (let i = 0; i < Math.min(orderCount, 3); i++) {
          const status = await page.locator('.order-card').nth(i).locator('.order-status').textContent();
          orderStatuses.push(status?.trim());
        }
        console.log(`     Order statuses: ${orderStatuses.join(', ')}`);
      }
    }

    console.log('\n3. Checking filter button attributes:');
    
    const buttonInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.filter-button');
      const info = [];
      buttons.forEach((btn, index) => {
        info.push({
          index,
          text: btn.textContent,
          className: btn.className,
          onClick: btn.onclick ? 'has onclick' : 'no onclick'
        });
      });
      return info;
    });
    
    console.log('     Button info:');
    buttonInfo.forEach(btn => {
      console.log(`       ${btn.index}: "${btn.text}" - ${btn.className} - ${btn.onClick}`);
    });

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

debugFilterClick().catch(console.error);