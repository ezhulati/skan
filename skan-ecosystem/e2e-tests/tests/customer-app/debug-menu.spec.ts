import { test } from '@playwright/test';
import { URLs } from '../../test-data/constants';

test('Debug menu page to understand add-to-cart flow', async ({ page }) => {
  console.log('Navigating to menu page...');
  await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/menu`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'menu-page-debug.png', fullPage: true });
  
  // Get all text content on page
  const pageContent = await page.textContent('body');
  console.log('Page content preview:', pageContent?.substring(0, 1000));
  
  // Look for menu items
  const menuItems = await page.locator('div').filter({ hasText: 'Beer' }).count();
  console.log('Menu items with "Beer":', menuItems);
  
  const allItems = await page.locator('.bg-white').count();
  console.log('Elements with bg-white:', allItems);
  
  // Look for buttons
  const buttons = await page.locator('button').count();
  console.log('Total buttons:', buttons);
  
  for (let i = 0; i < Math.min(buttons, 10); i++) {
    const button = page.locator('button').nth(i);
    const text = await button.textContent();
    const isVisible = await button.isVisible();
    console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
  }
  
  // Look for specific add-to-cart patterns
  const addButtons = await page.locator('button:has-text("Add"), button:has-text("Shto"), button:has-text("+")').count();
  console.log('Add-to-cart buttons found:', addButtons);
  
  // Check for test IDs
  const testIdButtons = await page.locator('[data-testid="add-to-cart"]').count();
  console.log('Buttons with add-to-cart test ID:', testIdButtons);
  
  // Check for any clickable elements that might add to cart
  const clickableElements = await page.locator('[onclick], [data-action], .cursor-pointer').count();
  console.log('Clickable elements found:', clickableElements);
  
  // Look for menu item cards/containers
  const itemContainers = await page.locator('[data-menu-item], .menu-item, [data-item-id]').count();
  console.log('Menu item containers found:', itemContainers);
  
  // Check if venue data loaded
  const hasVenueTitle = await page.locator('h1, .venue-title').isVisible();
  console.log('Venue title visible:', hasVenueTitle);
  
  if (hasVenueTitle) {
    const venueTitle = await page.locator('h1, .venue-title').textContent();
    console.log('Venue title:', venueTitle);
  }
});