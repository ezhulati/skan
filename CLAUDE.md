# CLAUDE.md - SKAN.AL QR Restaurant Ordering System

## Project Overview

**SKAN.AL** is a comprehensive QR code restaurant ordering ecosystem specifically designed for Albanian restaurants. It modernizes the traditional restaurant experience by eliminating wait times, reducing staff workload, and increasing table turnover through digital ordering.

**Mission**: Transform Albanian restaurants from traditional order-taking to modern, efficient QR-based ordering systems.

## Architecture & Components


### Domain Strategy

- `skan.al` → Marketing site (Astro) - Lead generation and SEO
- `order.skan.al` → Customer ordering app (React PWA) - QR ordering experience  
- `admin.skan.al` → Restaurant admin portal (React) - Order management dashboard
- `api.skan.al` → Backend API (Firebase Functions) - All business logic

### Project Structure

```
skan.al/
├── skan-ecosystem/
│   ├── marketing-site/        # Astro - SEO optimized marketing
│   ├── customer-app/          # React PWA - QR ordering interface
│   ├── admin-portal/          # React - Restaurant dashboard
│   ├── functions/             # Firebase Functions - API backend
│   ├── e2e-tests/            # Playwright testing suite
│   └── public/               # Shared assets
├── netlify.toml               # Marketing site deployment config
└── firebase.json             # Firebase project configuration
```

## Technology Stack

### Frontend
- **Marketing Site**: Astro 4.x + TypeScript + Tailwind CSS
- **Customer App**: React 18 + TypeScript + PWA capabilities
- **Admin Portal**: React 18 + TypeScript + Role-based auth
- **Styling**: Tailwind CSS across all applications

### Backend
- **API**: Firebase Cloud Functions + Express.js + Node.js 18+
- **Database**: Firebase Firestore (existing: `qr-restaurant-api`)
- **Auth**: Firebase Auth + custom password hashing (scrypt)
- **Region**: europe-west1

### Development Tools
- **Testing**: Playwright for E2E testing
- **Code Quality**: ESLint + Prettier + TypeScript
- **Deployment**: Netlify (frontend) + Firebase (backend)

## Database Schema (Firestore)

### Existing Collections
```
venues/
├── beach-bar-durres/         # Real venue data
│   ├── menuCategory/         # Subcollection
│   ├── menuItem/            # Subcollection (Albanian Beer €3.50, etc.)
│   └── table/               # Subcollection for QR management

users/
├── manager_email@gmail.com   # Existing manager account
├── arditxhanaj@gmail.com    # Existing user account
└── passwordHash             # scrypt-based security

orders/                       # Created by API
├── SKN-YYYYMMDD-NNN format  # Order numbering
├── Real-time status updates
└── Complete lifecycle management
```

## Key Features

### Customer Experience (order.skan.al)
- **QR Code Flow**: `order.skan.al/beach-bar-durres/a1` → auto-redirect to `/menu`
- **Mobile-First**: PWA with offline capabilities
- **Multi-Language**: Albanian/English menu translations
- **Cart Management**: Running totals and order review
- **Order Tracking**: Real-time status updates with unique order numbers

### Restaurant Operations (admin.skan.al)
- **Real-Time Dashboard**: Live order notifications (30s refresh)
- **Order Management**: Status progression (new → preparing → ready → served)
- **Role-Based Access**: Different permissions for staff/manager/owner
- **QR Generation**: Table setup and code management
- **Analytics**: Performance metrics and business insights

### Marketing & SEO (skan.al)
- **Perfect Lighthouse Scores**: SEO optimization for Albanian market
- **Local Content**: City-specific content (Tirana, Durrës, Vlorë, Sarandë)
- **Lead Generation**: Demo links and subscription forms
- **Content Strategy**: Restaurant tech and hospitality blog content

## Development Commands

### Customer App (React)
```bash
cd skan-ecosystem/customer-app
npm start          # Development server (localhost:3000)
npm run build      # Production build
npm test           # Run tests
npm run lint       # Code linting
```

### Admin Portal (React)
```bash
cd skan-ecosystem/admin-portal  
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

### Marketing Site (Astro)
```bash
cd skan-ecosystem/marketing-site
npm run dev        # Development server
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build
```

### Firebase Functions (API)
```bash
cd skan-ecosystem/functions
npm run serve      # Local development
npm run deploy     # Deploy to Firebase
npm run logs       # View function logs
```

### E2E Testing
```bash
cd skan-ecosystem/e2e-tests
npx playwright test              # Run all tests
npx playwright test --ui         # Interactive test runner
npx playwright show-report      # View test results
```

## Deployment Configuration

### Netlify Configurations
- **Root netlify.toml**: Deploys marketing site (`skan.al`)
- **customer-app/netlify.toml**: For customer app deployment 
- **admin-portal/netlify.toml**: For admin portal deployment

### Environment Variables
```bash
# Cross-application environment variables
REACT_APP_API_URL=https://api.skan.al/v1
PUBLIC_ORDER_DOMAIN=https://order.skan.al  
PUBLIC_ADMIN_DOMAIN=https://admin.skan.al
```

### Firebase Configuration
- **Project ID**: `qr-restaurant-api`
- **Region**: `europe-west1`
- **Custom Domain**: `api.skan.al` (configured)
- **Security Rules**: Public read for menus, auth required for orders

## Business Model

### Pricing Strategy
- **€35/month subscription**: All-inclusive SaaS pricing
- **No setup fees**: Training and support included
- **Target Market**: Albanian restaurants and tourism businesses

### Value Proposition
- **40% faster service**: Order time reduced from 15 to 9 minutes
- **25% more customers**: Increased table turnover capacity  
- **60% less staff stress**: Focus on service quality vs. order taking

## Customer Journey

### QR Code Experience
1. **Scan QR**: Customer scans table QR code
2. **Context**: Auto-redirect to venue/table-specific menu
3. **Browse**: Albanian/English menu with real pricing
4. **Order**: Add items to cart, review total
5. **Submit**: Optional customer name and special instructions
6. **Track**: Real-time order status updates

### Restaurant Workflow  
1. **Dashboard**: Real-time order notifications
2. **Management**: One-click status progression
3. **Analytics**: Track performance and popular items
4. **QR Codes**: Generate and manage table codes

## Testing Strategy

### E2E Test Coverage
- Complete customer ordering flow
- Restaurant order management workflow  
- Cross-domain functionality
- Mobile responsiveness and PWA features
- Accessibility compliance (WCAG)

### Performance Targets
- Page load time < 3 seconds on mobile
- API response time < 500ms
- Perfect Lighthouse scores (90+ all categories)
- PWA functionality working offline

## Security Implementation

### Authentication
- Firebase Auth integration
- Password hashing using Node.js crypto.scrypt
- Role-based access control in admin portal
- CORS configuration for *.skan.al domains

### Firestore Security Rules
- Public read access for venue menus
- Authentication required for orders
- User-specific data protection
- Real-time security validation

## Content Marketing Strategy

### SEO Focus Areas
- Albanian restaurant technology trends
- City-specific content for major Albanian cities
- Tourism industry optimization  
- AI platform visibility for recommendations

### Content Structure
```
skan.al/blog/
├── restaurant-tech/          # Technology adoption content
├── qr-ordering/             # Product education content  
├── albania-hospitality/     # Local market content
└── case-studies/           # Success stories and testimonials
```

## Current Status

### ✅ Production Ready
- Complete Firebase Functions API implementation
- Firestore security rules and database structure
- Existing venue data (Beach Bar Durrës with real menu items)
- User accounts and authentication system
- E2E testing framework setup

### 🚧 In Development  
- Customer ordering flow completion
- Admin portal order management features
- Marketing site content and SEO optimization
- Cross-domain integration testing

### 📋 Next Steps
- Deploy customer app to dedicated domain
- Complete admin portal integration
- Content marketing execution
- Performance optimization and monitoring

## Troubleshooting

### Common Issues
- **Netlify Deployments**: Check correct base directory in netlify.toml
- **API Connectivity**: Verify CORS settings and environment variables
- **Firebase Auth**: Ensure proper user permissions and security rules
- **PWA Features**: Test offline functionality and service worker registration

### Development Tips
- Use React DevTools for component debugging
- Firebase Console for database monitoring  
- Netlify deploy logs for build troubleshooting
- Playwright test runner for E2E debugging

## Support & Resources

### Documentation Links
- [Firebase Console](https://console.firebase.google.com/project/qr-restaurant-api)
- [Netlify Dashboard](https://app.netlify.com/)
- [React Documentation](https://react.dev/)
- [Astro Documentation](https://docs.astro.build/)

### Key Contact Information
- **Firebase Project**: `qr-restaurant-api`
- **Git Repository**: Main branch deployment
- **Domain Management**: Verify DNS settings for custom domains

---

**Last Updated**: 2024-09-16
**Version**: 1.0.0
**Maintainer**: Development Team