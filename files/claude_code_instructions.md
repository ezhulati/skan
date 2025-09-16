# Claude Code Instructions: Skan.al QR Ordering System

## Project Overview
Build a complete QR code ordering system with:
- **Existing Firebase Backend**: qr-restaurant-api project with Firestore database
- **Missing API Layer**: Cloud Functions need to be implemented
- **Customer Frontend**: React app for QR ordering flow
- **Restaurant Dashboard**: React app for order management

## Firebase Project Details
- **Project ID**: qr-restaurant-api
- **Region**: europe-west1
- **Database**: Cloud Firestore with existing venue/menu data
- **Existing Collections**: venue, users (with Beach Bar Durrës data)

## Task 1: Implement Firebase Cloud Functions

### Setup
```bash
# The Firebase project already exists
# Need to add Cloud Functions with these endpoints:

GET /api/venue/:slug/menu          # Fetch menu by venue slug
POST /api/orders                   # Create new order
GET /api/venue/:venueId/orders     # Get orders for restaurant
PUT /api/orders/:orderId/status    # Update order status
POST /api/auth/login               # Restaurant staff login
GET /api/health                    # Health check
```

### Required Dependencies
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

### Database Schema (Already Exists)
```
venue/
  - name, slug, address, phone, email, settings
  - subcollections: menuCategory, menuItem, table

users/
  - email, fullName, role, venueId, isActive

orders/ (NEW - needs to be created by API)
  - venueId, tableNumber, orderNumber, customerName
  - items[], totalAmount, status, timestamps
```

### Cloud Function Implementation
Create functions/index.js with Express app handling all API routes. The function should:

1. **Menu Endpoint**: Query venue by slug, fetch menu items and categories
2. **Order Creation**: Generate order numbers, validate items, store in Firestore
3. **Order Management**: Filter orders by venue, update status with timestamps
4. **Authentication**: Verify user credentials against existing users collection

### Key Requirements
- Order numbers format: "SKN-YYYYMMDD-001" (daily counter)
- Status flow: new → preparing → ready → served
- Menu items grouped by category with Albanian translations
- Proper error handling and CORS configuration

## Task 2: Build Customer Frontend

### Tech Stack
- React 18 + TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Context API for cart state management

### Required Pages
```
/order/:venueSlug/:tableNumber  → QR Landing page
/menu/:venueId                  → Menu browsing
/cart                          → Cart review and checkout  
/confirmation/:orderId         → Order confirmation
```

### Key Features
- QR code URL parsing and venue verification
- Menu display with categories and items
- Shopping cart with add/remove/quantity controls
- Order submission with customer name (optional)
- Mobile-first responsive design
- Loading states and error handling

### API Integration
- Base URL: Firebase Cloud Functions endpoint
- Menu fetching by venue slug
- Order creation with cart items
- Error handling for network issues

## Task 3: Build Restaurant Dashboard

### Tech Stack
- React 18 + TypeScript  
- React Router for navigation
- Tailwind CSS for styling
- Context API for authentication

### Required Pages
```
/login     → Staff authentication
/dashboard → Orders management interface
```

### Key Features
- Login with existing user credentials (manager_email@gmail.com)
- Real-time orders display with status filtering
- Order status updates (Accept → Preparing → Ready → Served)
- Order details with items, customer info, special instructions
- Auto-refresh every 30 seconds
- Mobile-friendly design for tablet use

### Order Management
- Color-coded status indicators
- Filter tabs: Active, New, Preparing, Ready, Served, All
- One-click status progression buttons
- Order timing information (time since created)

## Task 4: Deployment Configuration

### Domain Structure
```
skan.al                 → Customer frontend
admin.skan.al          → Restaurant dashboard  
(API uses Firebase URL) → Cloud Functions
```

### Environment Variables
```bash
# Customer Frontend
REACT_APP_API_URL=https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api

# Restaurant Dashboard  
REACT_APP_API_URL=https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api
```

### Deployment Targets
- **Cloud Functions**: Deploy to existing Firebase project
- **Customer App**: Deploy to Netlify/Vercel for skan.al
- **Restaurant App**: Deploy to Netlify/Vercel for admin.skan.al

## Task 5: Database Setup

### Add Missing Collections
```javascript
// Add tables subcollection to venue documents
venue/[venueId]/table/
{
  tableNumber: "A1",
  displayName: "Table A1",
  isActive: true,
  qrCode: "https://skan.al/order/beach-bar-durres/a1"
}

// Orders collection (created by API)
orders/
{
  venueId: "venue-reference",
  tableNumber: "A1", 
  orderNumber: "SKN-20250915-001",
  customerName: "Customer Name",
  items: [{name, price, quantity}],
  totalAmount: 25.50,
  status: "new",
  createdAt: timestamp
}
```

## Existing Data Integration

### Venue Data (Beach Bar Durrës)
- **Slug**: "beach-bar-durres" 
- **Menu Items**: Albanian Beer (€3.50), etc.
- **Settings**: EUR currency, Albanian language
- **Location**: Durrës Beach, Albania

### User Accounts
- **Admin**: arditxhanaj@gmail.com
- **Manager**: manager_email@gmail.com  
- Both have venueId references

## Testing Requirements

### Customer Flow Testing
1. Visit: skan.al/order/beach-bar-durres/a1
2. Should display Beach Bar Durrës info and Table A1
3. Browse menu with real items (Albanian Beer, etc.)
4. Add items to cart, adjust quantities
5. Submit order with/without customer name
6. See confirmation with order number

### Restaurant Flow Testing  
1. Visit: admin.skan.al
2. Login with manager_email@gmail.com credentials
3. See orders dashboard with real-time updates
4. Update order status through the workflow
5. Verify status changes persist

### API Testing
All endpoints should return proper JSON responses and handle errors gracefully.

## Success Criteria

### Technical
- All API endpoints respond correctly (no 404s)
- Customer can complete full ordering flow
- Restaurant staff can manage orders
- Mobile responsive on phones/tablets
- Fast loading (< 3 seconds on mobile)

### Business  
- Real order created in Firestore database
- Restaurant staff can mark orders complete
- Order data includes all required fields
- System works with existing venue data

## Security Requirements

### Firestore Rules
```javascript
// Allow public read for venues/menus
// Allow public write for orders
// Require auth for order management
// Restrict user collection access
```

### API Security
- Input validation on all endpoints
- CORS configuration for frontend domains
- Authentication for restaurant operations
- Rate limiting on order creation

## Performance Requirements
- API response time < 500ms
- Page load time < 3 seconds on 3G
- Database queries optimized with indexes
- Frontend bundle size minimized

## Project Structure
```
skan-system/
├── functions/           # Firebase Cloud Functions
│   ├── index.js        # Main API implementation
│   └── package.json    # Dependencies
├── customer-frontend/   # React customer app
│   ├── src/
│   │   ├── pages/      # QR, Menu, Cart, Confirmation
│   │   ├── components/ # MenuItem, CartItem, etc.
│   │   ├── contexts/   # CartContext
│   │   └── services/   # API calls
│   └── package.json
├── restaurant-dashboard/ # React restaurant app
│   ├── src/
│   │   ├── pages/      # Login, Dashboard
│   │   ├── components/ # OrderCard, etc.
│   │   ├── contexts/   # AuthContext  
│   │   └── services/   # API calls
│   └── package.json
└── README.md           # Setup instructions
```

## Claude Code Specific Instructions

1. **Start with Firebase Functions** - This fixes the 404 API error
2. **Use existing Firebase project** - Don't create new one
3. **Integrate with existing data** - Use Beach Bar Durrës venue
4. **Test thoroughly** - Each component should work end-to-end
5. **Deploy incrementally** - Functions first, then frontends
6. **Mobile-first design** - Primary use case is mobile phones
7. **Real data integration** - Use actual menu items from database

The system should work immediately after deployment with the existing Beach Bar Durrës data, allowing real testing with QR codes linking to actual menu items.

## Expected Timeline
- **Day 1**: Firebase Functions implementation and deployment
- **Day 2**: Customer frontend development and deployment  
- **Day 3**: Restaurant dashboard development and deployment
- **Day 4**: Testing, bug fixes, and optimization

Final result: Complete working QR ordering system using existing Firebase database.