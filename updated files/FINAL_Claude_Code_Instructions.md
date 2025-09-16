# SKAN.AL - COMPLETE SYSTEM BUILD INSTRUCTIONS FOR CLAUDE CODE

## PROJECT OVERVIEW
Build a complete QR code ordering ecosystem with:
- **Marketing Hub**: Astro site for SEO and customer acquisition
- **Customer App**: React PWA for QR ordering experience  
- **Admin Portal**: React dashboard for restaurant management
- **API Backend**: Firebase Cloud Functions with custom domain

## EXISTING FIREBASE PROJECT
- **Project ID**: qr-restaurant-api
- **Region**: europe-west1
- **Database**: Cloud Firestore with existing venue/menu data
- **Collections**: venue, users (Beach Bar Durrës with real menu items)

---

## TASK 1: IMPLEMENT FIREBASE CLOUD FUNCTIONS (api.skan.al)

### Setup Requirements
```bash
# Deploy to existing Firebase project: qr-restaurant-api
# Custom domain: api.skan.al
# Region: europe-west1
```

### Required API Endpoints
```javascript
GET  /v1/venue/:slug/menu          # Fetch menu by venue slug
POST /v1/orders                    # Create new order
GET  /v1/venue/:venueId/orders     # Get orders for restaurant
PUT  /v1/orders/:orderId/status    # Update order status
POST /v1/auth/login                # Restaurant staff login
GET  /health                       # Health check
GET  /                            # API info/documentation
```

### Dependencies
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0",
    "express": "^4.18.0",
    "cors": "^2.8.5"
  }
}
```

### Database Integration
```javascript
// Existing Collections:
// venue/ - Restaurant data with subcollections
// users/ - Staff authentication data

// New Collection to Create:
// orders/ - Order management
{
  venueId: "venue-reference",
  tableNumber: "A1",
  orderNumber: "SKN-20250915-001", // Format: SKN-YYYYMMDD-NNN
  customerName: "Customer Name",
  items: [{name, price, quantity}],
  totalAmount: 25.50,
  status: "new", // new → preparing → ready → served
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Key Implementation Requirements
- Order numbers: Daily counter format "SKN-YYYYMMDD-001"
- Menu items grouped by category with Albanian translations
- CORS configuration for *.skan.al domains
- Proper error handling and validation
- Custom domain configuration: api.skan.al

---

## TASK 2: BUILD CUSTOMER ORDERING APP (order.skan.al)

### Tech Stack
- React 18 + TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Context API for cart state management
- PWA configuration for mobile optimization

### URL Structure
```
order.skan.al/{venue-slug}/{table}        # QR landing → auto-redirect to menu
order.skan.al/{venue-slug}/{table}/menu   # Menu browsing (primary page)
order.skan.al/{venue-slug}/{table}/cart   # Shopping cart (contextual)
order.skan.al/{venue-slug}/{table}/order  # Order confirmation
order.skan.al/track/{order-number}         # Order tracking (shareable)
order.skan.al/help                         # Customer support
order.skan.al/offline                      # Offline fallback
```

### Key Features
- **QR Flow**: QR code → Auto-redirect to contextual menu
- **Context Preservation**: Venue and table maintained throughout session
- **Menu Display**: Categories with Albanian translations
- **Cart Management**: Add/remove/quantity controls with running total
- **Order Submission**: Optional customer name, special instructions
- **PWA Optimization**: Offline functionality, app-like experience
- **Mobile-First**: Optimized for smartphone usage

### Required Components
```typescript
// Pages
- QRLanding.tsx     // Auto-redirect to menu with venue/table context
- Menu.tsx          // Menu browsing with categories
- Cart.tsx          // Cart review and checkout
- Confirmation.tsx  // Order confirmation with tracking
- OrderTracking.tsx // Real-time order status

// Components  
- MenuItem.tsx      // Menu item display with add to cart
- CartItem.tsx      // Cart item with quantity controls
- CartSummary.tsx   // Fixed bottom cart summary

// Context
- CartContext.tsx   // Cart state management
- VenueContext.tsx  // Venue/table context preservation
```

### API Integration
- Base URL: https://api.skan.al/v1
- Menu fetching by venue slug
- Order creation with cart items
- Order tracking by order number

---

## TASK 3: BUILD RESTAURANT ADMIN PORTAL (admin.skan.al)

### Tech Stack
- React 18 + TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Context API for authentication
- Desktop/tablet optimized interface

### URL Structure
```
admin.skan.al/login                 # Universal authentication
admin.skan.al/orders                # Orders management (primary dashboard)
admin.skan.al/orders/active         # Active orders filter
admin.skan.al/orders/history        # Order history
admin.skan.al/menu                  # Menu management
admin.skan.al/tables                # Table/QR management
admin.skan.al/analytics             # Analytics (role-based)
admin.skan.al/settings              # Restaurant settings
admin.skan.al/staff                 # Staff management (manager+ only)
admin.skan.al/billing               # Billing (owner only)
admin.skan.al/help                  # Help documentation
```

### Key Features
- **Role-Based Access**: Staff, Manager, Owner permissions
- **Real-Time Orders**: Live order updates with auto-refresh
- **Order Management**: Status progression (new → preparing → ready → served)
- **Filtering**: Active, New, Preparing, Ready, Served, All
- **Menu Management**: Edit menu items, categories, pricing
- **Table Management**: Generate QR codes, manage table layout
- **Analytics**: Order volume, revenue, popular items (role-based)

### Authentication
- Login with existing Firebase Auth users
- manager_email@gmail.com and arditxhanaj@gmail.com
- Role-based feature access
- Session persistence across browser sessions

### Required Components
```typescript
// Pages
- Login.tsx         // Authentication form
- Dashboard.tsx     // Main orders dashboard
- OrderDetails.tsx  // Individual order management
- MenuManager.tsx   // Menu editing interface
- TableManager.tsx  # QR code generation
- Analytics.tsx     // Business analytics

// Components
- OrderCard.tsx     // Order display with status controls
- StatusButton.tsx  // Order status progression
- OrderFilters.tsx  // Status filtering tabs
- RoleGate.tsx      // Role-based access control
```

---

## TASK 4: BUILD MARKETING SITE (skan.al)

### Tech Stack
- Astro 4.x with TypeScript
- Tailwind CSS for styling
- React components for interactive elements
- Content collections for blog/SEO content
- Perfect Lighthouse scores optimization

### URL Structure
```
skan.al/                           # Homepage with value proposition
skan.al/features/                  # Product features and benefits
skan.al/pricing/                   # Pricing plans for restaurants
skan.al/demo/                      # Live demo (links to order subdomain)
skan.al/contact/                   # Contact and signup forms
skan.al/about/                     # Company story
skan.al/blog/                      # SEO content hub
skan.al/blog/restaurant-tech/      # Industry articles
skan.al/blog/qr-ordering/          # QR ordering guides
skan.al/blog/albania-hospitality/  # Local market content
skan.al/help/                      # FAQ and support
skan.al/terms/                     # Legal pages
skan.al/privacy/                   # Privacy policy
```

### Key Features
- **SEO Optimization**: Perfect meta tags, schema markup, sitemap
- **Content Marketing**: Blog for organic traffic generation
- **Lead Generation**: Demo links, contact forms, pricing CTAs
- **Performance**: Perfect Lighthouse scores (90+ all categories)
- **Local SEO**: Albania, Tirana, Durrës market targeting
- **Demo Integration**: Links to order.skan.al for live demos

### Content Strategy
- Restaurant technology trend articles
- QR ordering implementation guides
- Albanian hospitality market insights
- Customer success stories and case studies
- Local SEO content for major Albanian cities

---

## TASK 5: DEPLOYMENT CONFIGURATION

### Domain Architecture
```
skan.al                 # Astro marketing site → Netlify/Vercel
order.skan.al          # React customer PWA → Netlify/Vercel
admin.skan.al          # React admin portal → Netlify/Vercel
api.skan.al            # Firebase Functions → Custom domain
```

### Environment Variables
```bash
# Customer App (order.skan.al)
REACT_APP_API_URL=https://api.skan.al/v1
REACT_APP_DOMAIN=order.skan.al

# Admin Portal (admin.skan.al)
REACT_APP_API_URL=https://api.skan.al/v1
REACT_APP_DOMAIN=admin.skan.al

# Marketing Site (skan.al)
PUBLIC_API_URL=https://api.skan.al/v1
PUBLIC_ORDER_DOMAIN=https://order.skan.al
PUBLIC_ADMIN_DOMAIN=https://admin.skan.al
```

### Deployment Steps
1. **Deploy Firebase Functions** to api.skan.al custom domain
2. **Deploy Astro site** to skan.al (primary domain)
3. **Deploy React customer app** to order.skan.al subdomain
4. **Deploy React admin portal** to admin.skan.al subdomain
5. **Configure DNS** for all subdomains
6. **Test cross-domain** functionality and CORS

---

## TASK 6: DATABASE SETUP

### Add Missing Data
```javascript
// Add tables subcollection to venue documents
venue/[venueId]/table/
{
  tableNumber: "A1",
  displayName: "Table A1",
  isActive: true,
  qrCode: "https://order.skan.al/beach-bar-durres/a1"
}

// Verify menu items have required fields
venue/[venueId]/menuItem/
{
  name: "Albanian Beer",
  nameAlbanian: "Birra Shqiptare",
  price: 3.50,
  category: "drinks",
  description: "Local Korça beer",
  allergens: ["gluten"],
  isAvailable: true,
  sortOrder: 1
}
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for venues and menus
    match /venue/{venueId} {
      allow read: if true;
      allow write: if request.auth != null;
      
      match /menuItem/{itemId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      
      match /table/{tableId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
    
    // Orders: public create, auth required for management
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
    
    // Users: auth required
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## TESTING REQUIREMENTS

### End-to-End Testing
```bash
# Customer Flow
1. Visit: order.skan.al/beach-bar-durres/a1
2. Auto-redirect to: order.skan.al/beach-bar-durres/a1/menu
3. Browse menu with real Albanian Beer item (€3.50)
4. Add items to cart, verify total calculation
5. Submit order with/without customer name
6. Receive order confirmation with order number (SKN-YYYYMMDD-NNN)
7. Track order status

# Restaurant Flow
1. Visit: admin.skan.al
2. Login with manager_email@gmail.com
3. See orders dashboard with real-time updates
4. Update order status: new → preparing → ready → served
5. Verify status changes persist and update customer view

# Marketing Site
1. Visit: skan.al
2. Navigate features, pricing, blog sections
3. Test demo links to order.skan.al
4. Verify perfect Lighthouse scores
5. Test contact forms and lead generation

# API Testing
1. All endpoints at api.skan.al respond correctly
2. Menu data loads from existing Beach Bar Durrës
3. Orders create successfully in Firestore
4. Authentication works with existing users
```

### QR Code Testing
```bash
# Generate QR codes pointing to:
https://order.skan.al/beach-bar-durres/a1
https://order.skan.al/beach-bar-durres/a2

# Test QR scanning on mobile devices:
- Android Chrome
- iPhone Safari
- Various QR scanning apps
```

---

## SUCCESS CRITERIA

### Technical Requirements
- API response time < 500ms
- Page load time < 3 seconds on mobile
- Perfect Lighthouse scores for marketing site (90+ all categories)
- PWA functionality working offline
- Real-time order updates functioning
- Cross-domain authentication working
- Mobile-responsive on all screen sizes

### Business Requirements
- Customer can complete full ordering flow
- Restaurant staff can manage orders effectively
- Marketing site drives demo engagement
- System works with existing Beach Bar Durrës data
- QR codes link correctly to contextual menus
- Order data persists correctly in Firestore

### User Experience
- QR scan → Menu (1 step, instant)
- No context loss during ordering process
- Intuitive admin interface for restaurant staff
- Fast, app-like customer experience
- Professional marketing site for lead generation

---

## PROJECT STRUCTURE
```
skan-ecosystem/
├── functions/              # Firebase Cloud Functions (api.skan.al)
│   ├── index.js           # Complete API implementation
│   └── package.json       # Dependencies
├── marketing-site/         # Astro site (skan.al)
│   ├── src/
│   │   ├── pages/         # Homepage, features, pricing, blog
│   │   ├── components/    # Astro + React components
│   │   ├── content/       # Blog posts and content
│   │   └── layouts/       # Page layouts
│   ├── astro.config.mjs   # Astro configuration
│   └── package.json
├── customer-app/           # React PWA (order.skan.al)
│   ├── src/
│   │   ├── pages/         # QR, Menu, Cart, Confirmation
│   │   ├── components/    # MenuItem, CartItem, etc.
│   │   ├── contexts/      # CartContext, VenueContext
│   │   └── services/      # API integration
│   ├── public/
│   │   └── manifest.json  # PWA configuration
│   └── package.json
├── admin-portal/           # React SPA (admin.skan.al)
│   ├── src/
│   │   ├── pages/         # Login, Dashboard, Management
│   │   ├── components/    # OrderCard, Analytics, etc.
│   │   ├── contexts/      # AuthContext
│   │   └── services/      # API integration
│   └── package.json
└── README.md              # Complete documentation
```

---

## DEVELOPMENT TIMELINE

### Day 1: Backend Foundation
- Deploy Firebase Cloud Functions to api.skan.al
- Implement all API endpoints
- Test with existing Beach Bar Durrës data
- Configure custom domain and CORS

### Day 2: Marketing Hub
- Build Astro marketing site with perfect SEO
- Create blog structure for content marketing
- Implement demo links and lead generation
- Deploy to skan.al with perfect Lighthouse scores

### Day 3: Customer Experience
- Build React PWA for order.skan.al
- Implement contextual ordering flow
- Add PWA features and offline functionality
- Test complete QR → Order journey

### Day 4: Admin Portal
- Build React admin portal for admin.skan.al
- Implement role-based access control
- Add real-time order management
- Test complete restaurant workflow

### Day 5: Integration & Testing
- Cross-domain testing and optimization
- End-to-end workflow validation
- Performance optimization
- Generate QR codes for testing

---

## FINAL DELIVERABLES

1. **Complete working ecosystem** across all subdomains
2. **API integration** with existing Firebase data
3. **Real customer orders** created in Firestore
4. **Restaurant staff** can manage orders effectively
5. **Marketing site** ready for content and SEO
6. **QR codes** linking to functional ordering system
7. **Documentation** for ongoing development

The system should work immediately with the existing Beach Bar Durrës data, allowing real testing with QR codes that lead to actual menu items and order creation.

**READY FOR CLAUDE CODE IMPLEMENTATION** 🚀