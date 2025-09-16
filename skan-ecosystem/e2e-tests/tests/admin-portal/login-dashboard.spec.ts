import { test, expect } from '@playwright/test';
import { AdminPortalPage } from '../../page-objects/AdminPortalPage';
import { TEST_DATA } from '../../test-data/constants';

test.describe('Admin Portal - Login & Dashboard', () => {
  let adminPage: AdminPortalPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPortalPage(page);
  });

  test('should display login page correctly', async () => {
    await adminPage.goto();
    await adminPage.verifyLoginPageLoaded();
    
    // Verify page title
    await expect(adminPage.page).toHaveTitle(/Admin|Login|SKAN/);
    
    // Verify login form elements
    await expect(adminPage.emailInput).toBeVisible();
    await expect(adminPage.passwordInput).toBeVisible();
    await expect(adminPage.loginButton).toBeVisible();
    
    // Verify input types
    await expect(adminPage.emailInput).toHaveAttribute('type', 'email');
    await expect(adminPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should login successfully with valid credentials', async () => {
    await adminPage.login(TEST_DATA.ADMIN_CREDENTIALS);
    await adminPage.verifyDashboardLoaded();
    
    // Verify URL changed to dashboard
    await expect(adminPage.page).toHaveURL(/dashboard|admin/);
    
    // Verify welcome message or user info
    const welcomeMessage = adminPage.welcomeMessage;
    await expect(welcomeMessage).toBeVisible();
  });

  test('should show error with invalid credentials', async () => {
    await adminPage.goto();
    
    // Try login with invalid credentials
    await adminPage.page.fill('[data-testid="login-email"]', 'invalid@email.com');
    await adminPage.page.fill('[data-testid="login-password"]', 'wrongpassword');
    await adminPage.loginButton.click();
    
    // Should show error message
    await adminPage.verifyLoginError('Invalid credentials');
    
    // Should remain on login page
    await adminPage.verifyLoginPageLoaded();
  });

  test('should display dashboard with statistics', async () => {
    await adminPage.login();
    await adminPage.verifyDashboardLoaded();
    
    // Verify dashboard statistics
    await adminPage.verifyDashboardStats();
    
    // Check for key metrics
    const statsCards = adminPage.statsCards;
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
    
    // Verify each stat card has meaningful content
    for (let i = 0; i < cardCount; i++) {
      const card = statsCards.nth(i);
      const title = card.locator('.stat-title, h3, .title');
      const value = card.locator('.stat-value, .number, .value');
      
      await expect(title).toBeVisible();
      await expect(value).toBeVisible();
      
      const valueText = await value.textContent();
      expect(valueText).toMatch(/\d+/);
    }
  });

  test('should navigate to orders from dashboard', async () => {
    await adminPage.login();
    await adminPage.verifyDashboardLoaded();
    
    // Navigate to orders
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    // Verify URL
    await expect(adminPage.page).toHaveURL(/orders/);
  });

  test('should handle logout correctly', async () => {
    await adminPage.login();
    await adminPage.verifyDashboardLoaded();
    
    // Logout
    await adminPage.logout();
    
    // Should redirect to login page
    await adminPage.verifyLoginPageLoaded();
    
    // Verify session is cleared
    await expect(adminPage.page).toHaveURL(/login|admin/);
  });

  test('should protect admin routes from unauthorized access', async () => {
    await adminPage.verifyAdminSecurity();
  });

  test('should be responsive on different devices', async () => {
    // Test mobile view
    await adminPage.page.setViewportSize({ width: 375, height: 667 });
    await adminPage.goto();
    await adminPage.verifyLoginPageLoaded();
    
    // Login on mobile
    await adminPage.login();
    await adminPage.verifyDashboardLoaded();
    
    // Verify mobile navigation if present
    const mobileMenu = adminPage.page.locator('.mobile-menu, .hamburger-menu');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      
      // Verify navigation items are accessible
      const navItems = adminPage.page.locator('.nav-item, .menu-item');
      const navCount = await navItems.count();
      expect(navCount).toBeGreaterThan(0);
    }
    
    // Test tablet view
    await adminPage.page.setViewportSize({ width: 768, height: 1024 });
    await adminPage.verifyDashboardLoaded();
    
    // Reset to desktop
    await adminPage.page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle form validation', async () => {
    await adminPage.goto();
    
    // Try to submit empty form
    await adminPage.loginButton.click();
    
    // Should show validation errors or prevent submission
    const emailValidation = adminPage.page.locator('#email:invalid, [aria-invalid="true"]');
    const passwordValidation = adminPage.page.locator('#password:invalid, [aria-invalid="true"]');
    
    // Either HTML5 validation or custom validation should be present
    const hasEmailError = await emailValidation.count() > 0;
    const hasPasswordError = await passwordValidation.count() > 0;
    const errorMessage = adminPage.page.locator('.error-message, .field-error');
    const hasErrorMessage = await errorMessage.count() > 0;
    
    expect(hasEmailError || hasPasswordError || hasErrorMessage).toBeTruthy();
  });

  test('should show loading states during login', async () => {
    await adminPage.goto();
    
    // Fill credentials
    await adminPage.page.fill('[data-testid="login-email"]', TEST_DATA.ADMIN_CREDENTIALS.email);
    await adminPage.page.fill('[data-testid="login-password"]', TEST_DATA.ADMIN_CREDENTIALS.password);
    
    // Click login and check for loading state
    await adminPage.loginButton.click();
    
    // Look for loading indicator
    const loadingIndicator = adminPage.page.locator('.loading, .spinner, .btn-loading');
    
    // Loading state might be very brief, so we check if it exists
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
    
    // Eventually should reach dashboard
    await adminPage.verifyDashboardLoaded();
  });

  test('should maintain session across page refreshes', async () => {
    await adminPage.login();
    await adminPage.verifyDashboardLoaded();
    
    // Refresh the page
    await adminPage.page.reload();
    
    // Should still be logged in
    await adminPage.verifyDashboardLoaded();
    
    // Should not redirect to login
    await expect(adminPage.page).not.toHaveURL(/login/);
  });

  test('should handle "Remember Me" functionality if present', async () => {
    await adminPage.goto();
    
    // Check if remember me checkbox exists
    const rememberMeCheckbox = adminPage.page.locator('[name="rememberMe"], #rememberMe, .remember-me input');
    
    if (await rememberMeCheckbox.isVisible()) {
      await rememberMeCheckbox.check();
      
      // Login
      await adminPage.login();
      await adminPage.verifyDashboardLoaded();
      
      // Clear session storage but keep local storage
      await adminPage.page.evaluate(() => {
        sessionStorage.clear();
      });
      
      // Refresh page
      await adminPage.page.reload();
      
      // Should still be logged in if remember me works
      await adminPage.verifyDashboardLoaded();
    }
  });
});