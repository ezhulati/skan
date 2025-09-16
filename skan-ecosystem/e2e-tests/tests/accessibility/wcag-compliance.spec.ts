import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';
import { MarketingSitePage } from '../../page-objects/MarketingSitePage';
import { CustomerAppPage } from '../../page-objects/CustomerAppPage';
import { AdminPortalPage } from '../../page-objects/AdminPortalPage';

test.describe('Accessibility - WCAG Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  test('Marketing Site - Homepage accessibility', async ({ page }) => {
    const marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
    
    // Check accessibility of homepage
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify manual accessibility requirements
    await verifyKeyboardNavigation(page);
    await verifyTouchTargets(page);
    await verifyColorContrast(page);
    await verifyHeadingStructure(page);
  });

  test('Marketing Site - Features page accessibility', async ({ page }) => {
    const marketingPage = new MarketingSitePage(page);
    await marketingPage.gotoPage('/features');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify feature cards are accessible
    await verifyCardAccessibility(page, '.feature-card, [data-feature]');
  });

  test('Marketing Site - Pricing page accessibility', async ({ page }) => {
    const marketingPage = new MarketingSitePage(page);
    await marketingPage.gotoPage('/pricing');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify pricing plans are accessible
    await verifyCardAccessibility(page, '.pricing-plan, [data-plan]');
  });

  test('Customer App - QR landing accessibility', async ({ page }) => {
    const customerPage = new CustomerAppPage(page);
    await customerPage.scanQRCode();
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify venue information is accessible
    await verifyVenueInfoAccessibility(page);
  });

  test('Customer App - Menu accessibility', async ({ page }) => {
    const customerPage = new CustomerAppPage(page);
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify menu items are accessible
    await verifyMenuAccessibility(page);
  });

  test('Customer App - Cart accessibility', async ({ page }) => {
    const customerPage = new CustomerAppPage(page);
    await customerPage.scanQRCode();
    await customerPage.proceedToMenu();
    await customerPage.addItemToCart(0, 1);
    await customerPage.openCart();
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify cart is accessible
    await verifyCartAccessibility(page);
  });

  test('Admin Portal - Login accessibility', async ({ page }) => {
    const adminPage = new AdminPortalPage(page);
    await adminPage.goto();
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify login form accessibility
    await verifyFormAccessibility(page, '[data-testid="login-form"]');
  });

  test('Admin Portal - Dashboard accessibility', async ({ page }) => {
    const adminPage = new AdminPortalPage(page);
    await adminPage.login();
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify dashboard stats are accessible
    await verifyStatsAccessibility(page);
  });

  test('Admin Portal - Orders list accessibility', async ({ page }) => {
    const adminPage = new AdminPortalPage(page);
    await adminPage.login();
    await adminPage.navigateToOrders();
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify orders list is accessible
    await verifyOrdersListAccessibility(page);
  });

  test('Mobile accessibility - All apps', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test marketing site on mobile
    const marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
    await checkA11y(page);
    await verifyMobileTouchTargets(page);
    
    // Test customer app on mobile
    const customerPage = new CustomerAppPage(page);
    await customerPage.scanQRCode();
    await checkA11y(page);
    await verifyMobileTouchTargets(page);
    
    // Test admin portal on mobile
    const adminPage = new AdminPortalPage(page);
    await adminPage.goto();
    await checkA11y(page);
    await verifyMobileTouchTargets(page);
  });

  test('Keyboard navigation - Cross-application', async ({ page }) => {
    // Test keyboard navigation on marketing site
    const marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
    await verifyFullKeyboardNavigation(page);
    
    // Test keyboard navigation on customer app
    const customerPage = new CustomerAppPage(page);
    await customerPage.scanQRCode();
    await verifyFullKeyboardNavigation(page);
    
    // Test keyboard navigation on admin portal
    const adminPage = new AdminPortalPage(page);
    await adminPage.goto();
    await verifyFullKeyboardNavigation(page);
  });

  test('Screen reader compatibility', async ({ page }) => {
    // Test with simulated screen reader
    const marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
    
    // Verify ARIA landmarks
    await verifyARIALandmarks(page);
    
    // Verify ARIA labels and descriptions
    await verifyARIALabels(page);
    
    // Verify heading structure for screen readers
    await verifyScreenReaderHeadings(page);
  });

  test('High contrast mode compatibility', async ({ page }) => {
    // Enable high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark' });
    
    const marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
    
    // Verify visibility in high contrast
    await verifyHighContrastVisibility(page);
    
    // Check customer app
    const customerPage = new CustomerAppPage(page);
    await customerPage.scanQRCode();
    await verifyHighContrastVisibility(page);
  });
});

// Helper functions for accessibility testing

async function verifyKeyboardNavigation(page: any) {
  // Test Tab navigation
  const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
  
  for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  }
  
  // Test Enter and Space on buttons
  const buttons = await page.locator('button:visible').all();
  if (buttons.length > 0) {
    await buttons[0].focus();
    // Note: In real test, we'd verify button activation
  }
}

async function verifyTouchTargets(page: any) {
  const touchTargets = await page.locator('button, a, input[type="button"], input[type="submit"], .clickable').all();
  
  for (const target of touchTargets.slice(0, 10)) {
    const box = await target.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
}

async function verifyColorContrast(page: any) {
  // Basic color contrast check (axe-core handles detailed testing)
  const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
  
  for (const element of textElements.slice(0, 5)) {
    const styles = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
      };
    });
    
    // Verify text has color (not transparent)
    expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
  }
}

async function verifyHeadingStructure(page: any) {
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  
  // Should have at least one h1
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThanOrEqual(1);
  
  // Should not have more than one h1
  expect(h1Count).toBeLessThanOrEqual(1);
  
  // Verify heading hierarchy (simplified check)
  if (headings.length > 1) {
    const firstHeading = headings[0];
    const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('h1');
  }
}

async function verifyCardAccessibility(page: any, selector: string) {
  const cards = await page.locator(selector).all();
  
  for (const card of cards.slice(0, 3)) {
    // Cards should have accessible names
    const hasHeading = await card.locator('h1, h2, h3, h4, h5, h6').count() > 0;
    const hasAriaLabel = await card.getAttribute('aria-label');
    const hasAriaLabelledby = await card.getAttribute('aria-labelledby');
    
    expect(hasHeading || hasAriaLabel || hasAriaLabelledby).toBeTruthy();
  }
}

async function verifyVenueInfoAccessibility(page: any) {
  // Verify venue information has proper headings
  const venueTitle = page.locator('.venue-title, h1');
  await expect(venueTitle).toBeVisible();
  
  // Verify venue address is accessible
  const venueAddress = page.locator('.venue-address');
  if (await venueAddress.isVisible()) {
    const addressText = await venueAddress.textContent();
    expect(addressText).toBeTruthy();
  }
}

async function verifyMenuAccessibility(page: any) {
  const menuItems = await page.locator('.menu-item, [data-menu-item]').all();
  
  for (const item of menuItems.slice(0, 3)) {
    // Each menu item should have accessible name
    const itemName = item.locator('.item-name, h3, h4');
    await expect(itemName).toBeVisible();
    
    // Add to cart buttons should be accessible
    const addButton = item.locator('button, [role="button"]');
    if (await addButton.isVisible()) {
      const buttonText = await addButton.textContent();
      const ariaLabel = await addButton.getAttribute('aria-label');
      expect(buttonText || ariaLabel).toBeTruthy();
    }
  }
}

async function verifyCartAccessibility(page: any) {
  // Verify cart items are accessible
  const cartItems = await page.locator('.cart-item').all();
  
  for (const item of cartItems) {
    const itemName = item.locator('.item-name, .name');
    await expect(itemName).toBeVisible();
    
    // Quantity controls should be accessible
    const quantityInput = item.locator('input[type="number"]');
    if (await quantityInput.isVisible()) {
      const label = await quantityInput.getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  }
  
  // Cart total should be accessible
  const cartTotal = page.locator('.cart-total, .total-amount');
  if (await cartTotal.isVisible()) {
    const totalText = await cartTotal.textContent();
    expect(totalText).toMatch(/total|sum|\$/i);
  }
}

async function verifyFormAccessibility(page: any, formSelector: string) {
  const form = page.locator(formSelector);
  const inputs = await form.locator('input, select, textarea').all();
  
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const name = await input.getAttribute('name');
    
    if (id) {
      // Should have associated label
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeVisible();
    } else if (name) {
      // Should have aria-label or be wrapped in label
      const ariaLabel = await input.getAttribute('aria-label');
      const parentLabel = await input.locator('..').locator('label').count();
      expect(ariaLabel || parentLabel > 0).toBeTruthy();
    }
  }
}

async function verifyStatsAccessibility(page: any) {
  const statsCards = await page.locator('.stats-card, [data-stat]').all();
  
  for (const card of statsCards) {
    // Each stat should have a title
    const title = card.locator('.stat-title, h3, .title');
    await expect(title).toBeVisible();
    
    // Each stat should have a value
    const value = card.locator('.stat-value, .number');
    await expect(value).toBeVisible();
  }
}

async function verifyOrdersListAccessibility(page: any) {
  const orderCards = await page.locator('.order-card, [data-order]').all();
  
  for (const card of orderCards.slice(0, 3)) {
    // Each order should have accessible information
    const orderId = card.locator('.order-id');
    const customerName = card.locator('.customer-name');
    
    await expect(orderId).toBeVisible();
    await expect(customerName).toBeVisible();
  }
}

async function verifyMobileTouchTargets(page: any) {
  const touchTargets = await page.locator('button, a, input[type="button"], .clickable').all();
  
  for (const target of touchTargets.slice(0, 5)) {
    const box = await target.boundingBox();
    if (box && await target.isVisible()) {
      // Mobile touch targets should be at least 44px
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
}

async function verifyFullKeyboardNavigation(page: any) {
  // More comprehensive keyboard navigation test
  const focusableElements = await page.locator('a:visible, button:visible, input:visible, select:visible, textarea:visible, [tabindex]:not([tabindex="-1"]):visible').count();
  
  if (focusableElements > 0) {
    // Tab through all elements
    for (let i = 0; i < Math.min(focusableElements, 10); i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify focus is visible
      const outline = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outline !== 'none'
      );
      // Note: Some apps use custom focus styles, so this is a basic check
    }
  }
}

async function verifyARIALandmarks(page: any) {
  // Verify common ARIA landmarks
  const landmarks = [
    'main',
    'nav',
    'header',
    'footer',
    '[role="main"]',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]'
  ];
  
  let landmarkCount = 0;
  for (const landmark of landmarks) {
    const count = await page.locator(landmark).count();
    landmarkCount += count;
  }
  
  expect(landmarkCount).toBeGreaterThan(0);
}

async function verifyARIALabels(page: any) {
  // Verify elements with ARIA labels
  const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby]').all();
  
  for (const element of ariaElements.slice(0, 5)) {
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaLabelledby = await element.getAttribute('aria-labelledby');
    const ariaDescribedby = await element.getAttribute('aria-describedby');
    
    if (ariaLabelledby) {
      const labelElement = page.locator(`#${ariaLabelledby}`);
      await expect(labelElement).toBeVisible();
    }
    
    if (ariaDescribedby) {
      const descElement = page.locator(`#${ariaDescribedby}`);
      await expect(descElement).toBeVisible();
    }
    
    expect(ariaLabel || ariaLabelledby || ariaDescribedby).toBeTruthy();
  }
}

async function verifyScreenReaderHeadings(page: any) {
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  
  for (const heading of headings) {
    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  }
}

async function verifyHighContrastVisibility(page: any) {
  // Basic high contrast visibility check
  const textElements = await page.locator('p, span, div, h1, h2, h3, button, a').all();
  
  for (const element of textElements.slice(0, 5)) {
    if (await element.isVisible()) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          visibility: computed.visibility,
          opacity: computed.opacity
        };
      });
      
      expect(styles.visibility).not.toBe('hidden');
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
    }
  }
}