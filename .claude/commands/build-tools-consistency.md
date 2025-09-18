# Build Tools & Consistency Maintenance Guide

## Overview

This document outlines the build tools, development workflow, and consistency maintenance strategies for the SKAN.AL ecosystem across all three applications.

## Technology Stack Summary

### Core Technologies
- **Frontend Framework**: React 18+ (Customer App, Admin Portal), Astro 4+ (Marketing Site)
- **CSS Framework**: Tailwind CSS 3.x (All applications)
- **TypeScript**: 4.7+ (All applications)
- **Package Manager**: npm (All applications)
- **Testing**: Playwright E2E, Jest/React Testing Library
- **Build Tools**: React Scripts, Astro CLI
- **Deployment**: Netlify (Frontend), Firebase (Backend)

## Application-Specific Build Configurations

### Marketing Site (Astro)
```json
{
  "dependencies": {
    "@astrojs/check": "^0.9.4",
    "@astrojs/react": "^4.3.1", 
    "@astrojs/sitemap": "^3.6.0",
    "@astrojs/tailwind": "^6.0.2",
    "astro": "^5.13.7",
    "astro-icon": "^1.1.5",
    "astro-seo": "^0.8.4",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.9.2"
  }
}
```

**Build Commands:**
```bash
npm run dev      # Development server
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build
npm run astro    # Astro CLI access
```

**Key Features:**
- SEO optimization with astro-seo
- Sitemap generation
- Icon system with astro-icon
- React component integration
- Static site generation

### Customer App (React PWA)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.3.0",
    "react-icons": "^5.5.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.7.4",
    "workbox-*": "^6.5.4"
  },
  "devDependencies": {
    "tailwindcss": "^3.2.1",
    "autoprefixer": "^10.4.12",
    "postcss": "^8.4.18"
  }
}
```

**Build Commands:**
```bash
npm start        # Development server (localhost:3000)
npm run build    # Production build
npm test         # Run tests
npm run eject    # Eject from React Scripts (not recommended)
```

**Key Features:**
- Progressive Web App capabilities
- Workbox service worker integration
- Mobile-first responsive design
- Offline functionality
- Touch-optimized UI

### Admin Portal (React Dashboard)
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1", 
    "react-router-dom": "^7.9.1",
    "react-icons": "^5.5.0",
    "react-scripts": "5.0.1",
    "qrcode": "^1.5.4",
    "typescript": "^4.9.5"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  }
}
```

**Build Commands:**
```bash
npm start        # Development server
npm run build    # Production build  
npm test         # Run tests
```

**Key Features:**
- QR code generation
- Real-time dashboard updates
- Role-based access control
- Data visualization
- Restaurant management tools

## Build Tool Configuration

### Tailwind CSS Setup

**Common Configuration Pattern:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // Shared design tokens
      colors: { /* color palette */ },
      screens: { /* responsive breakpoints */ },
      fontFamily: { /* typography */ }
    },
  },
  plugins: []
}
```

**PostCSS Configuration:**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

### TypeScript Configuration

**Shared tsconfig.json patterns:**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

## Development Workflow

### Local Development Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd skan.al

# 2. Install dependencies for each app
cd skan-ecosystem/marketing-site && npm install
cd ../customer-app && npm install  
cd ../admin-portal && npm install
cd ../functions && npm install

# 3. Start development servers
# Terminal 1 - Marketing Site
cd skan-ecosystem/marketing-site && npm run dev

# Terminal 2 - Customer App  
cd skan-ecosystem/customer-app && npm start

# Terminal 3 - Admin Portal
cd skan-ecosystem/admin-portal && npm start

# Terminal 4 - Firebase Functions
cd skan-ecosystem/functions && npm run serve
```

### Environment Variables
```bash
# Cross-application environment variables
REACT_APP_API_URL=https://api.skan.al/v1
PUBLIC_ORDER_DOMAIN=https://order.skan.al
PUBLIC_ADMIN_DOMAIN=https://admin.skan.al

# Firebase Configuration
FIREBASE_PROJECT_ID=qr-restaurant-api
FIREBASE_REGION=europe-west1
```

## Consistency Maintenance Strategies

### 1. Design Token Management

**Shared Color Palette:**
```javascript
// Consistent across all Tailwind configs
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6', 
    600: '#2563eb',
    700: '#1d4ed8'
  },
  success: { /* ... */ },
  warning: { /* ... */ },
  danger: { /* ... */ }
}
```

**Responsive Breakpoints:**
```javascript
// Standardized across all applications
const screens = {
  'xs': '375px',      // Small mobile
  'mobile': '480px',  // Restaurant tablet mode
  'tablet': '768px',  // Tablet
  'desktop': '1024px', // Desktop
  'kiosk': '1200px'   // Self-service kiosk
}
```

### 2. Component Library Strategy

**Utility-First Approach:**
- Shared utility classes in Tailwind configuration
- Component classes for frequently used patterns
- Avoid custom CSS in favor of Tailwind utilities

**Example Button System:**
```css
/* Consistent button styles across all apps */
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors min-h-[48px];
}

.btn-secondary {
  @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors min-h-[48px];
}
```

### 3. Code Quality Tools

**ESLint Configuration:**
```json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    // Custom rules for consistency
  }
}
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 4. Testing Strategy

**E2E Testing with Playwright:**
```bash
# Run all E2E tests
cd skan-ecosystem/e2e-tests
npx playwright test

# Interactive test runner
npx playwright test --ui

# View test results
npx playwright show-report
```

**Unit Testing:**
```bash
# Customer App & Admin Portal
npm test

# Coverage reports
npm test -- --coverage
```

## Deployment Configuration

### Netlify Configurations

**Root netlify.toml (Marketing Site):**
```toml
[build]
  base = "skan-ecosystem/marketing-site"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

**Customer App netlify.toml:**
```toml
[build]
  base = "skan-ecosystem/customer-app"
  command = "npm run build"
  publish = "build"
```

**Admin Portal netlify.toml:**
```toml
[build]
  base = "skan-ecosystem/admin-portal"
  command = "npm run build"
  publish = "build"
```

### Firebase Configuration
```json
{
  "functions": {
    "source": "skan-ecosystem/functions",
    "runtime": "nodejs18",
    "region": "europe-west1"
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

## Automated Quality Checks

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
name: Build and Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npx playwright test
```

## Performance Optimization

### Bundle Analysis
```bash
# Customer App
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Admin Portal  
npm run build
npm run analyze
```

### Lighthouse Audits
```bash
# Automated Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

### Core Web Vitals Monitoring
- Real User Monitoring (RUM) setup
- Performance budgets in build process
- Automated performance regression detection

## Dependency Management

### Version Synchronization
```bash
# Check for outdated dependencies
npm outdated

# Update dependencies safely
npm update

# Security audit
npm audit
npm audit fix
```

### Shared Dependencies
```json
{
  "tailwindcss": "^3.2.1+",
  "typescript": "^4.7.4+", 
  "react": "^18.2.0+",
  "react-icons": "^5.5.0"
}
```

## Troubleshooting Guide

### Common Build Issues

**Tailwind CSS not loading:**
1. Check PostCSS configuration
2. Verify Tailwind import in CSS file
3. Ensure content paths are correct

**TypeScript compilation errors:**
1. Check tsconfig.json configuration
2. Verify type definitions are installed
3. Update @types packages

**React Router issues:**
1. Verify router version compatibility
2. Check route configuration
3. Ensure proper basename setup

**Firebase deployment failures:**
1. Check Firebase configuration
2. Verify function runtime version
3. Ensure proper environment variables

### Development Server Issues

**Port conflicts:**
```bash
# Kill processes on specific ports
npx kill-port 3000 3001 5000 5001
```

**Node version issues:**
```bash
# Use Node Version Manager
nvm use 18
nvm install 18.17.0
```

**Dependency conflicts:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Monitoring & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly major version updates
- [ ] Performance benchmark reviews
- [ ] Design system consistency audits

### Monitoring Setup
- Bundle size tracking
- Build time monitoring  
- Deployment success rates
- Error rate monitoring
- Performance metrics

### Documentation Updates
- Keep this document updated with changes
- Document new patterns and components
- Update troubleshooting guide with solutions
- Version control for configuration changes

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Next Review**: March 2025