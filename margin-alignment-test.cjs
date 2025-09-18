const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testMarginAlignment() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to admin dashboard...');
    await page.goto('http://localhost:3001/login');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]');
    
    // Login with demo credentials
    console.log('Logging in with demo credentials...');
    await page.fill('input[type="email"]', 'manager_email1@gmail.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    console.log('Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard');
    await page.waitForSelector('.welcome-header', { timeout: 10000 });
    
    // Take initial screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({ 
      path: 'dashboard-initial.png',
      fullPage: true 
    });
    
    // Inspect WelcomeHeader element
    console.log('Inspecting WelcomeHeader styles...');
    const welcomeHeaderStyles = await page.evaluate(() => {
      const element = document.querySelector('.welcome-header');
      if (!element) return null;
      
      const computedStyles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return {
        marginLeft: computedStyles.marginLeft,
        marginRight: computedStyles.marginRight,
        paddingLeft: computedStyles.paddingLeft,
        paddingRight: computedStyles.paddingRight,
        left: rect.left,
        width: rect.width,
        className: element.className,
        tagName: element.tagName
      };
    });
    
    // Inspect orders section header element
    console.log('Inspecting orders section header styles...');
    const ordersSectionStyles = await page.evaluate(() => {
      // Try multiple selectors to find the orders section header
      const selectors = [
        '.orders-section-header',
        '.orders-section h1',
        '.orders-section h2',
        '.orders-section .section-title',
        '[data-testid="orders-section-header"]',
        '.dashboard-section h1',
        '.dashboard-section h2'
      ];
      
      let element = null;
      let usedSelector = '';
      
      for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) {
          usedSelector = selector;
          break;
        }
      }
      
      // If not found by class, try to find by text content
      if (!element) {
        const headings = document.querySelectorAll('h1, h2, h3');
        for (const heading of headings) {
          if (heading.textContent.includes('Paneli i Porosive') || 
              heading.textContent.includes('Orders') ||
              heading.textContent.includes('Porosi')) {
            element = heading;
            usedSelector = `${heading.tagName} with text: ${heading.textContent}`;
            break;
          }
        }
      }
      
      if (!element) return { notFound: true, availableElements: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent) };
      
      const computedStyles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return {
        marginLeft: computedStyles.marginLeft,
        marginRight: computedStyles.marginRight,
        paddingLeft: computedStyles.paddingLeft,
        paddingRight: computedStyles.paddingRight,
        left: rect.left,
        width: rect.width,
        className: element.className,
        tagName: element.tagName,
        textContent: element.textContent,
        usedSelector: usedSelector
      };
    });
    
    // Get page structure for debugging
    console.log('Getting page structure...');
    const pageStructure = await page.evaluate(() => {
      const welcomeHeader = document.querySelector('.welcome-header');
      const mainContent = document.querySelector('main, .main-content, .dashboard-content');
      const ordersSections = document.querySelectorAll('.orders-section, .dashboard-section, [class*="order"]');
      
      return {
        welcomeHeaderExists: !!welcomeHeader,
        welcomeHeaderParent: welcomeHeader?.parentElement?.className,
        mainContentExists: !!mainContent,
        mainContentClass: mainContent?.className,
        ordersSectionsCount: ordersSections.length,
        ordersSectionsClasses: Array.from(ordersSections).map(s => s.className)
      };
    });
    
    console.log('\n=== ANALYSIS RESULTS ===');
    console.log('Page Structure:', JSON.stringify(pageStructure, null, 2));
    console.log('\nWelcome Header Styles:', JSON.stringify(welcomeHeaderStyles, null, 2));
    console.log('\nOrders Section Styles:', JSON.stringify(ordersSectionStyles, null, 2));
    
    if (welcomeHeaderStyles && ordersSectionStyles && !ordersSectionStyles.notFound) {
      const leftDifference = parseFloat(ordersSectionStyles.left) - parseFloat(welcomeHeaderStyles.left);
      console.log(`\n=== ALIGNMENT ANALYSIS ===`);
      console.log(`Welcome Header left position: ${welcomeHeaderStyles.left}px`);
      console.log(`Orders Section left position: ${ordersSectionStyles.left}px`);
      console.log(`Difference: ${leftDifference}px`);
      
      if (Math.abs(leftDifference) > 1) {
        console.log(`\n⚠️  MISALIGNMENT DETECTED: ${leftDifference}px difference`);
        console.log('Margin/Padding comparison:');
        console.log(`Welcome Header - marginLeft: ${welcomeHeaderStyles.marginLeft}, paddingLeft: ${welcomeHeaderStyles.paddingLeft}`);
        console.log(`Orders Section - marginLeft: ${ordersSectionStyles.marginLeft}, paddingLeft: ${ordersSectionStyles.paddingLeft}`);
      } else {
        console.log('\n✅ Elements appear to be aligned (difference < 1px)');
      }
    }
    
    // Wait a moment for visual inspection
    console.log('\nWaiting 5 seconds for visual inspection...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testMarginAlignment();