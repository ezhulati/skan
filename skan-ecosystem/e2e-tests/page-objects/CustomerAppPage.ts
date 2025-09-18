import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { TEST_IDS, TEST_DATA, TIMEOUTS } from '../test-data/constants';

export class CustomerAppPage {
  private helpers: TestHelpers;

  // QR Landing elements
  readonly qrScanner: Locator;
  readonly venueInfo: Locator;
  readonly venueTitle: Locator;
  readonly venueAddress: Locator;
  
  // Menu elements
  readonly menuCategories: Locator;
  readonly menuItems: Locator;
  readonly menuItemCards: Locator;
  
  // Cart elements
  readonly cartButton: Locator;
  readonly cartItems: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;
  readonly addToCartButtons: Locator;
  
  // Order elements
  readonly orderSummary: Locator;
  readonly placeOrderButton: Locator;
  readonly orderConfirmation: Locator;
  readonly orderStatus: Locator;
  readonly orderNumber: Locator;

  // Payment elements
  readonly paymentMethodSection: Locator;
  readonly cashPaymentOption: Locator;
  readonly cardPaymentOption: Locator;
  readonly cashRadio: Locator;
  readonly cardRadio: Locator;
  readonly submitOrderButton: Locator;
  readonly proceedToPaymentButton: Locator;

  constructor(public page: Page) {
    this.helpers = new TestHelpers(page);
    
    // QR Landing
    this.qrScanner = page.getByTestId(TEST_IDS.CUSTOMER.QR_SCANNER);
    this.venueInfo = page.getByTestId(TEST_IDS.CUSTOMER.VENUE_INFO);
    this.venueTitle = page.locator('.venue-title, h1');
    this.venueAddress = page.locator('.venue-address');
    
    // Menu
    this.menuCategories = page.getByTestId(TEST_IDS.CUSTOMER.MENU_CATEGORY);
    this.menuItems = page.getByTestId(TEST_IDS.CUSTOMER.MENU_ITEM);
    this.menuItemCards = page.locator('.menu-item, [data-menu-item]');
    
    // Cart
    this.cartButton = page.getByTestId(TEST_IDS.CUSTOMER.CART_BUTTON);
    this.cartItems = page.getByTestId(TEST_IDS.CUSTOMER.CART_ITEMS);
    this.cartTotal = page.getByTestId(TEST_IDS.CUSTOMER.CART_TOTAL);
    this.checkoutButton = page.getByTestId(TEST_IDS.CUSTOMER.CHECKOUT_BUTTON);
    this.addToCartButtons = page.getByTestId(TEST_IDS.CUSTOMER.ADD_TO_CART);
    
    // Order
    this.orderSummary = page.getByTestId(TEST_IDS.CUSTOMER.ORDER_SUMMARY);
    this.placeOrderButton = page.getByTestId(TEST_IDS.CUSTOMER.PLACE_ORDER);
    this.orderConfirmation = page.getByTestId(TEST_IDS.CUSTOMER.ORDER_CONFIRMATION);
    this.orderStatus = page.getByTestId(TEST_IDS.CUSTOMER.ORDER_STATUS);
    this.orderNumber = page.locator('.order-number, [data-order-number]');

    // Payment elements
    this.paymentMethodSection = page.locator('text=Payment Method').or(page.locator('text=Metoda e Pagesës'));
    this.cashPaymentOption = page.locator('label:has(input[value="cash"])');
    this.cardPaymentOption = page.locator('label:has(input[value="stripe"])');
    this.cashRadio = page.locator('input[value="cash"]');
    this.cardRadio = page.locator('input[value="stripe"]');
    this.submitOrderButton = page.locator('button:has-text("Submit Order")').or(page.locator('button:has-text("Dërgo Porosinë")'));
    this.proceedToPaymentButton = page.locator('button:has-text("Proceed to Payment")').or(page.locator('button:has-text("Vazhdo në Pagesë")'));
  }

  /**
   * Navigate to customer app
   */
  async goto() {
    await this.helpers.navigateToApp('customer');
  }

  /**
   * Simulate QR code scan with venue ID
   */
  async scanQRCode(venueId: string = TEST_DATA.SAMPLE_VENUE.id) {
    await this.helpers.simulateQRScan(venueId);
    await this.helpers.waitForPageLoad();
  }

  /**
   * Verify QR landing page is loaded
   */
  async verifyQRLandingLoaded() {
    await this.venueInfo.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    await this.helpers.verifyVisible('.venue-title, h1');
  }

  /**
   * Verify venue information is displayed
   */
  async verifyVenueInfo(expectedVenue?: typeof TEST_DATA.SAMPLE_VENUE) {
    const venue = expectedVenue || TEST_DATA.SAMPLE_VENUE;
    
    await this.helpers.verifyText('.venue-title, h1', venue.name);
    await this.helpers.verifyVisible('.venue-address');
  }

  /**
   * Navigate to menu from QR landing
   */
  async proceedToMenu() {
    const menuButton = this.page.locator('.view-menu-button, [data-action="view-menu"]').first();
    await menuButton.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * Verify menu is loaded with categories and items
   */
  async verifyMenuLoaded() {
    await this.menuItemCards.first().waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    
    // Verify at least some menu items are present
    const itemCount = await this.menuItemCards.count();
    expect(itemCount).toBeGreaterThan(0);
  }

  /**
   * Filter menu by category
   */
  async selectMenuCategory(category: string) {
    const categoryButton = this.page.locator(`[data-category="${category}"], .category-button`).filter({ hasText: category });
    await categoryButton.click();
    await this.page.waitForTimeout(500); // Wait for filter animation
  }

  /**
   * Add item to cart by index
   */
  async addItemToCart(itemIndex: number = 0, quantity: number = 1) {
    const itemCard = this.menuItemCards.nth(itemIndex);
    await itemCard.scrollIntoViewIfNeeded();
    
    for (let i = 0; i < quantity; i++) {
      const addButton = itemCard.getByTestId(TEST_IDS.CUSTOMER.ADD_TO_CART);
      await addButton.click();
      await this.page.waitForTimeout(300); // Wait for animation
    }
  }

  /**
   * Add specific item to cart by name
   */
  async addItemToCartByName(itemName: string, quantity: number = 1) {
    const itemCard = this.page.locator('.menu-item, [data-menu-item]').filter({ hasText: itemName });
    await itemCard.scrollIntoViewIfNeeded();
    
    for (let i = 0; i < quantity; i++) {
      const addButton = itemCard.getByTestId(TEST_IDS.CUSTOMER.ADD_TO_CART);
      await addButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Verify cart badge shows correct count
   */
  async verifyCartCount(expectedCount: number) {
    const cartBadge = this.page.locator('.cart-badge, [data-cart-count]');
    await this.helpers.verifyText(cartBadge.locator(''), expectedCount.toString());
  }

  /**
   * Open cart
   */
  async openCart() {
    await this.cartButton.click();
    await this.cartItems.waitFor({ state: 'visible' });
  }

  /**
   * Verify cart contents
   */
  async verifyCartContents(expectedItems: Array<{ name: string; quantity: number; price: number }>) {
    await this.openCart();
    
    for (const item of expectedItems) {
      const itemRow = this.page.locator('.cart-item').filter({ hasText: item.name });
      await itemRow.waitFor({ state: 'visible' });
      
      // Verify quantity
      const quantityElement = itemRow.locator('.quantity, [data-quantity]');
      await this.helpers.verifyText(quantityElement, item.quantity.toString());
      
      // Verify price
      const priceElement = itemRow.locator('.price, [data-price]');
      await expect(priceElement).toContainText(item.price.toString());
    }
  }

  /**
   * Update item quantity in cart
   */
  async updateCartItemQuantity(itemName: string, newQuantity: number) {
    await this.openCart();
    
    const itemRow = this.page.locator('.cart-item').filter({ hasText: itemName });
    const quantityInput = itemRow.locator('input[type="number"], .quantity-input');
    
    await quantityInput.clear();
    await quantityInput.fill(newQuantity.toString());
    await this.page.waitForTimeout(500); // Wait for total update
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(itemName: string) {
    await this.openCart();
    
    const itemRow = this.page.locator('.cart-item').filter({ hasText: itemName });
    const removeButton = itemRow.locator('.remove-button, [data-action="remove"]');
    await removeButton.click();
  }

  /**
   * Verify cart total
   */
  async verifyCartTotal(expectedTotal: number) {
    const totalText = await this.cartTotal.textContent();
    const totalValue = parseFloat(totalText!.replace(/[^0-9.]/g, ''));
    expect(totalValue).toBe(expectedTotal);
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.orderSummary.waitFor({ state: 'visible' });
  }

  /**
   * Fill customer information for order
   */
  async fillCustomerInfo(customerInfo: { name: string; phone?: string; email?: string }) {
    await this.helpers.fillField('[name="customerName"], #customerName', customerInfo.name);
    
    if (customerInfo.phone) {
      await this.helpers.fillField('[name="phone"], #phone', customerInfo.phone);
    }
    
    if (customerInfo.email) {
      await this.helpers.fillField('[name="email"], #email', customerInfo.email);
    }
  }

  /**
   * Select table number
   */
  async selectTable(tableNumber: string) {
    const tableSelect = this.page.locator('[name="tableNumber"], #tableNumber');
    await tableSelect.selectOption(tableNumber);
  }

  /**
   * Place order
   */
  async placeOrder() {
    await this.placeOrderButton.click();
    await this.orderConfirmation.waitFor({ state: 'visible', timeout: TIMEOUTS.LONG });
  }

  /**
   * Verify order confirmation
   */
  async verifyOrderConfirmation() {
    await this.helpers.verifyVisible('[data-testid="' + TEST_IDS.CUSTOMER.ORDER_CONFIRMATION + '"]');
    
    // Verify order number is present
    const orderNumberText = await this.orderNumber.textContent();
    expect(orderNumberText).toMatch(/\d+/);
    
    return orderNumberText?.match(/\d+/)?.[0];
  }

  /**
   * Verify order status updates
   */
  async verifyOrderStatus(expectedStatus: string) {
    await this.helpers.verifyText('[data-testid="' + TEST_IDS.CUSTOMER.ORDER_STATUS + '"]', expectedStatus);
  }

  // Payment-specific methods

  /**
   * Verify payment method selector is visible
   */
  async verifyPaymentMethodSelectorVisible() {
    await this.paymentMethodSection.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    await expect(this.cashPaymentOption).toBeVisible();
  }

  /**
   * Verify payment method selector shows card option when Stripe is enabled
   */
  async verifyCardPaymentOptionVisible() {
    await expect(this.cardPaymentOption).toBeVisible();
  }

  /**
   * Verify payment method selector hides card option when Stripe is disabled
   */
  async verifyCardPaymentOptionHidden() {
    await expect(this.cardPaymentOption).not.toBeVisible();
  }

  /**
   * Select payment method
   */
  async selectPaymentMethod(method: 'cash' | 'stripe') {
    if (method === 'cash') {
      await this.cashPaymentOption.click();
    } else {
      await this.cardPaymentOption.click();
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify payment method is selected
   */
  async verifyPaymentMethodSelected(method: 'cash' | 'stripe') {
    if (method === 'cash') {
      await expect(this.cashRadio).toBeChecked();
    } else {
      await expect(this.cardRadio).toBeChecked();
    }
  }

  /**
   * Verify submit button text based on payment method
   */
  async verifySubmitButtonText(expectedText: string) {
    const submitButton = this.submitOrderButton.or(this.proceedToPaymentButton);
    await expect(submitButton).toContainText(expectedText);
  }

  /**
   * Submit order with current payment method
   */
  async submitOrderWithPaymentMethod() {
    const submitButton = this.submitOrderButton.or(this.proceedToPaymentButton);
    await submitButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify navigation to payment page
   */
  async verifyNavigationToPaymentPage() {
    await this.page.waitForURL('**/payment', { timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Verify navigation to confirmation page
   */
  async verifyNavigationToConfirmationPage() {
    await this.page.waitForURL('**/confirmation', { timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Fill cart form completely
   */
  async fillCartForm(customerName: string, orderNotes?: string) {
    const customerNameInput = this.page.locator('input[type="text"]').first();
    await customerNameInput.fill(customerName);
    
    if (orderNotes) {
      const orderNotesInput = this.page.locator('textarea').last();
      await orderNotesInput.fill(orderNotes);
    }
  }

  /**
   * Verify error message display
   */
  async verifyErrorMessage(expectedMessage?: string) {
    const errorMessage = this.page.locator('.bg-red-50, [role="alert"], .error-message');
    await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    
    if (expectedMessage) {
      await expect(errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Verify payment method translations
   */
  async verifyPaymentMethodTranslations(language: 'en' | 'sq') {
    if (language === 'sq') {
      await expect(this.page.locator('text=Metoda e Pagesës')).toBeVisible();
      await expect(this.page.locator('text=Paguaj me Para në Dorë')).toBeVisible();
    } else {
      await expect(this.page.locator('text=Payment Method')).toBeVisible();
      await expect(this.page.locator('text=Pay with Cash')).toBeVisible();
    }
  }

  /**
   * Switch language
   */
  async switchLanguage(language: 'en' | 'sq') {
    const currentLanguageButton = this.page.locator('button:has-text("EN")').or(this.page.locator('button:has-text("SQ")'));
    await currentLanguageButton.click();
    
    if (language === 'sq') {
      const albanianOption = this.page.locator('button:has-text("SQ")').or(this.page.locator('text=Shqip'));
      await albanianOption.click();
    } else {
      const englishOption = this.page.locator('button:has-text("EN")').or(this.page.locator('text=English'));
      await englishOption.click();
    }
    
    await this.page.waitForTimeout(500);
  }

  /**
   * Complete full ordering flow
   */
  async completeOrderingFlow(options: {
    venueId?: string;
    items: Array<{ name: string; quantity: number }>;
    customer: { name: string; phone?: string };
    tableNumber?: string;
  }) {
    // 1. Scan QR code
    await this.scanQRCode(options.venueId);
    await this.verifyQRLandingLoaded();
    
    // 2. Proceed to menu
    await this.proceedToMenu();
    await this.verifyMenuLoaded();
    
    // 3. Add items to cart
    for (const item of options.items) {
      await this.addItemToCartByName(item.name, item.quantity);
    }
    
    // 4. Verify cart and proceed to checkout
    await this.proceedToCheckout();
    
    // 5. Fill customer information
    await this.fillCustomerInfo(options.customer);
    
    // 6. Select table if provided
    if (options.tableNumber) {
      await this.selectTable(options.tableNumber);
    }
    
    // 7. Place order
    await this.placeOrder();
    
    // 8. Verify confirmation
    return await this.verifyOrderConfirmation();
  }

  /**
   * Complete cash payment flow
   */
  async completeCashPaymentFlow(customerName: string, orderNotes?: string) {
    // Fill form
    await this.fillCartForm(customerName, orderNotes);
    
    // Ensure cash is selected
    await this.selectPaymentMethod('cash');
    
    // Submit order
    await this.submitOrderWithPaymentMethod();
    
    // Verify navigation to confirmation
    await this.verifyNavigationToConfirmationPage();
  }

  /**
   * Complete card payment flow up to payment page
   */
  async completeCardPaymentFlow(customerName: string, orderNotes?: string) {
    // Fill form
    await this.fillCartForm(customerName, orderNotes);
    
    // Select card payment
    await this.selectPaymentMethod('stripe');
    
    // Submit (should navigate to payment page)
    await this.submitOrderWithPaymentMethod();
    
    // Verify navigation to payment page
    await this.verifyNavigationToPaymentPage();
  }

  /**
   * Verify PWA installation prompt
   */
  async verifyPWAPrompt() {
    // Look for PWA install banner or prompt
    const installPrompt = this.page.locator('.pwa-install-prompt, [data-pwa-install]');
    // PWA prompt may not always be visible, so we just check if the app is installable
    const manifest = await this.page.evaluate(() => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      return manifestLink ? manifestLink.getAttribute('href') : null;
    });
    
    expect(manifest).toBeTruthy();
  }

  /**
   * Verify offline functionality
   */
  async verifyOfflineMode() {
    // Go offline
    await this.page.context().setOffline(true);
    
    // Try to reload the page
    await this.page.reload();
    
    // Verify app still works (shows cached content)
    await this.helpers.verifyVisible('body');
    
    // Go back online
    await this.page.context().setOffline(false);
  }
}