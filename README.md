# Skan.al - QR Code Restaurant Ordering System

A complete QR code ordering system built with Firebase Cloud Functions, React, and TypeScript. Allows customers to order directly from their table and restaurants to manage orders efficiently.

## System Overview

- **Firebase Cloud Functions**: API backend with menu, order, and authentication endpoints
- **Customer Frontend**: React app for QR ordering flow (skan.al)
- **Restaurant Dashboard**: React app for order management (admin.skan.al)
- **Database**: Firebase Firestore with existing venue/menu data

## Project Structure

```
skan.al/
├── skan-ecosystem/               # Primary production stack
│   ├── functions/                # Firebase Functions (v2 Express API)
│   ├── customer-app/             # React PWA (order.skan.al)
│   ├── admin-portal/             # React dashboard (admin.skan.al)
│   ├── marketing-site/           # Astro marketing site (skan.al)
│   └── firebase.json             # Functions + emulator config
├── functions/                    # Legacy Cloud Functions (kept for reference only)
├── enterprise-order-system/      # Enterprise-grade dashboard prototype
├── tests/                        # Playwright specs (customer + admin flows)
└── README.md                     # This file
```

## API Endpoints

### Firebase Cloud Functions
- `GET /api/venue/:slug/menu` - Fetch menu by venue slug
- `POST /api/orders` - Create new order (validates items against menu data)
- `GET /api/venue/:venueId/orders` - Get orders for restaurant
- `PUT /api/orders/:orderId/status` - Update order status
- `POST /api/auth/login` - Restaurant staff login
- `GET /api/health` - Health check

#### Order payload expectations
- Each `items[]` entry must include the `id` of the menu item selected at ordering time. Quantity must be a positive integer.
- The API recalculates pricing from Firestore to prevent tampering and will reject orders referencing unknown or inactive menu items.

#### Authentication
- User documents must include a `passwordHash` generated with Node's `crypto.scrypt` (`salt:hash` format). Plaintext passwords and the previous shared `demo123` secret are no longer accepted by the API.
- Generate a hash from the CLI (example for `demo123`):
  ```bash
  node -e "const crypto=require('crypto');const salt=crypto.randomBytes(16).toString('hex');const hash=crypto.scryptSync('demo123',salt,64).toString('hex');console.log(`${salt}:${hash}`);"
  ```
- A temporary fallback environment variable (`LEGACY_DEMO_PASSWORD`) can be set while migrating existing accounts; remove it once every user has a hashed password stored.
- To backfill hashes, use the helper script in `skan-ecosystem/functions`. Provide either a JSON map of `{ "email": "plaintext" }` or set `DEFAULT_USER_PASSWORD` to reuse one temporary password:
  ```bash
  cd skan-ecosystem/functions
  # Option 1: mapping file (array or object supported)
  node scripts/hashPasswords.js ../files/user-passwords.json

  # Option 2: single default password for all missing users
  DEFAULT_USER_PASSWORD="demo123" npm run hash-passwords
  ```
The script skips users that already have `passwordHash` set and reports any accounts it cannot update (for example when no password is provided).

> **Note:** The top-level `functions/` directory contains the original Cloud Functions build and is retained for historical reference. All active development and deployments should use `skan-ecosystem/functions`.

## Features

### Customer Flow
1. **QR Scanning**: Scan QR code at table → `/order/{venue-slug}/{table-number}`
2. **Menu Browsing**: View menu items with categories and prices
3. **Cart Management**: Add/remove items, adjust quantities
4. **Order Submission**: Submit order with optional customer name
5. **Confirmation**: Receive order number and status

### Restaurant Dashboard
1. **Staff Login**: Authentication for restaurant staff
2. **Order Management**: View orders by status (new, preparing, ready, served)
3. **Status Updates**: Progress orders through workflow
4. **Auto-refresh**: Real-time order updates every 30 seconds
5. **Mobile-friendly**: Optimized for tablet/phone use

## Database Schema

### Existing Collections (Firebase Firestore)
```
venue/
  - name, slug, address, phone, email, settings
  - subcollections: menuCategory, menuItem, table

users/
  - email, fullName, role, venueId, isActive

orders/ (created by API)
  - venueId, tableNumber, orderNumber, customerName
  - items[], totalAmount, status, timestamps
```

## Development Setup

### Prerequisites
- Node.js 18+
- Firebase CLI
- Firebase project (qr-restaurant-api)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd skan.al
   npm install --prefix skan-ecosystem/functions
   npm install --prefix skan-ecosystem/customer-app
   npm install --prefix skan-ecosystem/admin-portal
   npm install --prefix skan-ecosystem/marketing-site
   ```

2. **Firebase setup:**
   ```bash
   npm install -g firebase-tools
   firebase login
   # Project already configured in .firebaserc
   ```

3. **Environment variables:**
   ```bash
   # skan-ecosystem/customer-app/.env
   REACT_APP_API_URL=https://api-mkazmlu7ta-ew.a.run.app/v1

   # skan-ecosystem/admin-portal/.env
   REACT_APP_API_URL=https://api-mkazmlu7ta-ew.a.run.app/v1
   ```

### Development Commands

**Firebase Functions:**
```bash
cd skan-ecosystem/functions
npm run serve     # Local development
npm run deploy    # Deploy to Firebase
```

**Customer PWA:**
```bash
cd skan-ecosystem/customer-app
npm start         # Development server
npm run build     # Production build
```

**Restaurant Admin Portal:**
```bash
cd skan-ecosystem/admin-portal
npm start         # Development server
npm run build     # Production build
```

**Marketing Site:**
```bash
cd skan-ecosystem/marketing-site
npm run dev       # Astro development server
npm run build     # Production build
```

## Deployment

### Firebase Functions
```bash
cd skan-ecosystem/functions
firebase deploy --only functions
```

### Frontend Applications
Build and deploy to static hosting (Netlify/Vercel):

```bash
# Customer app (order.skan.al)
npm run build --prefix skan-ecosystem/customer-app

# Restaurant dashboard (admin.skan.al)
npm run build --prefix skan-ecosystem/admin-portal

# Marketing site (skan.al)
npm run build --prefix skan-ecosystem/marketing-site
```

## Testing

### Demo Data
- **Venue**: Beach Bar Durrës (slug: beach-bar-durres)
- **Demo Login**: manager_email@gmail.com / demo123
- **Sample QR**: skan.al/order/beach-bar-durres/a1

### Test Flow
1. Start API locally: `cd skan-ecosystem/functions && npm run serve`
2. Visit customer app: `http://localhost:3000/order/beach-bar-durres/a1`
3. Browse menu and add items to cart
4. Submit order with customer name
5. Login to restaurant dashboard: `http://localhost:3001/login`
6. View and manage orders

## Production URLs
- **Customer App**: https://skan.al
- **Restaurant Dashboard**: https://admin.skan.al
- **API**: https://api-mkazmlu7ta-ew.a.run.app/v1

## Key Features

### Customer Experience
- Mobile-first responsive design
- Fast loading (< 3 seconds on mobile)
- Intuitive cart management
- Multi-language support (Albanian/English)
- Error handling and offline fallbacks

### Restaurant Operations
- Real-time order notifications
- Status-based order filtering
- Touch-friendly interface for tablets
- Order timing information
- Simple one-click status progression

### Technical Features
- TypeScript for type safety
- Context API for state management
- Firebase integration
- CORS configured for production
- Order number generation (SKN-YYYYMMDD-XXX)
- Error boundaries and loading states

## Security

- Restaurant authentication required for order management
- Input validation on all API endpoints
- CORS configuration for production domains
- No sensitive data exposed in frontend
- Secure Firebase rules (read access for venues, auth required for orders)

## Performance

- React build optimization
- Code splitting and lazy loading
- Compressed assets
- Efficient Firebase queries
- Client-side caching

## Browser Support

- Chrome 90+ (Android/Desktop)
- Safari 14+ (iOS/macOS)  
- Firefox 88+
- Edge 90+

## License

Private project for restaurant operations.

## Support

For technical issues or feature requests, contact the development team.
