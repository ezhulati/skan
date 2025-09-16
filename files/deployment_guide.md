# Skan.al Complete Deployment Guide

## Overview
Complete instructions to deploy your QR ordering system using the existing Firebase backend.

---

## Phase 1: Deploy Firebase Cloud Functions

### 1. Setup Firebase CLI
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to your project
firebase use qr-restaurant-api
```

### 2. Initialize Functions (if not already done)
```bash
# In your project root
firebase init functions

# Choose:
# - Use existing project: qr-restaurant-api
# - Language: JavaScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### 3. Replace Functions Code
```bash
# Copy the functions code I provided
cp firebase_functions_index.js functions/index.js

# Install additional dependencies
cd functions
npm install cors express
cd ..
```

### 4. Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:api
```

### 5. Verify Deployment
After deployment, test your API:
```bash
# Test health endpoint
curl https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api/health

# Test menu endpoint (should work now)
curl https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api/venue/beach-bar-durres/menu
```

---

## Phase 2: Deploy Customer Frontend

### 1. Create React App
```bash
# Create new React app
npx create-react-app skan-customer --template typescript
cd skan-customer

# Install dependencies
npm install react-router-dom @types/react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configure Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Add Frontend Code
```bash
# Replace src/App.tsx with the customer frontend code I provided
# Create the necessary component files and structure
```

### 4. Environment Configuration
```bash
# Create .env file
echo "REACT_APP_API_URL=https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api" > .env
```

### 5. Build and Deploy
```bash
# Build for production
npm run build

# Deploy to Netlify (recommended)
# 1. Install Netlify CLI: npm install -g netlify-cli
# 2. Deploy: netlify deploy --prod --dir=build

# Or deploy to Vercel
# 1. Install Vercel CLI: npm install -g vercel
# 2. Deploy: vercel --prod
```

---

## Phase 3: Deploy Restaurant Dashboard

### 1. Create Dashboard App
```bash
# Create restaurant dashboard
npx create-react-app skan-restaurant --template typescript
cd skan-restaurant

# Install dependencies (same as customer app)
npm install react-router-dom @types/react-router-dom date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Add Dashboard Code
```bash
# Add the restaurant dashboard code I provided
# Configure Tailwind CSS (same as customer app)
```

### 3. Environment Configuration
```bash
# Create .env file
echo "REACT_APP_API_URL=https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api" > .env
```

### 4. Deploy
```bash
# Build and deploy (same process as customer app)
npm run build
netlify deploy --prod --dir=build
```

---

## Phase 4: Domain Configuration

### 1. Domain Setup
```bash
# Purchase skan.al domain (or use your existing domain)
# Configure DNS records:

# Customer app
skan.al → [Netlify/Vercel customer app URL]

# Restaurant dashboard  
admin.skan.al → [Netlify/Vercel restaurant app URL]

# API (optional custom domain)
api.skan.al → api-mkamlu7ta-e-europe-west1.cloudfunctions.net
```

### 2. SSL Certificates
```bash
# Netlify/Vercel automatically provide SSL
# Verify HTTPS is working for all domains
```

---

## Phase 5: Database Setup (Add Missing Data)

### 1. Add Table Data
In Firebase Console → Firestore → venue → Beach Bar Durrës → table collection:

```javascript
// Add table documents
{
  tableNumber: "A1",
  displayName: "Table A1", 
  isActive: true,
  qrCode: "https://skan.al/order/beach-bar-durres/a1"
}

{
  tableNumber: "A2", 
  displayName: "Table A2",
  isActive: true,
  qrCode: "https://skan.al/order/beach-bar-durres/a2"
}

// Add 10-20 more tables as needed
```

### 2. Verify Menu Data
Ensure menu items have all required fields:
```javascript
{
  name: "Albanian Beer",
  nameAlbanian: "Birra Shqiptare", 
  price: 3.50,
  category: "drinks",
  description: "Local Korça beer, ice cold and refreshing",
  allergens: ["gluten"],
  isAvailable: true,
  sortOrder: 1
}
```

### 3. Test User Credentials
Verify these users can log in:
- `arditxhanaj@gmail.com` 
- `manager_email@gmail.com`

---

## Phase 6: Testing & Validation

### 1. End-to-End Testing
```bash
# Customer Flow
1. Visit: https://skan.al/order/beach-bar-durres/a1
2. Should see venue info and table A1
3. Click "View Menu" 
4. Add items to cart
5. Submit order
6. See confirmation with order number

# Restaurant Flow  
1. Visit: https://admin.skan.al
2. Login with test credentials
3. Should see dashboard with orders
4. Update order status
5. Verify changes reflect immediately
```

### 2. QR Code Generation
```bash
# Generate QR codes for tables
# Use any QR generator with URLs like:
https://skan.al/order/beach-bar-durres/a1
https://skan.al/order/beach-bar-durres/a2
# etc.

# Print QR codes on table cards/tents
```

### 3. Mobile Testing
```bash
# Test on actual mobile devices:
- Android Chrome
- iPhone Safari  
- Tablet browsers

# Verify:
- QR scanning works
- Touch targets are large enough
- Loading is fast enough
- All functionality works
```

---

## Production Configuration

### 1. Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Venues are read-only
    match /venue/{venueId} {
      allow read: if true;
      allow write: if request.auth != null;
      
      // Menu items are readable by everyone
      match /menuItem/{itemId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      
      // Tables are readable by everyone  
      match /table/{tableId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
    
    // Orders can be created by anyone, updated by auth users
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
    
    // Users collection restricted to auth users
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Environment Variables
```bash
# Customer App (.env.production)
REACT_APP_API_URL=https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api
REACT_APP_DOMAIN=skan.al

# Restaurant App (.env.production) 
REACT_APP_API_URL=https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api
REACT_APP_DOMAIN=admin.skan.al
```

### 3. Performance Optimization
```bash
# Enable caching headers
# Optimize images
# Minify JavaScript/CSS
# Enable gzip compression
# Set up CDN (Netlify/Vercel do this automatically)
```

---

## Monitoring & Analytics

### 1. Firebase Console Monitoring
```bash
# Monitor:
- Cloud Functions performance
- Database read/write operations  
- Authentication usage
- Error logs
```

### 2. Application Monitoring
```bash
# Add Google Analytics to both apps
# Monitor:
- QR scan → order conversion rate
- Order completion rate
- Mobile vs desktop usage
- Page load times
```

### 3. Business Metrics
```bash
# Track:
- Orders per day/hour
- Average order value
- Peak usage times
- Customer return rate
```

---

## Launch Checklist

### Pre-Launch
- [ ] All Firebase Functions deployed and tested
- [ ] Customer frontend deployed and accessible
- [ ] Restaurant dashboard deployed and accessible  
- [ ] Domain DNS configured correctly
- [ ] SSL certificates active
- [ ] Database has sample menu data
- [ ] Table QR codes generated
- [ ] Mobile testing completed
- [ ] Restaurant staff trained

### Launch Day
- [ ] Monitor Firebase Functions logs
- [ ] Monitor application performance
- [ ] Customer support ready
- [ ] Backup/rollback plan ready
- [ ] Analytics tracking active

### Post-Launch
- [ ] Daily performance monitoring
- [ ] Customer feedback collection
- [ ] Restaurant feedback collection
- [ ] Bug tracking and fixes
- [ ] Performance optimization

---

## Success Metrics

### Technical Metrics
- API response time < 500ms
- Page load time < 3 seconds on mobile
- 99.9% uptime
- Zero critical bugs

### Business Metrics  
- 50%+ QR scan to order conversion
- 20+ orders per restaurant per day
- 95%+ order accuracy
- 4+ star customer rating

---

## Next Steps After Launch

### Week 1-2
- Monitor system stability
- Fix any critical bugs
- Optimize performance
- Collect user feedback

### Month 1
- Add real-time notifications
- Implement order tracking
- Add basic analytics
- Scale to 5+ restaurants

### Month 2-3
- Add payment processing
- Multi-language support
- Advanced restaurant features
- Scale to 20+ restaurants

---

## Support & Maintenance

### Daily Tasks
- Monitor system performance
- Check error logs
- Respond to customer issues

### Weekly Tasks  
- Review analytics
- Update menu items
- Generate QR codes for new tables
- Restaurant onboarding

### Monthly Tasks
- Performance optimization
- Security updates
- Feature development
- Business analysis

---

## Cost Estimation

### Firebase Costs (Monthly)
- Cloud Functions: €5-20
- Firestore: €1-10  
- Authentication: €0-5
- **Total: €6-35/month**

### Hosting Costs (Monthly)
- Netlify/Vercel: €0-20
- Domain: €10-15
- **Total: €10-35/month**

### **Total Monthly Cost: €16-70**

This scales with usage and is very reasonable for a restaurant SaaS business.

---

Your system is now ready for production! The backend you have is actually more sophisticated than most MVP requirements, and with these deployments, you'll have a complete, working QR ordering platform.