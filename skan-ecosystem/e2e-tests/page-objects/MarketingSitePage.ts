import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { TEST_IDS, URLs } from '../test-data/constants';

export class MarketingSitePage {
  private helpers: TestHelpers;

  // Navigation elements
  readonly navLogo: Locator;
  readonly navFeatures: Locator;
  readonly navPricing: Locator;
  readonly navDemo: Locator;
  
  // Hero section
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly heroCTA: Locator;
  
  // Features section
  readonly featuresSection: Locator;
  readonly featureCards: Locator;
  
  // Pricing section
  readonly pricingSection: Locator;
  readonly pricingPlans: Locator;
  
  // Footer
  readonly footer: Locator;
  readonly contactForm: Locator;

  constructor(public page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Navigation
    this.navLogo = page.getByTestId(TEST_IDS.MARKETING.NAV_LOGO);
    this.navFeatures = page.getByTestId(TEST_IDS.MARKETING.NAV_FEATURES);
    this.navPricing = page.getByTestId(TEST_IDS.MARKETING.NAV_PRICING);
    this.navDemo = page.getByTestId(TEST_IDS.MARKETING.NAV_DEMO);
    
    // Hero section
    this.heroTitle = page.locator('h1').first();
    this.heroSubtitle = page.locator('.hero-subtitle, .hero p').first();
    this.heroCTA = page.getByTestId(TEST_IDS.MARKETING.HERO_CTA);
    
    // Features
    this.featuresSection = page.getByTestId(TEST_IDS.MARKETING.FEATURES_SECTION);
    this.featureCards = page.locator('.feature-card, [data-feature]');
    
    // Pricing
    this.pricingSection = page.getByTestId(TEST_IDS.MARKETING.PRICING_SECTION);
    this.pricingPlans = page.locator('.pricing-plan, [data-plan]');
    
    // Footer
    this.footer = page.locator('footer');
    this.contactForm = page.getByTestId(TEST_IDS.MARKETING.CONTACT_FORM);
  }

  /**
   * Navigate to the marketing site home page
   */
  async goto() {
    await this.helpers.navigateToApp('marketing');
  }

  /**
   * Navigate to a specific page
   */
  async gotoPage(path: string) {
    await this.helpers.navigateToApp('marketing', path);
  }

  /**
   * Click on navigation link
   */
  async clickNavigation(link: 'features' | 'pricing' | 'demo') {
    const navMap = {
      features: this.navFeatures,
      pricing: this.navPricing,
      demo: this.navDemo,
    };
    
    await navMap[link].click();
  }

  /**
   * Click hero CTA button
   */
  async clickHeroCTA() {
    await this.heroCTA.click();
  }

  /**
   * Verify homepage content is loaded
   */
  async verifyHomepageLoaded() {
    await this.helpers.verifyVisible('[data-testid="' + TEST_IDS.MARKETING.NAV_LOGO + '"]');
    await this.helpers.verifyVisible('h1');
    await this.heroTitle.waitFor({ state: 'visible' });
  }

  /**
   * Verify features section content
   */
  async verifyFeaturesSection() {
    await this.featuresSection.scrollIntoViewIfNeeded();
    await this.helpers.verifyVisible('[data-testid="' + TEST_IDS.MARKETING.FEATURES_SECTION + '"]');
    
    // Verify at least 3 feature cards are present
    const featureCount = await this.featureCards.count();
    expect(featureCount).toBeGreaterThanOrEqual(3);
  }

  /**
   * Verify pricing section content
   */
  async verifyPricingSection() {
    await this.pricingSection.scrollIntoViewIfNeeded();
    await this.helpers.verifyVisible('[data-testid="' + TEST_IDS.MARKETING.PRICING_SECTION + '"]');
    
    // Verify pricing plans are present
    const planCount = await this.pricingPlans.count();
    expect(planCount).toBeGreaterThanOrEqual(2);
  }

  /**
   * Fill and submit contact form
   */
  async submitContactForm(data: { name: string; email: string; message: string }) {
    await this.contactForm.scrollIntoViewIfNeeded();
    
    await this.helpers.fillField('[name="name"], #name', data.name);
    await this.helpers.fillField('[name="email"], #email', data.email);
    await this.helpers.fillField('[name="message"], #message', data.message);
    
    await this.helpers.clickElement('[type="submit"], .submit-button');
  }

  /**
   * Verify responsive navigation
   */
  async verifyMobileNavigation() {
    await this.helpers.setViewport('MOBILE');
    
    // Check for mobile menu toggle
    const mobileMenuToggle = this.page.locator('.mobile-menu-toggle, [data-mobile-menu], .hamburger');
    await mobileMenuToggle.waitFor({ state: 'visible' });
    
    // Click to open mobile menu
    await mobileMenuToggle.click();
    
    // Verify navigation items are visible
    await this.navFeatures.waitFor({ state: 'visible' });
    await this.navPricing.waitFor({ state: 'visible' });
  }

  /**
   * Verify page load performance
   */
  async verifyPagePerformance() {
    const startTime = Date.now();
    await this.goto();
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  }

  /**
   * Verify SEO elements
   */
  async verifySEOElements() {
    // Check page title
    const title = await this.page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(60);
    
    // Check meta description
    const metaDescription = this.page.locator('meta[name="description"]');
    const descriptionContent = await metaDescription.getAttribute('content');
    expect(descriptionContent).toBeTruthy();
    expect(descriptionContent!.length).toBeLessThan(160);
    
    // Check heading structure
    const h1Count = await this.page.locator('h1').count();
    expect(h1Count).toBe(1);
  }
}