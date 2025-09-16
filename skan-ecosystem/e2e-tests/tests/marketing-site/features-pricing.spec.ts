import { test, expect } from '@playwright/test';
import { MarketingSitePage } from '../../page-objects/MarketingSitePage';

test.describe('Marketing Site - Features & Pricing', () => {
  let marketingPage: MarketingSitePage;

  test.beforeEach(async ({ page }) => {
    marketingPage = new MarketingSitePage(page);
  });

  test('should display features page with all feature cards', async () => {
    await marketingPage.gotoPage('/features');
    
    // Verify features section
    await marketingPage.verifyFeaturesSection();
    
    // Verify page title
    await expect(marketingPage.page).toHaveTitle(/Features/);
    
    // Check that feature cards have proper content
    const featureCards = marketingPage.featureCards;
    const cardCount = await featureCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
    
    // Verify each feature card has title and description
    for (let i = 0; i < cardCount; i++) {
      const card = featureCards.nth(i);
      const title = card.locator('h3, .feature-title').first();
      const description = card.locator('p, .feature-description').first();
      
      await expect(title).toBeVisible();
      await expect(description).toBeVisible();
    }
  });

  test('should display pricing page with pricing plans', async () => {
    await marketingPage.gotoPage('/pricing');
    
    // Verify pricing section
    await marketingPage.verifyPricingSection();
    
    // Verify page title
    await expect(marketingPage.page).toHaveTitle(/Pricing/);
    
    // Check pricing plans
    const pricingPlans = marketingPage.pricingPlans;
    const planCount = await pricingPlans.count();
    expect(planCount).toBeGreaterThanOrEqual(2);
    
    // Verify each plan has price and features
    for (let i = 0; i < planCount; i++) {
      const plan = pricingPlans.nth(i);
      
      // Should have plan name
      const planName = plan.locator('h3, .plan-name').first();
      await expect(planName).toBeVisible();
      
      // Should have price
      const price = plan.locator('.price, .plan-price');
      await expect(price).toBeVisible();
      
      // Should have feature list
      const features = plan.locator('ul li, .feature-list li');
      const featureCount = await features.count();
      expect(featureCount).toBeGreaterThan(0);
    }
  });

  test('should have working demo page', async () => {
    await marketingPage.gotoPage('/demo');
    
    // Verify demo page loads
    await expect(marketingPage.page).toHaveTitle(/Demo/);
    
    // Look for demo content
    const demoSection = marketingPage.page.locator('.demo-section, main, .demo-content');
    await expect(demoSection).toBeVisible();
    
    // Check for demo video or interactive elements
    const videoElement = marketingPage.page.locator('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    const interactiveDemo = marketingPage.page.locator('.interactive-demo, .demo-app');
    
    // Either video or interactive demo should be present
    const hasVideo = await videoElement.count() > 0;
    const hasInteractive = await interactiveDemo.count() > 0;
    
    expect(hasVideo || hasInteractive).toBeTruthy();
  });

  test('should navigate between pages correctly', async () => {
    // Start at homepage
    await marketingPage.goto();
    
    // Navigate to features
    await marketingPage.clickNavigation('features');
    await expect(marketingPage.page).toHaveURL(/.*features.*/);
    await marketingPage.verifyFeaturesSection();
    
    // Navigate to pricing
    await marketingPage.clickNavigation('pricing');
    await expect(marketingPage.page).toHaveURL(/.*pricing.*/);
    await marketingPage.verifyPricingSection();
    
    // Navigate to demo
    await marketingPage.clickNavigation('demo');
    await expect(marketingPage.page).toHaveURL(/.*demo.*/);
    
    // Navigate back to home via logo
    await marketingPage.navLogo.click();
    await expect(marketingPage.page).toHaveURL('http://localhost:4321/');
  });

  test('should have proper call-to-action buttons', async () => {
    // Test CTA on features page
    await marketingPage.gotoPage('/features');
    
    const ctaButtons = marketingPage.page.locator('.cta-button, .btn-primary, [data-cta]');
    const ctaCount = await ctaButtons.count();
    
    if (ctaCount > 0) {
      const firstCTA = ctaButtons.first();
      await expect(firstCTA).toBeVisible();
      
      // CTA should have meaningful text
      const ctaText = await firstCTA.textContent();
      expect(ctaText).toMatch(/get started|sign up|try now|contact/i);
    }
  });

  test('should display proper feature benefits', async () => {
    await marketingPage.gotoPage('/features');
    
    // Look for key SKAN.AL features
    const pageContent = await marketingPage.page.textContent('main, .content');
    
    // Should mention key QR ordering benefits
    expect(pageContent).toMatch(/qr.*code|contactless|digital.*menu|mobile.*ordering/i);
    
    // Should mention benefits like efficiency, safety, etc.
    expect(pageContent).toMatch(/efficiency|safety|contactless|streamline|easy/i);
  });

  test('should have competitive pricing display', async () => {
    await marketingPage.gotoPage('/pricing');
    
    // Check for pricing tiers
    const pricingPlans = marketingPage.pricingPlans;
    const planCount = await pricingPlans.count();
    
    if (planCount >= 2) {
      // Should have different price points
      const prices: string[] = [];
      
      for (let i = 0; i < planCount; i++) {
        const plan = pricingPlans.nth(i);
        const priceElement = plan.locator('.price, .plan-price');
        const priceText = await priceElement.textContent();
        
        if (priceText) {
          prices.push(priceText);
        }
      }
      
      // Prices should be different (not all the same)
      const uniquePrices = new Set(prices);
      expect(uniquePrices.size).toBeGreaterThan(1);
    }
  });

  test('should be responsive across all pages', async () => {
    const pages = ['/', '/features', '/pricing', '/demo'];
    
    for (const pagePath of pages) {
      await marketingPage.gotoPage(pagePath);
      
      // Test mobile view
      await marketingPage.page.setViewportSize({ width: 375, height: 667 });
      await marketingPage.page.waitForTimeout(500);
      
      // Verify content is still accessible
      const mainContent = marketingPage.page.locator('main, .content, body');
      await expect(mainContent).toBeVisible();
      
      // Test tablet view
      await marketingPage.page.setViewportSize({ width: 768, height: 1024 });
      await marketingPage.page.waitForTimeout(500);
      await expect(mainContent).toBeVisible();
      
      // Reset to desktop
      await marketingPage.page.setViewportSize({ width: 1280, height: 720 });
    }
  });
});