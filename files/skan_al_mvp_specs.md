# Skan.al MVP - Complete Specifications & User Stories
**Version 1.0 | 4-Week Development Timeline**

---

## 1. PROJECT OVERVIEW

### 1.1 Vision Statement
Skan.al enables Albanian restaurant customers to order directly from their table by scanning QR codes, eliminating wait times while helping restaurants serve more customers with existing staff.

### 1.2 Success Hypothesis
"If we build a simple QR ordering system, then Albanian restaurant customers will prefer it over waiting for waiters, and restaurant staff will efficiently manage orders through a digital dashboard."

### 1.3 MVP Scope (What We're Testing)
- Customer willingness to scan QR codes and complete orders
- Restaurant staff adoption of digital order management
- Technical feasibility of core ordering workflow
- Basic market demand validation

### 1.4 Out of Scope (V1)
- Real-time notifications
- Payment processing
- Multi-restaurant management
- Analytics dashboards
- Inventory management
- Staff accounts/permissions
- Advanced error handling
- Mobile app (web-only)

---

## 2. USER PERSONAS

### 2.1 Primary Customer Persona: "Blendi"
**Demographics:**
- Age: 25-45
- Location: Tirana, Durrës, coastal areas
- Device: Android smartphone (mid-range)
- Tech comfort: Basic to intermediate
- Languages: Albanian (primary), some English

**Context:**
- Dining at beach bars, cafes, restaurants
- Often in groups of 2-4 people
- Values speed and convenience
- Used to traditional waiter service

**Pain Points:**
- Waiting 10-20 minutes for waiter attention
- Language barriers with foreign staff
- Unclear menu descriptions
- Not knowing when food will arrive

**Goals:**
- Order quickly without waiting
- Understand what they're ordering
- Enjoy time with friends/family
- Get food in reasonable time

### 2.2 Primary Restaurant Persona: "Fatma" (Restaurant Owner/Manager)
**Demographics:**
- Age: 35-55
- Role: Owner or manager of small-medium restaurant
- Tech comfort: Basic
- Device: Smartphone, maybe tablet
- Seasonal business (tourism-dependent)

**Context:**
- Managing 10-40 table restaurant/bar
- 3-8 staff members
- Busy summer season, slower winter
- Operates with tight margins

**Pain Points:**
- Can't serve customers fast enough during peak times
- Waiters get overwhelmed, orders get forgotten
- Hiring/training new staff is expensive
- Lost revenue from customers who leave due to slow service

**Goals:**
- Serve more customers with same staff
- Reduce order errors and forgotten requests
- Increase table turnover during peak hours
- Simple solution that doesn't require staff training

---

## 3. USER STORIES & ACCEPTANCE CRITERIA

### 3.1 Customer User Stories

#### Story 1: QR Code Scanning & Restaurant Recognition
**As a customer,**  
**I want to scan a QR code at my table,**  
**So that I can access the menu for this specific restaurant and table.**

**Acceptance Criteria:**
- When I scan QR code, I see correct restaurant name
- Table number is clearly displayed
- Page loads within 5 seconds on mobile
- Works on Android Chrome and iPhone Safari
- QR code format: `skan.al/order/{restaurant-slug}/{table-id}`

**Definition of Done:**
- [ ] QR codes generate unique URLs per table
- [ ] Landing page shows restaurant name and table number
- [ ] Works on mobile browsers (tested on 3+ devices)
- [ ] Error handling for invalid QR codes

---

#### Story 2: Menu Browsing & Item Selection
**As a customer,**  
**I want to see the restaurant's menu with prices,**  
**So that I can choose what to order.**

**Acceptance Criteria:**
- Menu items display with name and price
- Items are grouped by category (drinks, food, etc.)
- I can see quantity selector (+ / - buttons)
- Running total updates as I add items
- "Order Now" button is prominently displayed

**Definition of Done:**
- [ ] Menu loads from database
- [ ] Quantity controls work (min 0, max 10 per item)
- [ ] Total calculation is accurate
- [ ] Mobile-responsive design
- [ ] At least 20 test menu items loaded

---

#### Story 3: Order Submission & Confirmation
**As a customer,**  
**I want to submit my order,**  
**So that the restaurant knows what I want.**

**Acceptance Criteria:**
- Order form collects customer name (optional)
- Order summary shows items, quantities, and total
- "Submit Order" button creates order in system
- Confirmation page shows unique order number
- Clear message that order was sent to restaurant

**Definition of Done:**
- [ ] Order saves to database with all details
- [ ] Unique order number generates (format: #SKN-001)
- [ ] Confirmation page displays order details
- [ ] Order includes timestamp and table information
- [ ] Works without customer name (anonymous orders)

---

### 3.2 Restaurant User Stories

#### Story 4: Restaurant Staff Login
**As restaurant staff,**  
**I want to log into the system,**  
**So that I can manage orders for my restaurant.**

**Acceptance Criteria:**
- Simple login form with username/password
- Authentication persists for the session
- Redirects to orders dashboard after login
- "Remember me" option for convenience
- Clear error messages for wrong credentials

**Definition of Done:**
- [ ] Login form with validation
- [ ] Session management (stays logged in)
- [ ] Hardcoded credentials for MVP (1 per restaurant)
- [ ] Logout functionality
- [ ] Mobile-friendly login page

---

#### Story 5: View Incoming Orders
**As restaurant staff,**  
**I want to see new orders as they come in,**  
**So that I can prepare the food/drinks.**

**Acceptance Criteria:**
- Orders list shows newest orders first
- Each order displays: order number, table, items, total, time
- Orders are clearly marked as "New" vs "Completed"
- Page refreshes when I click "Refresh Orders" button
- Order details are easy to read on mobile/tablet

**Definition of Done:**
- [ ] Orders list fetches from database
- [ ] Orders sorted by creation time (newest first)
- [ ] Clear visual distinction between new/completed orders
- [ ] Manual refresh button works
- [ ] Responsive design for tablets and phones
- [ ] Shows at least order number, table, items, timestamp

---

#### Story 6: Mark Orders Complete
**As restaurant staff,**  
**I want to mark orders as complete when finished,**  
**So that I don't serve the same order twice.**

**Acceptance Criteria:**
- "Mark Complete" button next to each new order
- Clicking button moves order to "Completed" section
- Action is irreversible (no undo needed for MVP)
- Button is large enough for touch interaction
- Completed orders show completion timestamp

**Definition of Done:**
- [ ] "Mark Complete" button updates order status in database
- [ ] UI immediately reflects status change
- [ ] Completed orders move to separate section
- [ ] Touch-friendly button sizing (min 44px)
- [ ] Completion timestamp saves to database

---

## 4. TECHNICAL SPECIFICATIONS

### 4.1 Architecture Overview
```
Customer Mobile Browser → QR Code → Landing Page → Menu → Order Form → Confirmation
                                       ↓
                          Database (PostgreSQL) ← API (Node.js/Express)
                                       ↑
Restaurant Browser → Login → Orders Dashboard → Mark Complete
```

### 4.2 Database Schema

```sql
-- Restaurants table
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Other',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    table_number VARCHAR(20) NOT NULL,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    order_items JSONB NOT NULL, -- [{name, price, quantity}]
    total_amount DECIMAL(8,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Sample data
INSERT INTO restaurants (name, slug) VALUES 
('Beach Bar Durrës', 'beach-bar-durres'),
('Kafe Tirana', 'kafe-tirana');

INSERT INTO menu_items (restaurant_id, name, price, category) VALUES 
(1, 'Aperol Spritz', 8.50, 'Drinks'),
(1, 'Albanian Beer', 3.00, 'Drinks'),
(1, 'Greek Salad', 12.00, 'Food'),
(1, 'Grilled Fish', 18.00, 'Food');
```

### 4.3 API Endpoints

#### GET /api/restaurant/{slug}/menu
**Purpose:** Fetch menu for QR landing page
```json
{
  "restaurant": {
    "id": 1,
    "name": "Beach Bar Durrës"
  },
  "menu": [
    {
      "id": 1,
      "name": "Aperol Spritz",
      "price": 8.50,
      "category": "Drinks"
    }
  ]
}
```

#### POST /api/orders
**Purpose:** Create new order from customer
```json
// Request
{
  "restaurant_id": 1,
  "table_number": "A15",
  "customer_name": "Blendi", // optional
  "items": [
    {
      "menu_item_id": 1,
      "name": "Aperol Spritz",
      "price": 8.50,
      "quantity": 2
    }
  ]
}

// Response
{
  "order_number": "SKN-001",
  "total": 17.00,
  "message": "Order sent to restaurant"
}
```

#### POST /api/auth/login
**Purpose:** Restaurant staff login
```json
// Request
{
  "username": "beachbar",
  "password": "demo123"
}

// Response
{
  "token": "jwt_token_here",
  "restaurant_id": 1,
  "restaurant_name": "Beach Bar Durrës"
}
```

#### GET /api/restaurant/{id}/orders
**Purpose:** Get orders for restaurant dashboard
```json
[
  {
    "id": 1,
    "order_number": "SKN-001",
    "table_number": "A15",
    "customer_name": "Blendi",
    "items": [
      {
        "name": "Aperol Spritz",
        "quantity": 2,
        "price": 8.50
      }
    ],
    "total": 17.00,
    "status": "new",
    "created_at": "2025-01-15T14:30:00Z"
  }
]
```

#### PUT /api/orders/{id}/complete
**Purpose:** Mark order as completed
```json
// Request - no body needed

// Response
{
  "message": "Order marked complete",
  "completed_at": "2025-01-15T15:00:00Z"
}
```

### 4.4 Frontend Pages & Components

#### Customer Pages

**1. QR Landing Page** (`/order/{restaurant-slug}/{table-id}`)
- Shows restaurant name and table number
- "Continue to Menu" button
- Error handling for invalid URLs

**2. Menu Page** (`/menu/{restaurant-id}`)
- Menu items grouped by category
- Quantity selectors for each item
- Running total display
- "Order Now" button

**3. Order Form** (`/order-form/{restaurant-id}`)
- Order summary
- Optional customer name field
- Submit order button

**4. Confirmation Page** (`/confirmation`)
- Order number display
- Order details summary
- "Order another item" button

#### Restaurant Pages

**1. Login Page** (`/restaurant/login`)
- Username/password form
- Remember me checkbox
- Simple validation

**2. Orders Dashboard** (`/restaurant/dashboard`)
- New orders section
- Completed orders section
- Refresh button
- Logout link

### 4.5 Technology Stack

**Backend:**
- Node.js 18+
- Express.js 4.x
- PostgreSQL 15+
- bcrypt (password hashing)
- jsonwebtoken (authentication)
- cors (cross-origin requests)

**Frontend:**
- React 18 with TypeScript
- No CSS framework (basic CSS)
- Fetch API for HTTP requests
- React Router for navigation

**Development:**
- Git version control
- npm package management
- Environment variables for config
- Postman for API testing

**Deployment:**
- Heroku (backend + database)
- Netlify or Vercel (frontend)
- Custom domain (skan.al)

---

## 5. TESTING SCENARIOS

### 5.1 Customer Flow Testing

**Scenario 1: Happy Path Order**
1. Customer scans QR code
2. Lands on correct restaurant page
3. Browses menu and adds 2 items
4. Sees correct total calculation
5. Submits order with name
6. Receives order confirmation with number
7. Order appears in restaurant dashboard

**Expected Result:** End-to-end order placement works

**Scenario 2: Anonymous Order**
1. Customer scans QR code
2. Places order without entering name
3. Order submits successfully
4. Shows "Anonymous Customer" in restaurant dashboard

**Expected Result:** Orders work without customer names

**Scenario 3: Invalid QR Code**
1. Customer scans expired/malformed QR code
2. Sees clear error message
3. Option to manually enter restaurant code

**Expected Result:** Graceful error handling

### 5.2 Restaurant Flow Testing

**Scenario 4: Order Management**
1. Staff logs into dashboard
2. Sees new order from test scenario 1
3. Marks order as complete
4. Order moves to completed section
5. Cannot mark same order complete twice

**Expected Result:** Order status management works

**Scenario 5: Multiple Orders**
1. Create 5 test orders through customer flow
2. All orders appear in dashboard
3. Mark 2 orders complete
4. Refresh page - state persists
5. Orders show correct timestamps

**Expected Result:** Multiple order handling works

### 5.3 Mobile Compatibility Testing

**Test on devices:**
- Android Chrome (older Android phones)
- iPhone Safari (iOS 14+)
- Tablet browsers
- Slow 3G connection simulation

**Key checks:**
- QR scanning works
- Touch targets are large enough (44px minimum)
- Text is readable without zooming
- Forms work with mobile keyboards
- Page loads under 10 seconds on slow connections

---

## 6. DEPLOYMENT REQUIREMENTS

### 6.1 Environment Setup

**Development:**
```bash
# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost/skan_dev
JWT_SECRET=dev_secret_key

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
```

**Production:**
```bash
# Backend (Heroku Config Vars)
NODE_ENV=production
DATABASE_URL=postgresql://... (Heroku Postgres)
JWT_SECRET=secure_production_secret

# Frontend (Netlify Environment Variables)
REACT_APP_API_URL=https://skan-api.herokuapp.com/api
```

### 6.2 Deployment Checklist

**Backend (Heroku):**
- [ ] Create Heroku app
- [ ] Add Heroku Postgres addon
- [ ] Set environment variables
- [ ] Deploy from Git repository
- [ ] Run database migrations
- [ ] Test API endpoints

**Frontend (Netlify):**
- [ ] Build React application
- [ ] Set environment variables
- [ ] Deploy to Netlify
- [ ] Configure custom domain
- [ ] Test customer flow

**Domain & DNS:**
- [ ] Purchase skan.al domain
- [ ] Configure DNS for subdomains
- [ ] SSL certificates active
- [ ] All redirects working

### 6.3 Launch Validation

**Technical Validation:**
- [ ] All API endpoints respond correctly
- [ ] Database connections stable
- [ ] QR codes generate and scan properly
- [ ] Mobile performance acceptable (< 5s load time)
- [ ] No console errors in browser

**Business Validation:**
- [ ] Test with 1 real restaurant partner
- [ ] Generate 10+ real customer orders
- [ ] Restaurant staff can operate system
- [ ] Order accuracy 95%+
- [ ] Customer completion rate 50%+

---

## 7. SUCCESS METRICS

### 7.1 Technical Metrics
- **Page Load Time:** < 5 seconds on mobile
- **Order Completion Rate:** 60%+ (scans that become orders)
- **System Uptime:** 99%+ during testing period
- **Error Rate:** < 5% of requests fail

### 7.2 User Adoption Metrics
- **QR Scan to Order:** 40%+ conversion rate
- **Restaurant Usage:** Daily login and order management
- **Customer Return:** 20%+ scan QR codes multiple times
- **Staff Efficiency:** Orders marked complete within 30 minutes

### 7.3 Business Validation
- **Partner Restaurant:** 1 restaurant actively using system
- **Real Orders:** 50+ orders from actual customers
- **Payment Willingness:** Restaurant agrees to pay €25/month
- **Word of Mouth:** Restaurant recommends to other venues

---

## 8. RISK MITIGATION

### 8.1 Technical Risks

**Risk:** QR codes don't scan reliably
**Mitigation:** Test multiple QR libraries, provide manual entry option

**Risk:** Database crashes during testing
**Mitigation:** Daily backups, simple restore process

**Risk:** Mobile performance is too slow
**Mitigation:** Optimize images, minimize JavaScript, test on old phones

### 8.2 User Adoption Risks

**Risk:** Customers won't scan QR codes
**Mitigation:** Partner with tech-friendly venues first, provide table tents explaining benefits

**Risk:** Restaurant staff ignore the system
**Mitigation:** Choose restaurant with motivated owner, provide simple training

**Risk:** Language barriers (Albanian interface)
**Mitigation:** Keep text minimal, use icons where possible, test with actual users

### 8.3 Business Risks

**Risk:** Restaurant won't pay for system
**Mitigation:** Prove value with free trial, show increased efficiency metrics

**Risk:** Seasonal business affects sustainability
**Mitigation:** Target year-round venues first, plan for seasonal cash flow

---

## 9. DEVELOPMENT TIMELINE

### Week 1: Backend Foundation
**Monday-Tuesday:** Database setup, basic Express server
**Wednesday-Thursday:** Menu and order APIs
**Friday:** Authentication system

### Week 2: Customer Frontend
**Monday-Tuesday:** QR landing and menu pages
**Wednesday-Thursday:** Order form and confirmation
**Friday:** API integration

### Week 3: Restaurant Frontend
**Monday-Tuesday:** Login and dashboard pages
**Wednesday-Thursday:** Order management functionality
**Friday:** Complete frontend integration

### Week 4: Testing & Deployment
**Monday-Tuesday:** End-to-end testing and bug fixes
**Wednesday-Thursday:** Deployment to production
**Friday:** Partner restaurant onboarding

---

## 10. POST-MVP ROADMAP (If Successful)

### Month 2: Real-time Features
- WebSocket integration for live updates
- Push notifications for new orders
- Order status tracking for customers

### Month 3: Enhanced UX
- Better mobile design
- Order history
- Customer feedback system

### Month 4: Business Features
- Payment processing integration
- Basic analytics for restaurants
- Multi-restaurant management

**Note:** Only build these if MVP proves customer demand and restaurant willingness to pay.

---

## APPROVAL & SIGN-OFF

This document represents the complete specifications for Skan.al MVP. Any feature additions or changes must be documented and approved to maintain project scope.

**Document Version:** 1.0  
**Created:** January 2025  
**Target Completion:** 4 weeks from development start  

By focusing on this minimal viable product, we can validate the core business hypothesis quickly and cost-effectively before investing in more complex features.