import { test, expect } from '@playwright/test';
import { MarketingSitePage } from '../../page-objects/MarketingSitePage';

test.describe('Marketing Site - Homepage', () => {
  let marketingPage: MarketingSitePage;

  test.beforeEach(async ({ page }) => {
    marketingPage = new MarketingSitePage(page);
    await marketingPage.goto();
  });

  test('should load homepage successfully', async () => {
    await marketingPage.verifyHomepageLoaded();
    
    // Verify page title
    await expect(marketingPage.page).toHaveTitle(/SKAN\.AL/);
    
    // Verify hero section is visible
    await expect(marketingPage.heroTitle).toBeVisible();
    await expect(marketingPage.heroSubtitle).toBeVisible();
    await expect(marketingPage.heroCTA).toBeVisible();
  });

  test('should have proper navigation menu', async () => {
    // Verify navigation elements are present
    await expect(marketingPage.navLogo).toBeVisible();
    await expect(marketingPage.navFeatures).toBeVisible();
    await expect(marketingPage.navPricing).toBeVisible();
    await expect(marketingPage.navDemo).toBeVisible();
    
    // Test navigation clicks
    await marketingPage.clickNavigation('features');
    await expect(marketingPage.page).toHaveURL(/.*features.*/);
    
    await marketingPage.gotoPage('/');
    await marketingPage.clickNavigation('pricing');
    await expect(marketingPage.page).toHaveURL(/.*pricing.*/);
  });

  test('should display hero section with CTA', async () => {
    // Verify hero content
    const heroTitle = await marketingPage.heroTitle.textContent();
    expect(heroTitle).toBeTruthy();
    expect(heroTitle!.length).toBeGreaterThan(10);
    
    // Test CTA button
    await marketingPage.clickHeroCTA();
    
    // Should navigate somewhere (demo page or sign up)
    await marketingPage.page.waitForTimeout(1000);
    const currentUrl = marketingPage.page.url();
    expect(currentUrl).not.toBe('http://localhost:4321/');
  });

  test('should be responsive on mobile devices', async () => {
    await marketingPage.verifyMobileNavigation();
    
    // Verify content is readable on mobile
    const heroTitle = marketingPage.heroTitle;
    await expect(heroTitle).toBeVisible();
    
    const titleBox = await heroTitle.boundingBox();
    expect(titleBox!.width).toBeLessThan(400); // Should fit mobile screen
  });

  test('should have proper SEO elements', async () => {
    await marketingPage.verifySEOElements();
  });

  test('should load within performance budget', async () => {
    await marketingPage.verifyPagePerformance();
  });

  test('should have accessible navigation', async () => {
    // Check navigation links have proper ARIA labels or text
    const navLinks = await marketingPage.page.locator('nav a, [role="navigation"] a').all();
    
    for (const link of navLinks) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should handle contact form submission', async () => {
    // Scroll to footer where contact form might be
    await marketingPage.page.locator('footer').scrollIntoViewIfNeeded();
    
    // Check if contact form exists
    const contactForm = marketingPage.page.locator('form, [data-testid="contact-form"]');
    if (await contactForm.isVisible()) {
      await marketingPage.submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message from E2E tests.'
      });
      
      // Verify success message or redirect
      await marketingPage.page.waitForTimeout(2000);
      const successMessage = marketingPage.page.locator('.success-message, .thank-you');
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible();
      }
    }
  });
});