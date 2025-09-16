import { Page, Locator, expect } from '@playwright/test';
import { URLs, TIMEOUTS, VIEWPORTS } from '../test-data/constants';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a specific application
   */
  async navigateToApp(app: 'marketing' | 'customer' | 'admin', path: string = '') {
    const baseUrls = {
      marketing: URLs.MARKETING_SITE,
      customer: URLs.CUSTOMER_APP,
      admin: URLs.ADMIN_PORTAL,
    };
    
    const url = `${baseUrls[app]}${path}`;
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Set viewport size
   */
  async setViewport(viewport: keyof typeof VIEWPORTS) {
    await this.page.setViewportSize(VIEWPORTS[viewport]);
  }

  /**
   * Take screenshot with name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for element to be visible and clickable
   */
  async waitForElement(selector: string, timeout: number = TIMEOUTS.MEDIUM): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string, options?: { clear?: boolean }) {
    const field = await this.waitForElement(selector);
    
    if (options?.clear) {
      await field.clear();
    }
    
    await field.fill(value);
    
    // Verify the value was entered
    await expect(field).toHaveValue(value);
  }

  /**
   * Click element with retry logic
   */
  async clickElement(selector: string, options?: { timeout?: number; force?: boolean }) {
    const element = await this.waitForElement(selector, options?.timeout);
    await element.click({ force: options?.force });
  }

  /**
   * Verify element text content
   */
  async verifyText(selector: string, expectedText: string | RegExp) {
    const element = await this.waitForElement(selector);
    await expect(element).toHaveText(expectedText);
  }

  /**
   * Verify element is visible
   */
  async verifyVisible(selector: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
  }

  /**
   * Verify element is hidden
   */
  async verifyHidden(selector: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeHidden();
  }

  /**
   * Wait for and verify page URL
   */
  async verifyUrl(expectedUrl: string | RegExp) {
    await this.page.waitForURL(expectedUrl, { timeout: TIMEOUTS.MEDIUM });
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Simulate QR code scan by navigating to customer app with venue ID
   */
  async simulateQRScan(venueId: string = 'test-venue-123') {
    await this.navigateToApp('customer', `?venue=${venueId}`);
  }

  /**
   * Add item to cart
   */
  async addItemToCart(itemSelector: string, quantity: number = 1) {
    for (let i = 0; i < quantity; i++) {
      await this.clickElement(`${itemSelector} [data-testid="add-to-cart"]`);
      await this.page.waitForTimeout(500); // Small delay for animation
    }
  }

  /**
   * Verify accessibility requirements
   */
  async verifyAccessibility() {
    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check for form labels
    const inputs = await this.page.locator('input[type="text"], input[type="email"], input[type="password"], textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  }

  /**
   * Verify responsive design
   */
  async verifyResponsiveDesign() {
    // Test mobile viewport
    await this.setViewport('MOBILE');
    await this.waitForPageLoad();
    await this.takeScreenshot('mobile-view');

    // Test tablet viewport
    await this.setViewport('TABLET');
    await this.waitForPageLoad();
    await this.takeScreenshot('tablet-view');

    // Test desktop viewport
    await this.setViewport('DESKTOP');
    await this.waitForPageLoad();
    await this.takeScreenshot('desktop-view');
  }

  /**
   * Verify touch targets are adequately sized (minimum 44px)
   */
  async verifyTouchTargets() {
    const buttons = await this.page.locator('button, a[href], input[type="button"], input[type="submit"]').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  }

  /**
   * Simulate network conditions
   */
  async simulateSlowNetwork() {
    await this.page.context().route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await route.continue();
    });
  }

  /**
   * Clear all cookies and local storage
   */
  async clearStorage() {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string | RegExp, response: any, status: number = 200) {
    await this.page.route(url, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(url: string | RegExp, timeout: number = TIMEOUTS.MEDIUM) {
    await this.page.waitForResponse(url, { timeout });
  }

  /**
   * Verify no console errors
   */
  async verifyNoConsoleErrors() {
    const errors: string[] = [];
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Allow some time for any errors to surface
    await this.page.waitForTimeout(2000);
    
    expect(errors).toHaveLength(0);
  }
}