# Skan.al Complete Build Plan
**Building Frontend + Missing APIs for Existing Firebase Backend**

## Project Overview
Your developer built an excellent Firebase foundation with:
- ✅ User authentication system
- ✅ Sophisticated venue/menu database structure  
- ✅ Real data (Beach Bar Durrës with menu items)
- ✅ Multi-language support (Albanian)
- ❌ Missing API endpoints
- ❌ No frontend

I'm building the missing pieces to create a complete working system.

---

## Phase 1: Firebase API Functions (Week 1)

### Cloud Functions to Build

#### 1. Menu API
```javascript
// GET /api/venue/:slug/menu
// Returns: venue info + menu items grouped by category
```

#### 2. Order API  
```javascript
// POST /api/orders
// Creates order in Firestore orders collection
// Returns: order confirmation with order number
```

#### 3. Restaurant Dashboard API
```javascript
// GET /api/venue/:venueId/orders
// Returns: orders for restaurant dashboard
// PUT /api/orders/:orderId/status  
// Updates order status (new → preparing → ready → served)
```

#### 4. Authentication API
```javascript
// POST /api/auth/login
// Handles restaurant staff login
// Returns: JWT token + venue access
```

#### 5. QR Code API
```javascript
// GET /api/venue/:slug/qr/:tableId
// Generates QR codes for tables
// Returns: QR code image or redirect URL
```

### Database Collections to Add
```javascript
// orders collection (root level)
{
  id: "auto-generated",
  venueId: "venue-reference", 
  tableId: "table-reference",
  orderNumber: "SKN-001",
  customerName: "optional",
  items: [...], // menu items with quantities
  totalAmount: 00.00,
  status: "new", // new → preparing → ready → served
  createdAt: timestamp,
  updatedAt: timestamp
}

// Add tables subcollection data if missing
{
  tableNumber: "A15",
  qrCode: "generated-qr-url",
  isActive: true
}
```

---

## Phase 2: Customer Frontend (Week 1-2)

### React Application Structure
```
skan-frontend/
├── src/
│   ├── pages/
│   │   ├── QRLanding.tsx      // skan.al/order/:slug/:table
│   │   ├── Menu.tsx           // Browse menu, add to cart
│   │   ├── Cart.tsx           // Review order, submit
│   │   └── Confirmation.tsx   // Order confirmation
│   ├── components/
│   │   ├── MenuItem.tsx       // Menu item card
│   │   ├── Cart/              // Cart components
│   │   └── UI/                // Buttons, inputs, etc.
│   ├── hooks/
│   │   ├── useMenu.ts         // Fetch menu data
│   │   ├── useOrder.ts        // Order management
│   │   └── useCart.ts         // Cart state
│   ├── services/
│   │   └── api.ts             // API calls to Firebase
│   └── types/
│       └── index.ts           // TypeScript definitions
```

### Customer User Flow
```
1. Scan QR → skan.al/order/beach-bar-durres/a15
2. See: "Beach Bar Durrës - Table A15" 
3. Browse menu by categories (Drinks, Food, etc.)
4. Add items to cart with quantities
5. Review cart: items, quantities, total
6. Enter customer name (optional)
7. Submit order → "Order SKN-042 sent!"
8. Show order confirmation with details
```

---

## Phase 3: Restaurant Dashboard (Week 2)

### Restaurant Web Application
```
skan-restaurant/
├── src/
│   ├── pages/
│   │   ├── Login.tsx          // Restaurant staff login
│   │   ├── Dashboard.tsx      // Orders management
│   │   └── OrderDetails.tsx   // Individual order view
│   ├── components/
│   │   ├── OrderCard.tsx      // Order display card
│   │   ├── StatusButton.tsx   // Update order status
│   │   └── OrdersList.tsx     // Orders list view
│   └── hooks/
│       ├── useOrders.ts       // Fetch/update orders
│       └── useAuth.ts         // Authentication
```

### Restaurant Dashboard Flow
```
1. Login: username/password → JWT token
2. Dashboard: Real-time orders list
   - New Orders (red badge)
   - Preparing Orders (yellow)  
   - Ready Orders (green)
   - Completed Orders (gray)
3. Click order → See full details
4. Update status: New → Preparing → Ready → Served
5. Orders update in real-time
```

---

## Phase 4: Integration & Deployment (Week 2)

### Domain Setup
```
skan.al → Customer frontend (Netlify/Vercel)
admin.skan.al → Restaurant dashboard  
api.skan.al → Firebase Cloud Functions (custom domain)
```

### QR Code System
```
QR Code Content: https://skan.al/order/beach-bar-durres/a15
- beach-bar-durres = venue slug
- a15 = table identifier
- Generates unique QR for each table
- Printable QR cards for restaurants
```

### Real-time Updates (Optional V1.1)
```
- WebSocket/Firebase Realtime for live order updates
- Customer sees: "Your order is being prepared..."
- Restaurant sees: New orders appear instantly
```

---

## Technical Implementation Details

### Firebase Integration
```javascript
// Using existing Firebase project: qr-restaurant-api
// Firestore collections: users, venue, orders (new)
// Authentication: Firebase Auth with custom claims
// Cloud Functions: Express.js REST API
```

### Frontend Technology
```javascript
// React 18 + TypeScript
// Tailwind CSS for styling  
// React Router for navigation
// Context API for state management
// Axios for API calls
```

### Development Workflow
```bash
# Local development
npm run dev              # Frontend dev server
firebase emulators:start # Local Firebase functions

# Testing
npm run test            # Unit tests
npm run e2e             # End-to-end testing  

# Deployment
npm run build           # Build production
firebase deploy         # Deploy functions
netlify deploy          # Deploy frontend
```

---

## Success Metrics & Testing

### Week 1 Deliverables
- [ ] All API endpoints working and tested
- [ ] Customer frontend: QR → Menu → Order working
- [ ] Restaurant dashboard: Login → Orders → Status updates
- [ ] Local development environment complete

### Week 2 Deliverables  
- [ ] Deployed to production domains
- [ ] QR codes generated for test restaurant
- [ ] End-to-end customer journey working
- [ ] Restaurant staff can manage orders
- [ ] Real customer/restaurant testing completed

### Success Criteria
- Customer can scan QR, order, and receive confirmation
- Restaurant staff can see orders and update status
- System handles 20+ concurrent orders
- Mobile-responsive and fast loading
- Works with existing Beach Bar Durrës data

---

## Required Access & Credentials

To build this, I need:

### 1. Firebase Project Access
```bash
# Firebase CLI setup
firebase login
firebase use qr-restaurant-api
firebase init functions
```

### 2. Project Configuration
```javascript
// Firebase config object (from your project settings)
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "qr-restaurant-api",
  // ... other config
};
```

### 3. Domain Access
- Purchase/configure skan.al domain  
- DNS setup for subdomains
- SSL certificates

---

## Next Steps

1. **Share Firebase credentials** so I can deploy functions
2. **Confirm domain setup** approach (skan.al)
3. **Start building** - I'll provide daily progress updates
4. **Test with Beach Bar Durrës** real data once complete

**Timeline: 2 weeks to complete working system**
**Result: Full QR ordering platform using your existing database**

Ready to start building!