export const URLs = {
  MARKETING_SITE: 'http://localhost:4321',
  CUSTOMER_APP: 'http://localhost:3000',
  ADMIN_PORTAL: 'http://localhost:3002',
} as const;

export const TEST_IDS = {
  // Marketing Site
  MARKETING: {
    NAV_LOGO: 'nav-logo',
    NAV_FEATURES: 'nav-features',
    NAV_PRICING: 'nav-pricing',
    NAV_DEMO: 'nav-demo',
    HERO_CTA: 'hero-cta',
    FEATURES_SECTION: 'features-section',
    PRICING_SECTION: 'pricing-section',
    CONTACT_FORM: 'contact-form',
  },
  
  // Customer App
  CUSTOMER: {
    QR_SCANNER: 'qr-scanner',
    VENUE_INFO: 'venue-info',
    MENU_CATEGORY: 'menu-category',
    MENU_ITEM: 'menu-item',
    ADD_TO_CART: 'add-to-cart',
    CART_BUTTON: 'cart-button',
    CART_ITEMS: 'cart-items',
    CART_TOTAL: 'cart-total',
    CHECKOUT_BUTTON: 'checkout-button',
    ORDER_SUMMARY: 'order-summary',
    PLACE_ORDER: 'place-order',
    ORDER_CONFIRMATION: 'order-confirmation',
    ORDER_STATUS: 'order-status',
  },
  
  // Admin Portal
  ADMIN: {
    LOGIN_FORM: 'login-form',
    LOGIN_EMAIL: 'login-email',
    LOGIN_PASSWORD: 'login-password',
    LOGIN_BUTTON: 'login-button',
    DASHBOARD: 'dashboard',
    ORDERS_LIST: 'orders-list',
    ORDER_CARD: 'order-card',
    ORDER_STATUS_FILTER: 'order-status-filter',
    ORDER_DETAILS: 'order-details',
    UPDATE_ORDER_STATUS: 'update-order-status',
    LOGOUT_BUTTON: 'logout-button',
  },
} as const;

export const TEST_DATA = {
  ADMIN_CREDENTIALS: {
    email: 'admin@skan.al',
    password: 'testpassword123',
  },
  
  SAMPLE_VENUE: {
    id: 'test-venue-123',
    name: 'Test Restaurant',
    address: '123 Test Street, Test City',
  },
  
  SAMPLE_MENU_ITEMS: [
    {
      id: 'item-1',
      name: 'Classic Burger',
      description: 'Juicy beef patty with lettuce, tomato, and cheese',
      price: 12.99,
      category: 'Burgers',
    },
    {
      id: 'item-2',
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with Caesar dressing',
      price: 8.99,
      category: 'Salads',
    },
    {
      id: 'item-3',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and basil',
      price: 14.99,
      category: 'Pizza',
    },
  ],
  
  SAMPLE_ORDER: {
    id: 'order-123',
    items: [
      { id: 'item-1', quantity: 2, price: 12.99 },
      { id: 'item-2', quantity: 1, price: 8.99 },
    ],
    total: 34.97,
    status: 'pending',
    customerName: 'Test Customer',
    orderTime: new Date().toISOString(),
  },
} as const;

export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
} as const;

export const VIEWPORTS = {
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1280, height: 720 },
  LARGE_DESKTOP: { width: 1920, height: 1080 },
} as const;