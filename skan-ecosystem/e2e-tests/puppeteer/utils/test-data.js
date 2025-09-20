// Test data generators and constants for E2E tests

class TestData {
  static venues = {
    beachBar: {
      slug: 'beach-bar-durres',
      name: 'Beach Bar Durrës',
      tableNumber: 'a1',
      qrUrl: 'https://order.skan.al/beach-bar-durres/a1'
    },
    demo: {
      slug: 'beach-bar-durres',
      name: 'Beach Bar Durrës',
      tableNumber: 'a1',
      qrUrl: 'https://order.skan.al/beach-bar-durres/a1'
    }
  };

  static users = {
    manager: {
      email: 'manager_email1@gmail.com',
      password: 'demo123',
      role: 'manager'
    },
    testUser: {
      email: 'test@skan.al',
      password: 'TestPassword123!',
      role: 'staff'
    }
  };

  static menuItems = {
    albanianBeer: {
      name: 'Albanian Beer',
      price: 350,
      category: 'Drinks'
    },
    greekSalad: {
      name: 'Greek Salad', 
      price: 900,
      category: 'Salads'
    },
    seafoodRisotto: {
      name: 'Seafood Risotto',
      price: 1800,
      category: 'Main Courses'
    }
  };

  static generateCustomerData() {
    const timestamp = Date.now();
    return {
      name: `Test Customer ${timestamp}`,
      email: `customer${timestamp}@test.com`,
      phone: `+355${Math.floor(Math.random() * 1000000000)}`
    };
  }

  static generateOrderData(venueId = 'beach-bar-durres', tableNumber = 'a1') {
    const customer = this.generateCustomerData();
    return {
      venueId,
      tableNumber,
      customerName: customer.name,
      items: [
        {
          id: 'albanian-beer-001',
          name: 'Albanian Beer',
          price: 3.50,
          quantity: 2
        },
        {
          id: 'greek-salad-001',
          name: 'Greek Salad',
          price: 8.50,
          quantity: 1
        }
      ],
      specialInstructions: `Test order created at ${new Date().toISOString()}`
    };
  }

  static generateVenueData() {
    const timestamp = Date.now();
    return {
      venueName: `Test Restaurant ${timestamp}`,
      address: `${Math.floor(Math.random() * 999)} Test Street, Tirana`,
      phone: `+355${Math.floor(Math.random() * 1000000000)}`,
      description: 'Test restaurant for E2E testing',
      currency: 'EUR',
      ownerName: 'Test Owner',
      ownerEmail: `owner${timestamp}@test.com`,
      password: 'TestPassword123!',
      tableCount: 10
    };
  }

  static contactFormData = {
    name: 'Test Contact',
    email: 'contact@test.com',
    restaurant: 'Test Restaurant',
    phone: '+355691234567',
    message: 'This is a test message from E2E tests'
  };

  static waitTimes = {
    short: 2000,      // 2 seconds
    medium: 5000,     // 5 seconds
    long: 10000,      // 10 seconds
    apiCall: 15000,   // 15 seconds for API calls
    pageLoad: 30000   // 30 seconds for page loads
  };

  static selectors = {
    // Customer app selectors
    customer: {
      languageToggle: '[data-testid="language-toggle"]',
      menuCategory: '.menu-category',
      menuItem: '.menu-item',
      addToCartButton: '[data-testid="add-to-cart"]',
      cartIcon: '[data-testid="cart-icon"]',
      cartTotal: '[data-testid="cart-total"]',
      checkoutButton: '[data-testid="checkout"]',
      customerNameInput: '[data-testid="customer-name"]',
      specialInstructionsInput: '[data-testid="special-instructions"]',
      submitOrderButton: '[data-testid="submit-order"]',
      orderNumber: '[data-testid="order-number"]',
      orderStatus: '[data-testid="order-status"]'
    },

    // Admin portal selectors
    admin: {
      emailInput: '[data-testid="email-input"]',
      passwordInput: '[data-testid="password-input"]',
      loginButton: '[data-testid="login-button"]',
      dashboardTitle: '[data-testid="dashboard-title"]',
      newOrderNotification: '[data-testid="new-order"]',
      orderCard: '.order-card',
      orderStatusButton: '[data-testid="order-status-button"]',
      menuManagementLink: '[data-testid="menu-management"]',
      userManagementLink: '[data-testid="user-management"]',
      qrCodesLink: '[data-testid="qr-codes"]'
    },

    // Marketing site selectors
    marketing: {
      heroTitle: 'h1',
      ctaButton: '[data-testid="cta-button"]',
      contactForm: '[data-testid="contact-form"]',
      nameInput: '[data-testid="name-input"]',
      emailInput: '[data-testid="email-input"]',
      restaurantInput: '[data-testid="restaurant-input"]',
      phoneInput: '[data-testid="phone-input"]',
      messageInput: '[data-testid="message-input"]',
      submitButton: '[data-testid="submit-button"]',
      successMessage: '[data-testid="success-message"]'
    }
  };

  static urls = {
    marketing: 'https://skan.al',
    customer: 'https://order.skan.al',
    admin: 'https://admin.skan.al',
    api: 'https://api.skan.al',
    
    // Specific pages
    customerQr: (venueSlug, tableNumber) => `https://order.skan.al/${venueSlug}/${tableNumber}`,
    customerMenu: (venueSlug, tableNumber) => `https://order.skan.al/${venueSlug}/${tableNumber}/menu`,
    orderTracking: (orderNumber) => `https://order.skan.al/track/${orderNumber}`,
    adminLogin: 'https://admin.skan.al/login',
    adminDashboard: 'https://admin.skan.al/dashboard',
    marketingContact: 'https://skan.al/contact'
  };

  static expectedTexts = {
    english: {
      welcome: 'Welcome to',
      menu: 'Menu',
      cart: 'Cart',
      total: 'Total',
      orderConfirmation: 'Order Confirmed',
      orderNumber: 'Order Number',
      trackOrder: 'Track Order'
    },
    albanian: {
      welcome: 'Mirë se vini në',
      menu: 'Menyja',
      cart: 'Shporta',
      total: 'Totali',
      orderConfirmation: 'Porosia u Konfirmua',
      orderNumber: 'Numri i Porosisë',
      trackOrder: 'Gjurmo Porosinë'
    }
  };
}

module.exports = TestData;