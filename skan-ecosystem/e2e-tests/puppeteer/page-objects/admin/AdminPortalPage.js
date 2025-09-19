const TestData = require('../../utils/test-data');

class AdminPortalPage {
  constructor(page) {
    this.page = page;
    this.testData = TestData;
  }

  // Navigation methods
  async navigateToLogin() {
    const url = this.testData.urls.adminLogin;
    console.log(`Navigating to admin login: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);
  }

  async navigateToDashboard() {
    const url = this.testData.urls.adminDashboard;
    console.log(`Navigating to admin dashboard: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);
  }

  // Authentication methods
  async login(email = 'manager_email1@gmail.com', password = 'demo123') {
    try {
      console.log(`Attempting login with email: ${email}`);
      
      // Wait for login form to load
      await this.page.waitForSelector(this.testData.selectors.admin.emailInput + ', [type="email"], [name="email"]', { timeout: 10000 });
      
      // Fill email
      const emailInput = await this.page.$(this.testData.selectors.admin.emailInput + ', [type="email"], [name="email"]');
      if (emailInput) {
        await emailInput.click();
        await emailInput.clear();
        await emailInput.type(email);
      }

      // Fill password
      const passwordInput = await this.page.$(this.testData.selectors.admin.passwordInput + ', [type="password"], [name="password"]');
      if (passwordInput) {
        await passwordInput.click();
        await passwordInput.clear();
        await passwordInput.type(password);
      }

      // Click login button
      const loginButton = await this.page.$(this.testData.selectors.admin.loginButton + ', [type="submit"], .login-button');
      if (loginButton) {
        await loginButton.click();
        console.log('Login button clicked');
        
        // Wait for navigation or dashboard to load
        await this.page.waitForTimeout(3000);
        
        // Check if we're redirected to dashboard
        const currentUrl = await this.page.url();
        console.log(`After login URL: ${currentUrl}`);
        
        return currentUrl.includes('dashboard') || currentUrl.includes('admin');
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }

  // Dashboard methods
  async validateDashboardLoaded() {
    try {
      // Look for dashboard indicators
      const dashboardIndicators = [
        this.testData.selectors.admin.dashboardTitle,
        '.dashboard',
        '[data-testid="dashboard"]',
        'h1',
        '.orders',
        '.main-content'
      ];

      for (let selector of dashboardIndicators) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          console.log(`Dashboard loaded - found element: ${selector}`);
          return true;
        } catch (e) {
          // Try next selector
        }
      }

      // Check URL as fallback
      const url = await this.page.url();
      if (url.includes('dashboard') || url.includes('admin')) {
        console.log('Dashboard loaded - confirmed by URL');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validating dashboard:', error);
      return false;
    }
  }

  async getNewOrders() {
    try {
      const orderElements = await this.page.$$(this.testData.selectors.admin.newOrderNotification + ', .order-card, .order-item');
      
      const orders = [];
      for (let orderEl of orderElements) {
        const orderData = await this.page.evaluate(el => {
          const numberEl = el.querySelector('.order-number, [data-testid="order-number"]');
          const statusEl = el.querySelector('.order-status, [data-testid="order-status"]');
          const customerEl = el.querySelector('.customer-name, [data-testid="customer-name"]');
          const totalEl = el.querySelector('.order-total, [data-testid="order-total"]');
          
          return {
            number: numberEl ? numberEl.textContent.trim() : '',
            status: statusEl ? statusEl.textContent.trim() : '',
            customer: customerEl ? customerEl.textContent.trim() : '',
            total: totalEl ? totalEl.textContent.trim() : ''
          };
        }, orderEl);
        
        if (orderData.number) {
          orders.push(orderData);
        }
      }
      
      console.log(`Found ${orders.length} orders on dashboard`);
      return orders;
    } catch (error) {
      console.error('Error getting new orders:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId, newStatus = 'preparing') {
    try {
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      // Find the order card
      const orderCards = await this.page.$$(this.testData.selectors.admin.orderCard + ', .order-card, .order-item');
      
      for (let card of orderCards) {
        const orderNumber = await this.page.evaluate(el => {
          const numberEl = el.querySelector('.order-number, [data-testid="order-number"]');
          return numberEl ? numberEl.textContent.trim() : '';
        }, card);
        
        if (orderNumber.includes(orderId)) {
          // Look for status update button
          const statusButton = await card.$(this.testData.selectors.admin.orderStatusButton + ', .status-button, [data-status], button');
          if (statusButton) {
            await statusButton.click();
            await this.page.waitForTimeout(1000);
            console.log(`Updated order ${orderId} status`);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Navigation methods within admin
  async navigateToMenuManagement() {
    try {
      const menuLink = await this.page.$(this.testData.selectors.admin.menuManagementLink + ', [href*="menu"], .menu-nav');
      if (menuLink) {
        await menuLink.click();
        await this.page.waitForTimeout(2000);
        console.log('Navigated to menu management');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error navigating to menu management:', error);
      return false;
    }
  }

  async navigateToUserManagement() {
    try {
      const userLink = await this.page.$(this.testData.selectors.admin.userManagementLink + ', [href*="user"], .user-nav');
      if (userLink) {
        await userLink.click();
        await this.page.waitForTimeout(2000);
        console.log('Navigated to user management');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error navigating to user management:', error);
      return false;
    }
  }

  async navigateToQRCodes() {
    try {
      const qrLink = await this.page.$(this.testData.selectors.admin.qrCodesLink + ', [href*="qr"], .qr-nav');
      if (qrLink) {
        await qrLink.click();
        await this.page.waitForTimeout(2000);
        console.log('Navigated to QR codes');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error navigating to QR codes:', error);
      return false;
    }
  }

  // Validation methods
  async validateLoginFormLoaded() {
    try {
      const emailInput = await this.page.$(this.testData.selectors.admin.emailInput + ', [type="email"], [name="email"]');
      const passwordInput = await this.page.$(this.testData.selectors.admin.passwordInput + ', [type="password"], [name="password"]');
      const loginButton = await this.page.$(this.testData.selectors.admin.loginButton + ', [type="submit"], .login-button');
      
      return !!(emailInput && passwordInput && loginButton);
    } catch (error) {
      console.error('Error validating login form:', error);
      return false;
    }
  }

  async getCurrentUser() {
    try {
      // Look for user info in the admin interface
      const userElements = await this.page.$$('.user-info, .profile, [data-testid="user-name"]');
      
      if (userElements.length > 0) {
        const userInfo = await this.page.evaluate(el => el.textContent, userElements[0]);
        console.log(`Current user: ${userInfo}`);
        return userInfo.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getVenueInfo() {
    try {
      // Look for venue info in the admin interface
      const venueElements = await this.page.$$('.venue-info, .restaurant-name, [data-testid="venue-name"]');
      
      if (venueElements.length > 0) {
        const venueInfo = await this.page.evaluate(el => el.textContent, venueElements[0]);
        console.log(`Current venue: ${venueInfo}`);
        return venueInfo.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting venue info:', error);
      return null;
    }
  }

  async takeScreenshot(name) {
    return await testUtils.takeScreenshot(this.page, `admin-${name}`);
  }

  // Logout method
  async logout() {
    try {
      const logoutButton = await this.page.$('.logout, [data-testid="logout"], [href*="logout"]');
      if (logoutButton) {
        await logoutButton.click();
        await this.page.waitForTimeout(2000);
        console.log('Logged out successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }
}

module.exports = AdminPortalPage;