# SKAN.AL E2E Testing Setup Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd e2e-tests
npm install
npx playwright install
npx playwright install-deps
```

### 2. Start All Applications
```bash
# Terminal 1 - Marketing Site (port 4321)
cd ../marketing-site
npm run dev

# Terminal 2 - Customer App (port 3000)
cd ../customer-app  
npm start

# Terminal 3 - Admin Portal (port 3002)
cd ../admin-portal
npm run dev
```

### 3. Run Tests
```bash
cd e2e-tests
npm run test:e2e
```

## 📁 Project Structure

```
e2e-tests/
├── tests/
│   ├── marketing-site/           # Marketing site tests
│   │   ├── homepage.spec.ts
│   │   └── features-pricing.spec.ts
│   ├── customer-app/             # Customer app tests
│   │   └── qr-ordering-flow.spec.ts
│   ├── admin-portal/             # Admin portal tests
│   │   ├── login-dashboard.spec.ts
│   │   └── order-management.spec.ts
│   ├── accessibility/            # WCAG compliance tests
│   │   └── wcag-compliance.spec.ts
│   └── integration/              # Cross-app integration tests
│       └── end-to-end-flow.spec.ts
├── page-objects/                 # Page Object Model classes
│   ├── MarketingSitePage.ts
│   ├── CustomerAppPage.ts
│   └── AdminPortalPage.ts
├── helpers/                      # Utility functions
│   └── test-helpers.ts
├── test-data/                    # Test constants and data
│   └── constants.ts
├── .github/workflows/            # CI/CD configuration
│   └── e2e-tests.yml
├── playwright.config.ts          # Playwright configuration
├── global-setup.ts              # Global test setup
├── global-teardown.ts           # Global test cleanup
├── tsconfig.json                # TypeScript configuration
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore file
└── README.md                    # Comprehensive documentation
```

## 🧪 Test Coverage

### Marketing Site (Port 4321)
- ✅ Homepage functionality and navigation
- ✅ Features and pricing pages
- ✅ Contact form submission
- ✅ SEO compliance
- ✅ Responsive design
- ✅ Performance benchmarks

### Customer App (Port 3000)
- ✅ QR code scanning simulation
- ✅ Menu browsing and filtering
- ✅ Cart management (add/remove/update)
- ✅ Checkout process
- ✅ Order confirmation
- ✅ PWA functionality
- ✅ Mobile responsiveness

### Admin Portal (Port 3002)
- ✅ Login/logout functionality
- ✅ Dashboard statistics
- ✅ Order management
- ✅ Order status updates
- ✅ Real-time updates
- ✅ Security and permissions

### Accessibility
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Touch target sizes (44px minimum)
- ✅ Color contrast ratios
- ✅ ARIA labels and landmarks

### Integration
- ✅ End-to-end customer journey
- ✅ Cross-application data consistency
- ✅ Real-time order flow
- ✅ Performance under load
- ✅ Error handling scenarios

## 🎯 Key Test Scenarios

### Critical User Journeys

1. **Complete Customer Journey**
   ```
   Marketing Site → QR Scan → Menu Browse → Add Items → Checkout → Order Confirmation
   ```

2. **Admin Order Management**
   ```
   Login → View Orders → Update Status → Order Fulfillment
   ```

3. **Real-time Flow**
   ```
   Customer Places Order → Admin Receives → Status Updates → Customer Sees Updates
   ```

## 🔧 Configuration Files

### Environment Variables (.env)
```bash
# Application URLs
MARKETING_SITE_URL=http://localhost:4321
CUSTOMER_APP_URL=http://localhost:3000
ADMIN_PORTAL_URL=http://localhost:3002

# Test Configuration
ADMIN_EMAIL=admin@skan.al
ADMIN_PASSWORD=testpassword123
TEST_VENUE_ID=test-venue-123
```

### Playwright Config Features
- ✅ Multi-browser testing (Chrome, Firefox, Safari)
- ✅ Mobile device simulation
- ✅ Automatic server startup
- ✅ Parallel test execution
- ✅ Screenshot/video on failure
- ✅ Trace collection
- ✅ HTML reporting

## 📊 Test Commands

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all tests |
| `npm run test:e2e:ui` | Run with Playwright UI |
| `npm run test:e2e:headed` | Run in headed mode |
| `npm run test:e2e:debug` | Debug mode |
| `npm run test:marketing` | Marketing site only |
| `npm run test:customer` | Customer app only |
| `npm run test:admin` | Admin portal only |
| `npm run test:accessibility` | Accessibility tests |
| `npm run test:mobile` | Mobile tests |
| `npm run test:desktop` | Desktop tests |

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's running on ports
   lsof -i :3000 -i :3002 -i :4321
   
   # Kill processes if needed
   kill -9 $(lsof -t -i:3000)
   ```

2. **Browser installation:**
   ```bash
   npx playwright install --force
   npx playwright install-deps
   ```

3. **Test timeouts:**
   - Increase timeout in `playwright.config.ts`
   - Check application startup time
   - Verify network connectivity

## 🔄 CI/CD Integration

### GitHub Actions Workflow
- ✅ Cross-browser testing
- ✅ Accessibility compliance verification
- ✅ Mobile responsiveness testing
- ✅ Performance regression detection
- ✅ Integration testing across applications
- ✅ Automatic report generation
- ✅ GitHub Pages deployment

### Pipeline Stages
1. **Setup** - Install dependencies and browsers
2. **Start Services** - Launch all three applications
3. **Test Execution** - Run tests in parallel
4. **Report Generation** - Compile results and artifacts
5. **Deployment** - Deploy reports to GitHub Pages

## 🎨 Page Object Model

### Structure
```typescript
// Example: CustomerAppPage.ts
export class CustomerAppPage {
  // Locators
  readonly cartButton: Locator;
  readonly menuItems: Locator;
  
  // Actions
  async addItemToCart(itemIndex: number) { ... }
  async proceedToCheckout() { ... }
  
  // Verifications
  async verifyCartCount(count: number) { ... }
  async verifyOrderConfirmation() { ... }
}
```

### Benefits
- ✅ Maintainable test code
- ✅ Reusable components
- ✅ Centralized element selectors
- ✅ Business logic encapsulation

## 📈 Quality Metrics

### Performance Targets
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **Mobile Performance**: Lighthouse score > 90

### Accessibility Goals
- **WCAG Compliance**: 2.1 AA level
- **Touch Targets**: Minimum 44px
- **Color Contrast**: 4.5:1 ratio minimum

### Test Quality
- **Pass Rate**: > 95%
- **Coverage**: 100% of critical paths
- **Flakiness**: < 5% failure rate

## 🔐 Security Testing

### Areas Covered
- ✅ Admin authentication
- ✅ Session management
- ✅ Route protection
- ✅ Data validation
- ✅ XSS prevention

## 🌍 Cross-Browser Support

### Tested Browsers
- ✅ Chromium (Desktop & Mobile)
- ✅ Firefox (Desktop)
- ✅ WebKit/Safari (Desktop & Mobile)

### Device Coverage
- ✅ iPhone 12
- ✅ Pixel 5
- ✅ iPad Pro
- ✅ Desktop (1280x720, 1920x1080)

## 📝 Best Practices Implemented

1. **Test Organization**: Clear folder structure by application
2. **Page Object Model**: Maintainable and reusable code
3. **Explicit Waits**: Reliable element interactions
4. **Test Data Management**: Centralized constants
5. **Error Handling**: Graceful test failures
6. **Accessibility First**: Built-in accessibility checks
7. **Mobile Responsive**: Touch target validation
8. **Performance Aware**: Load time monitoring
9. **CI/CD Ready**: Automated pipeline integration
10. **Documentation**: Comprehensive guides and examples

## 🎯 Next Steps

1. **Run Initial Test Suite**: Verify all tests pass
2. **Customize Test Data**: Update constants for your environment
3. **Add Custom Tests**: Extend with application-specific scenarios
4. **Monitor Performance**: Track metrics over time
5. **Integrate with CI/CD**: Set up automated testing pipeline

---

Ready to ensure the quality and reliability of your SKAN.AL QR ordering system! 🚀