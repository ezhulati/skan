import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { TEST_IDS, TEST_DATA, TIMEOUTS } from '../test-data/constants';

export class AdminPortalPage {
  private helpers: TestHelpers;

  // Login elements
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginError: Locator;
  
  // Dashboard elements
  readonly dashboard: Locator;
  readonly welcomeMessage: Locator;
  readonly statsCards: Locator;
  readonly logoutButton: Locator;
  
  // Orders elements
  readonly ordersList: Locator;
  readonly orderCards: Locator;
  readonly orderStatusFilter: Locator;
  readonly searchInput: Locator;
  readonly refreshButton: Locator;
  
  // Order details elements
  readonly orderDetails: Locator;
  readonly orderInfo: Locator;
  readonly orderItems: Locator;
  readonly customerInfo: Locator;
  readonly updateStatusButton: Locator;
  readonly statusSelect: Locator;

  constructor(public page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Login
    this.loginForm = page.getByTestId(TEST_IDS.ADMIN.LOGIN_FORM);
    this.emailInput = page.getByTestId(TEST_IDS.ADMIN.LOGIN_EMAIL);
    this.passwordInput = page.getByTestId(TEST_IDS.ADMIN.LOGIN_PASSWORD);
    this.loginButton = page.getByTestId(TEST_IDS.ADMIN.LOGIN_BUTTON);
    this.loginError = page.locator('.login-error, .error-message');
    
    // Dashboard
    this.dashboard = page.getByTestId(TEST_IDS.ADMIN.DASHBOARD);
    this.welcomeMessage = page.locator('.welcome-message, h1');
    this.statsCards = page.locator('.stats-card, [data-stat]');
    this.logoutButton = page.getByTestId(TEST_IDS.ADMIN.LOGOUT_BUTTON);
    
    // Orders
    this.ordersList = page.getByTestId(TEST_IDS.ADMIN.ORDERS_LIST);
    this.orderCards = page.getByTestId(TEST_IDS.ADMIN.ORDER_CARD);
    this.orderStatusFilter = page.getByTestId(TEST_IDS.ADMIN.ORDER_STATUS_FILTER);
    this.searchInput = page.locator('[placeholder*="Search"], .search-input');
    this.refreshButton = page.locator('.refresh-button, [data-action="refresh"]');
    
    // Order details
    this.orderDetails = page.getByTestId(TEST_IDS.ADMIN.ORDER_DETAILS);
    this.orderInfo = page.locator('.order-info');
    this.orderItems = page.locator('.order-items');
    this.customerInfo = page.locator('.customer-info');
    this.updateStatusButton = page.getByTestId(TEST_IDS.ADMIN.UPDATE_ORDER_STATUS);
    this.statusSelect = page.locator('[name="status"], .status-select');
  }

  /**
   * Navigate to admin portal
   */
  async goto() {
    await this.helpers.navigateToApp('admin');
  }

  /**
   * Login with credentials
   */
  async login(credentials = TEST_DATA.ADMIN_CREDENTIALS) {
    await this.goto();
    await this.loginForm.waitFor({ state: 'visible' });
    
    await this.helpers.fillField('[data-testid="' + TEST_IDS.ADMIN.LOGIN_EMAIL + '"]', credentials.email);
    await this.helpers.fillField('[data-testid="' + TEST_IDS.ADMIN.LOGIN_PASSWORD + '"]', credentials.password);
    
    await this.loginButton.click();
    await this.dashboard.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Verify login page is loaded
   */
  async verifyLoginPageLoaded() {
    await this.loginForm.waitFor({ state: 'visible' });
    await this.helpers.verifyVisible('[data-testid="' + TEST_IDS.ADMIN.LOGIN_EMAIL + '"]');
    await this.helpers.verifyVisible('[data-testid="' + TEST_IDS.ADMIN.LOGIN_PASSWORD + '"]');
    await this.helpers.verifyVisible('[data-testid="' + TEST_IDS.ADMIN.LOGIN_BUTTON + '"]');
  }

  /**
   * Verify dashboard is loaded
   */
  async verifyDashboardLoaded() {
    await this.dashboard.waitFor({ state: 'visible' });
    await this.helpers.verifyVisible('.welcome-message, h1');
  }

  /**
   * Verify login error
   */
  async verifyLoginError(expectedError: string) {
    await this.loginError.waitFor({ state: 'visible' });
    await this.helpers.verifyText('.login-error, .error-message', expectedError);
  }

  /**
   * Logout
   */
  async logout() {
    await this.logoutButton.click();
    await this.loginForm.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to orders page
   */
  async navigateToOrders() {
    const ordersLink = this.page.locator('[href*="orders"], .nav-orders');
    await ordersLink.click();
    await this.ordersList.waitFor({ state: 'visible' });
  }

  /**
   * Verify orders list is loaded
   */
  async verifyOrdersListLoaded() {
    await this.ordersList.waitFor({ state: 'visible' });
    
    // Verify orders are present (or empty state)
    const orderCount = await this.orderCards.count();
    const emptyState = this.page.locator('.empty-state, .no-orders');
    
    if (orderCount === 0) {
      await emptyState.waitFor({ state: 'visible' });
    } else {
      expect(orderCount).toBeGreaterThan(0);
    }
  }

  /**
   * Filter orders by status
   */
  async filterOrdersByStatus(status: 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled') {
    await this.orderStatusFilter.selectOption(status);
    await this.page.waitForTimeout(1000); // Wait for filter to apply
  }

  /**
   * Search for orders
   */
  async searchOrders(searchTerm: string) {
    await this.helpers.fillField('[placeholder*="Search"], .search-input', searchTerm);
    await this.page.waitForTimeout(1000); // Wait for search to apply
  }

  /**
   * Click on order to view details
   */
  async viewOrderDetails(orderIndex: number = 0) {
    const orderCard = this.orderCards.nth(orderIndex);
    await orderCard.click();
    await this.orderDetails.waitFor({ state: 'visible' });
  }

  /**
   * Verify order details
   */
  async verifyOrderDetails(expectedOrder: {
    orderId: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    status: string;
  }) {
    await this.orderDetails.waitFor({ state: 'visible' });
    
    // Verify order ID
    await this.helpers.verifyText('.order-id', expectedOrder.orderId);
    
    // Verify customer name
    await this.helpers.verifyText('.customer-name', expectedOrder.customerName);
    
    // Verify order status
    await this.helpers.verifyText('.order-status', expectedOrder.status);
    
    // Verify items
    for (const item of expectedOrder.items) {
      const itemRow = this.page.locator('.order-item').filter({ hasText: item.name });
      await itemRow.waitFor({ state: 'visible' });
      
      await this.helpers.verifyText(itemRow.locator('.quantity'), item.quantity.toString());
      await expect(itemRow.locator('.price')).toContainText(item.price.toString());
    }
    
    // Verify total
    await expect(this.page.locator('.order-total')).toContainText(expectedOrder.total.toString());
  }

  /**
   * Update order status
   */
  async updateOrderStatus(newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled') {
    await this.statusSelect.selectOption(newStatus);
    await this.updateStatusButton.click();
    
    // Wait for update confirmation
    await this.page.waitForTimeout(1000);
    
    // Verify status was updated
    await this.helpers.verifyText('.order-status', newStatus);
  }

  /**
   * Refresh orders list
   */
  async refreshOrders() {
    await this.refreshButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify real-time order updates
   */
  async verifyRealTimeUpdates() {
    // Get initial order count
    const initialCount = await this.orderCards.count();
    
    // Mock a new order coming in (this would normally come from websocket/polling)
    await this.helpers.mockApiResponse('/api/orders', {
      orders: [
        ...Array(initialCount).fill(null).map((_, i) => ({
          id: `order-${i + 1}`,
          status: 'pending',
          customerName: `Customer ${i + 1}`,
          total: 25.99,
          items: []
        })),
        {
          id: 'order-new',
          status: 'pending',
          customerName: 'New Customer',
          total: 15.99,
          items: []
        }
      ]
    });
    
    // Trigger refresh
    await this.refreshOrders();
    
    // Verify new order appears
    const newCount = await this.orderCards.count();
    expect(newCount).toBe(initialCount + 1);
  }

  /**
   * Verify dashboard statistics
   */
  async verifyDashboardStats() {
    await this.verifyDashboardLoaded();
    
    // Verify stats cards are present
    const statsCount = await this.statsCards.count();
    expect(statsCount).toBeGreaterThanOrEqual(3); // At least total orders, pending, completed
    
    // Verify each stat card has a number
    const statsCards = await this.statsCards.all();
    for (const card of statsCards) {
      const statValue = await card.locator('.stat-value, .number').textContent();
      expect(statValue).toMatch(/\d+/);
    }
  }

  /**
   * Verify order notifications
   */
  async verifyOrderNotifications() {
    // Look for notification badge or indicator
    const notificationBadge = this.page.locator('.notification-badge, .badge');
    
    if (await notificationBadge.isVisible()) {
      const badgeText = await notificationBadge.textContent();
      expect(parseInt(badgeText!)).toBeGreaterThan(0);
    }
  }

  /**
   * Verify bulk order actions
   */
  async verifyBulkActions() {
    // Select multiple orders
    const checkboxes = this.page.locator('.order-checkbox, input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 1) {
      await checkboxes.first().check();
      await checkboxes.nth(1).check();
      
      // Verify bulk action menu appears
      const bulkActions = this.page.locator('.bulk-actions, .selected-actions');
      await bulkActions.waitFor({ state: 'visible' });
    }
  }

  /**
   * Test admin workflow: login -> view orders -> update status -> logout
   */
  async completeAdminWorkflow(options: {
    credentials?: typeof TEST_DATA.ADMIN_CREDENTIALS;
    orderIndex?: number;
    newStatus?: 'preparing' | 'ready' | 'completed';
  } = {}) {
    // 1. Login
    await this.login(options.credentials);
    await this.verifyDashboardLoaded();
    
    // 2. Navigate to orders
    await this.navigateToOrders();
    await this.verifyOrdersListLoaded();
    
    // 3. View order details
    const orderIndex = options.orderIndex ?? 0;
    await this.viewOrderDetails(orderIndex);
    
    // 4. Update order status
    const newStatus = options.newStatus ?? 'preparing';
    await this.updateOrderStatus(newStatus);
    
    // 5. Verify status was updated
    await this.helpers.verifyText('.order-status', newStatus);
    
    // 6. Logout
    await this.logout();
    await this.verifyLoginPageLoaded();
  }

  /**
   * Verify admin permissions and security
   */
  async verifyAdminSecurity() {
    // Try to access admin without login
    await this.goto();
    await this.verifyLoginPageLoaded();
    
    // Try direct navigation to protected routes
    await this.page.goto('http://localhost:3002/dashboard');
    
    // Should redirect to login
    await this.verifyLoginPageLoaded();
  }
}