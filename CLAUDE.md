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

### Authentication & Security
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

## API CONTRACT

### Base URL
**Production:** `https://api-mkazmlu7ta-ew.a.run.app`  
**Development:** `https://localhost:5001`

### Authentication
Most endpoints require Bearer token authentication in the Authorization header:
```
Authorization: Bearer <token>
```

---

### VENUE & MENU ENDPOINTS

### GET `/v1/venue/:slug/menu`
**Description:** Get venue menu by slug (public endpoint)  
**Parameters:**
- `slug` (path): Venue slug identifier

**Response:**
```json
{
  "venue": {
    "id": "string",
    "name": "string", 
    "slug": "string",
    "address": "string",
    "phone": "string",
    "description": "string",
    "settings": { "currency": "EUR", "orderingEnabled": true, "estimatedPreparationTime": 15 }
  },
  "categories": [
    {
      "id": "string",
      "name": "string",
      "nameAlbanian": "string",
      "sortOrder": 1,
      "items": [
        {
          "id": "string",
          "name": "string",
          "nameAlbanian": "string", 
          "description": "string",
          "descriptionAlbanian": "string",
          "price": 12.99,
          "allergens": ["gluten", "dairy"],
          "imageUrl": "string",
          "preparationTime": 10,
          "sortOrder": 1
        }
      ]
    }
  ]
}
```

### GET `/v1/venue/:slug/tables`
**Description:** Get venue tables for QR generation (public endpoint)  
**Parameters:**
- `slug` (path): Venue slug identifier

**Response:**
```json
{
  "tables": [
    {
      "id": "string",
      "tableNumber": "T01",
      "displayName": "Table 1",
      "qrUrl": "https://order.skan.al/venue-slug/T01"
    }
  ]
}
```

---

### ORDER ENDPOINTS

### POST `/v1/orders`
**Description:** Create new order (public endpoint)  
**Body:**
```json
{
  "venueId": "string",
  "tableNumber": "T01",
  "customerName": "John Doe",
  "items": [
    {
      "id": "string",
      "name": "Pizza Margherita",
      "price": 14.99,
      "quantity": 2
    }
  ],
  "specialInstructions": "No onions please"
}
```

**Response:**
```json
{
  "orderId": "string",
  "orderNumber": "SKN-20250915-001", 
  "status": "new",
  "totalAmount": 29.98,
  "message": "Order created successfully"
}
```

### GET `/v1/venue/:venueId/orders`
**Description:** Get orders for venue dashboard (protected)  
**Parameters:**
- `venueId` (path): Venue ID
- `status` (query): Filter by status ("new", "preparing", "ready", "served", "active", "all")
- `limit` (query): Max results (default: 50)

**Response:**
```json
[
  {
    "id": "string",
    "venueId": "string",
    "tableNumber": "T01",
    "orderNumber": "SKN-20250915-001",
    "customerName": "John Doe",
    "items": [...],
    "totalAmount": 29.98,
    "status": "new",
    "specialInstructions": "string",
    "createdAt": "2025-01-17T10:00:00.000Z",
    "updatedAt": "2025-01-17T10:00:00.000Z"
  }
]
```

### PUT `/v1/orders/:orderId/status`
**Description:** Update order status (protected)  
**Parameters:**
- `orderId` (path): Order ID

**Body:**
```json
{
  "status": "preparing"
}
```

**Valid statuses:** `"new"`, `"preparing"`, `"ready"`, `"served"`

**Response:**
```json
{
  "message": "Order status updated",
  "status": "preparing", 
  "orderId": "string"
}
```

### GET `/v1/orders/:orderId`
**Description:** Get single order details (protected)  
**Parameters:**
- `orderId` (path): Order ID

**Response:**
```json
{
  "id": "string",
  "venueId": "string",
  "tableNumber": "T01",
  "orderNumber": "SKN-20250915-001",
  "customerName": "John Doe",
  "items": [...],
  "totalAmount": 29.98,
  "status": "preparing",
  "specialInstructions": "string",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z",
  "preparedAt": "2025-01-17T10:05:00.000Z",
  "readyAt": null,
  "servedAt": null
}
```

### GET `/v1/track/:orderNumber`
**Description:** Track order by number (public endpoint)  
**Parameters:**
- `orderNumber` (path): Order number (e.g., "SKN-20250915-001")

**Response:**
```json
{
  "orderNumber": "SKN-20250915-001",
  "status": "preparing",
  "items": [...],
  "totalAmount": 29.98,
  "createdAt": "2025-01-17T10:00:00.000Z",
  "estimatedTime": "10-15 minutes"
}
```

---

### AUTHENTICATION ENDPOINTS

### POST `/v1/auth/register`
**Description:** User registration  
**Body:**
```json
{
  "email": "manager@restaurant.com",
  "password": "securepassword123",
  "fullName": "John Manager",
  "role": "manager",
  "venueId": "venue-id-123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "string",
  "token": "string",
  "user": {
    "id": "string",
    "email": "manager@restaurant.com",
    "fullName": "John Manager", 
    "role": "manager",
    "venueId": "venue-id-123",
    "emailVerified": false
  }
}
```

### POST `/v1/auth/login`
**Description:** Restaurant staff login  
**Body:**
```json
{
  "email": "manager@restaurant.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "email": "manager@restaurant.com",
    "fullName": "John Manager",
    "role": "manager", 
    "venueId": "venue-id-123"
  },
  "venue": {
    "id": "venue-id-123",
    "name": "My Restaurant",
    "slug": "my-restaurant"
  },
  "token": "string"
}
```

### POST `/v1/auth/reset-password`
**Description:** Request password reset  
**Body:**
```json
{
  "email": "manager@restaurant.com"
}
```

**Response:**
```json
{
  "message": "If this email exists, you will receive a password reset link",
  "resetToken": "dev-token-here"
}
```

### POST `/v1/auth/reset-password/confirm`
**Description:** Confirm password reset with token  
**Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

---

### USER MANAGEMENT ENDPOINTS (Protected)

### GET `/v1/users`
**Description:** Get all users (admin/manager only)  
**Query Parameters:**
- `venueId` (string): Filter by venue ID
- `role` (string): Filter by role
- `limit` (number): Max results (default: 50)

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "email": "user@example.com",
      "fullName": "User Name",
      "role": "staff",
      "venueId": "venue-id",
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2025-01-17T10:00:00.000Z",
      "updatedAt": "2025-01-17T10:00:00.000Z"
    }
  ],
  "total": 5
}
```

### GET `/v1/users/:userId`
**Description:** Get single user (admin/manager only)  
**Parameters:**
- `userId` (path): User ID

### PUT `/v1/users/:userId`
**Description:** Update user (admin/manager only)  
**Body:**
```json
{
  "fullName": "Updated Name",
  "role": "manager",
  "isActive": true,
  "venueId": "venue-id"
}
```

### POST `/v1/users/invite`
**Description:** Invite new user (admin/manager only)  
**Body:**
```json
{
  "email": "newuser@example.com",
  "fullName": "New User",
  "role": "staff"
}
```

**Response:**
```json
{
  "message": "Invitation sent successfully",
  "invitationId": "string",
  "inviteToken": "dev-token-here"
}
```

### POST `/v1/auth/accept-invitation`
**Description:** Accept invitation and complete registration  
**Body:**
```json
{
  "token": "invitation-token",
  "password": "securepassword123"
}
```

---

### VENUE MANAGEMENT ENDPOINTS (Protected)

### POST `/v1/venues`
**Description:** Create new venue (admin only)  
**Body:**
```json
{
  "name": "My Restaurant",
  "address": "123 Main St, City",
  "phone": "+355691234567",
  "description": "Great Albanian food",
  "settings": {
    "currency": "EUR",
    "orderingEnabled": true,
    "estimatedPreparationTime": 15
  }
}
```

### GET `/v1/venues`
**Description:** Get all venues (admin only)  
**Query Parameters:**
- `isActive` (boolean): Filter by active status
- `limit` (number): Max results (default: 50)

### GET `/v1/venues/:venueId`
**Description:** Get single venue (protected)

### PUT `/v1/venues/:venueId`
**Description:** Update venue (admin/manager only)

### GET `/v1/venues/:venueId/stats`
**Description:** Get venue statistics (admin/manager only)  
**Response:**
```json
{
  "venue": {
    "name": "My Restaurant",
    "isActive": true
  },
  "orders": {
    "total": 150,
    "revenue": 2850.75,
    "byStatus": {
      "new": 5,
      "preparing": 3,
      "ready": 2,
      "served": 140
    }
  },
  "staff": {
    "total": 4
  },
  "menu": {
    "categories": 6,
    "items": 25
  },
  "tables": {
    "total": 12
  }
}
```

---

### SELF-SERVICE REGISTRATION ENDPOINTS

### POST `/v1/register/venue`
**Description:** Self-service venue registration (public endpoint)  
**Body:**
```json
{
  "venueName": "My New Restaurant",
  "address": "123 Main St, City",
  "phone": "+355691234567",
  "description": "Albanian cuisine",
  "currency": "EUR",
  "ownerName": "John Owner",
  "ownerEmail": "owner@restaurant.com", 
  "password": "securepassword123",
  "tableCount": 10
}
```

**Response:**
```json
{
  "message": "Venue registered successfully",
  "venueId": "string",
  "venue": {
    "id": "string",
    "name": "My New Restaurant",
    "slug": "my-new-restaurant",
    "address": "123 Main St, City"
  },
  "user": {
    "id": "string",
    "email": "owner@restaurant.com",
    "fullName": "John Owner",
    "role": "manager",
    "venueId": "string"
  },
  "credentials": {
    "email": "owner@restaurant.com",
    "tempPassword": "securepassword123"
  },
  "setup": {
    "tablesCreated": 10,
    "categoriesCreated": 4,
    "qrCodeUrl": "https://order.skan.al/my-new-restaurant"
  }
}
```

### GET `/v1/register/status/:venueId`
**Description:** Get venue registration status (protected)

---

### UTILITY ENDPOINTS

### GET `/health`
**Description:** Health check endpoint  
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-17T10:00:00.000Z",
  "service": "skan-api",
  "version": "1.0.0"
}
```

### GET `/`
**Description:** API documentation and info  
**Response:**
```json
{
  "message": "Skan.al API - QR Code Ordering System",
  "version": "1.0.0",
  "documentation": "https://api.skan.al/docs",
  "endpoints": { ... },
  "exampleUsage": { ... }
}
```

---

### ERROR RESPONSES

All endpoints return consistent error responses:
```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

### DEMO CREDENTIALS

**Demo Manager Login:**
- Email: `manager_email1@gmail.com`
- Password: `demo123`
- Venue ID: `demo-venue-1`

**Demo Venue:**
- Slug: `demo-restaurant`
- Name: `Demo Restaurant`

---

### NOTES

1. **Authentication:** Most endpoints require Bearer token authentication
2. **Permissions:** Three roles exist - `admin`, `manager`, `staff`
3. **Venue Access:** Managers can only access their own venue data
4. **Order Numbers:** Format is `SKN-YYYYMMDD-###` (e.g., `SKN-20250917-001`)
5. **Timestamps:** All timestamps are in ISO 8601 format (UTC)
6. **Currencies:** Default is EUR, but venues can configure other currencies
7. **Languages:** Support for Albanian and English translations
8. **QR URLs:** Format is `https://order.skan.al/{venue-slug}/{table-number}`

### TESTING COMMANDS

**Create User via API:**
```bash
# Located at /Users/mbp-ez/Desktop/AI Library/Apps/skan.al/create-user.cjs
node create-user.cjs
```

**Test Login:**
```bash
curl -X POST https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@skan.al", "password": "TestPassword123!"}'
```

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Maintainer**: Development Team