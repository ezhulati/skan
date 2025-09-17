import { test, expect } from '@playwright/test';

test('debug mobile menu content', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:4323/');
  await page.waitForLoadState('networkidle');
  
  // Click hamburger to open menu
  await page.locator('.hamburger').click();
  await page.waitForTimeout(500);
  
  // Log all mobile menu content
  const mobileMenu = page.locator('.mobile-header__menu');
  const menuContent = await mobileMenu.innerHTML();
  console.log('Mobile menu HTML:', menuContent);
  
  // Check for specific menu items
  const menuItems = await page.locator('.mobile-menu li').count();
  console.log('Number of mobile menu items found:', menuItems);
  
  // List all links in mobile menu
  const links = await page.locator('.mobile-header__menu a').all();
  console.log('Found links in mobile menu:');
  for (const link of links) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`- Text: "${text?.trim()}", Href: "${href}"`);
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/test-results/mobile-menu-debug.png',
    fullPage: true 
  });
});