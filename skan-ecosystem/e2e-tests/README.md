# SKAN.AL E2E Testing Suite

Comprehensive end-to-end testing for the SKAN.AL QR ordering system using Playwright.

## 🎯 Overview

This testing suite covers all three applications in the SKAN.AL ecosystem:
- **Marketing Site** (port 4321) - Astro static site
- **Customer App** (port 3000) - React PWA for QR ordering
- **Admin Portal** (port 3002) - React admin dashboard

## 🏗️ Architecture

```
e2e-tests/
├── tests/                     # Test files organized by application
│   ├── marketing-site/        # Marketing site tests
│   ├── customer-app/          # Customer app tests
│   ├── admin-portal/          # Admin portal tests
│   ├── accessibility/         # WCAG compliance tests
│   └── integration/           # Cross-application tests
├── page-objects/              # Page Object Model classes
├── helpers/                   # Utility functions and helpers
├── test-data/                 # Test constants and data
├── playwright.config.ts       # Playwright configuration
└── .github/workflows/         # CI/CD pipeline
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- All three applications running locally
- Playwright browsers installed

### Installation

1. **Navigate to e2e-tests directory:**
   ```bash
   cd e2e-tests
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npm run install:browsers
   npm run install:deps
   ```

4. **Start all applications:**
   ```bash
   # Terminal 1 - Marketing Site
   cd ../marketing-site && npm run dev

   # Terminal 2 - Customer App  
   cd ../customer-app && npm start

   # Terminal 3 - Admin Portal
   cd ../admin-portal && npm run dev
   ```

5. **Run tests:**
   ```bash
   npm run test:e2e
   ```

## 📋 Test Scripts

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Run tests with Playwright UI |
| `npm run test:e2e:headed` | Run tests in headed mode |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:report` | Show test report |
| `npm run test:marketing` | Run marketing site tests only |
| `npm run test:customer` | Run customer app tests only |
| `npm run test:admin` | Run admin portal tests only |
| `npm run test:accessibility` | Run accessibility tests only |
| `npm run test:mobile` | Run mobile-specific tests |
| `npm run test:desktop` | Run desktop-specific tests |

## 🧪 Test Categories

### 1. Marketing Site Tests
- Homepage functionality and navigation
- Features and pricing pages
- Contact form submission
- SEO compliance
- Responsive design
- Performance benchmarks

### 2. Customer App Tests
- QR code scanning simulation
- Menu browsing and filtering
- Cart management (add/remove/update)
- Checkout process
- Order confirmation
- PWA functionality
- Mobile responsiveness

### 3. Admin Portal Tests
- Login/logout functionality
- Dashboard statistics
- Order management
- Order status updates
- Real-time updates
- Security and permissions

### 4. Accessibility Tests
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Touch target sizes
- Color contrast ratios
- ARIA labels and landmarks

### 5. Integration Tests
- End-to-end customer journey
- Cross-application data consistency
- Real-time order flow
- Performance under load
- Error handling scenarios

## 🎯 Test Scenarios

### Critical User Journeys

1. **Complete Ordering Flow**
   ```
   QR Scan → Menu Browse → Add Items → Checkout → Order Confirmation
   ```

2. **Admin Order Management**
   ```
   Login → View Orders → Update Status → Order Fulfillment
   ```

3. **Marketing to Customer Conversion**
   ```
   Homepage → Features → Demo → Customer App
   ```

### Edge Cases & Error Handling
- Invalid QR codes
- Empty cart checkout attempts
- Network disconnection scenarios
- Invalid admin credentials
- Mobile device compatibility

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application URLs
MARKETING_SITE_URL=http://localhost:4321
CUSTOMER_APP_URL=http://localhost:3000
ADMIN_PORTAL_URL=http://localhost:3002

# Admin Credentials (test environment only)
ADMIN_EMAIL=admin@skan.al
ADMIN_PASSWORD=testpassword123

# Test Configuration
TEST_TIMEOUT=60000
HEADLESS=true
```

### Browser Configuration

Tests run on multiple browsers by default:
- **Chromium** (Desktop & Mobile)
- **Firefox** (Desktop)
- **WebKit/Safari** (Desktop & Mobile)

### Device Testing

Configured viewports:
- **Mobile**: iPhone 12, Pixel 5
- **Tablet**: iPad Pro
- **Desktop**: 1280x720, 1920x1080

## 📊 Reporting

### Test Reports

After running tests, reports are generated in:
- `playwright-report/` - HTML report with screenshots
- `test-results/` - JSON and XML results
- `test-results/screenshots/` - Failure screenshots
- `test-results/videos/` - Failure recordings

### Accessibility Reports

WCAG compliance reports include:
- Color contrast analysis
- Keyboard navigation verification
- ARIA label compliance
- Touch target size validation

### Performance Metrics

Performance tests measure:
- Page load times (< 3 seconds)
- Time to interactive
- First contentful paint
- Cumulative layout shift

## 🔄 CI/CD Integration

### GitHub Actions

The test suite includes comprehensive CI/CD workflows:

- **Cross-browser testing** on all major browsers
- **Accessibility compliance** verification
- **Mobile responsiveness** testing
- **Performance regression** detection
- **Integration testing** across applications

### Pipeline Stages

1. **Setup** - Install dependencies and browsers
2. **Start Services** - Launch all three applications
3. **Test Execution** - Run tests in parallel
4. **Report Generation** - Compile results and artifacts
5. **Deployment** - Deploy reports to GitHub Pages

## 🛠️ Development

### Adding New Tests

1. **Create test file:**
   ```typescript
   // tests/feature/new-feature.spec.ts
   import { test, expect } from '@playwright/test';
   import { CustomerAppPage } from '../../page-objects/CustomerAppPage';

   test.describe('New Feature', () => {
     test('should work correctly', async ({ page }) => {
       const customerPage = new CustomerAppPage(page);
       // Test implementation
     });
   });
   ```

2. **Update page objects if needed:**
   ```typescript
   // page-objects/CustomerAppPage.ts
   readonly newFeatureButton: Locator;
   
   async clickNewFeature() {
     await this.newFeatureButton.click();
   }
   ```

3. **Add test data constants:**
   ```typescript
   // test-data/constants.ts
   export const NEW_FEATURE_DATA = {
     testValue: 'example'
   };
   ```

### Best Practices

1. **Use Page Object Model** for maintainable tests
2. **Add explicit waits** for dynamic content
3. **Include accessibility checks** in all tests
4. **Test mobile responsiveness** for customer-facing features
5. **Mock external dependencies** when appropriate
6. **Use descriptive test names** and organize by feature

### Debugging Tests

```bash
# Run specific test in debug mode
npx playwright test tests/customer-app/qr-ordering-flow.spec.ts --debug

# Run with browser UI visible
npx playwright test --headed

# Generate trace for failed tests
npx playwright test --trace on
```

## 🔍 Troubleshooting

### Common Issues

1. **Applications not starting:**
   ```bash
   # Check if ports are available
   lsof -i :3000 -i :3002 -i :4321
   
   # Kill processes if needed
   kill -9 $(lsof -t -i:3000)
   ```

2. **Browser installation issues:**
   ```bash
   # Reinstall browsers
   npx playwright install --force
   npx playwright install-deps
   ```

3. **Test timeouts:**
   - Increase timeout in `playwright.config.ts`
   - Check application startup time
   - Verify network connectivity

4. **Flaky tests:**
   - Add proper wait conditions
   - Use `waitForLoadState('networkidle')`
   - Implement retry logic for network-dependent operations

### Debug Commands

```bash
# Show browser console logs
npx playwright test --browser=chromium --headed --debug

# Run with verbose logging
DEBUG=pw:api npx playwright test

# Show test trace
npx playwright show-trace trace.zip
```

## 📈 Metrics & KPIs

### Test Coverage Goals
- **Functional Coverage**: 100% of critical user paths
- **Browser Coverage**: Chrome, Firefox, Safari
- **Device Coverage**: Mobile, tablet, desktop
- **Accessibility**: WCAG 2.1 AA compliance

### Performance Targets
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **Mobile Performance**: Lighthouse score > 90

### Quality Gates
- **Test Pass Rate**: > 95%
- **Accessibility Score**: > 95%
- **Performance Budget**: Met for all critical paths

## 🤝 Contributing

1. Follow the existing test structure and naming conventions
2. Add accessibility checks to all new tests
3. Include mobile responsiveness testing
4. Update documentation for new features
5. Ensure all tests pass before submitting PR

## 📝 License

This testing suite is part of the SKAN.AL project and follows the same licensing terms.

---

For more information, see the [main project README](../README.md) or contact the development team.