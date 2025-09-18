import { test } from '@playwright/test';
import { URLs } from '../../test-data/constants';

test('Debug cart page content', async ({ page }) => {
  console.log('Navigating to cart page...');
  await page.goto(`${URLs.CUSTOMER_APP}/beach-bar-durres/a1/cart`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'cart-page-debug.png', fullPage: true });
  
  // Get all text content on page
  const pageContent = await page.textContent('body');
  console.log('Page content preview:', pageContent?.substring(0, 500));
  
  // Check for specific elements
  const hasPaymentMethod = await page.locator('text=Payment Method').isVisible();
  const hasMetodaPagës = await page.locator('text=Mënyra e Pagesës').isVisible();
  const hasCashOption = await page.locator('input[value="cash"]').isVisible();
  const hasEmptyCart = await page.locator('text=Your cart is empty').isVisible();
  const hasShportaBosh = await page.locator('text=Shporta është bosh').isVisible();
  
  console.log('Payment Method text found:', hasPaymentMethod);
  console.log('Mënyra e Pagesës text found:', hasMetodaPagës);
  console.log('Cash input found:', hasCashOption);
  console.log('Empty cart (EN) found:', hasEmptyCart);
  console.log('Empty cart (SQ) found:', hasShportaBosh);
  
  // Count all input elements
  const inputs = await page.locator('input').count();
  console.log('Total input elements:', inputs);
  
  // List all input types and values
  for (let i = 0; i < inputs; i++) {
    const input = page.locator('input').nth(i);
    const type = await input.getAttribute('type') || 'no-type';
    const value = await input.getAttribute('value') || 'no-value';
    const name = await input.getAttribute('name') || 'no-name';
    console.log(`Input ${i}: type=${type}, value=${value}, name=${name}`);
  }
  
  // Check for any buttons
  const buttons = await page.locator('button').count();
  console.log('Total buttons:', buttons);
  
  for (let i = 0; i < Math.min(buttons, 5); i++) {
    const button = page.locator('button').nth(i);
    const text = await button.textContent();
    console.log(`Button ${i}: ${text}`);
  }
});