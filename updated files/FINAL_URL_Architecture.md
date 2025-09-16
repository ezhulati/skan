# SKAN.AL - FINAL URL ARCHITECTURE & SUBDOMAIN REFERENCE

## COMPLETE DOMAIN STRUCTURE

### 🏠 MAIN MARKETING SITE (Astro)
**Domain**: `skan.al`
**Purpose**: SEO, content marketing, lead generation, AI platform ranking
**Target**: Restaurant owners, potential customers, search engines

```
skan.al/                           # Homepage - value proposition
skan.al/features/                  # Product features & benefits
skan.al/pricing/                   # Pricing plans for restaurants
skan.al/demo/                      # Live demo/preview
skan.al/contact/                   # Contact & signup form
skan.al/about/                     # Company story
skan.al/terms/                     # Legal pages
skan.al/privacy/                   # Privacy policy

# SEO Content Hub
skan.al/blog/                      # Main blog index
skan.al/blog/restaurant-tech/      # Restaurant technology articles
skan.al/blog/qr-ordering/          # QR ordering guides
skan.al/blog/hospitality-trends/   # Industry trends
skan.al/blog/case-studies/         # Customer success stories
skan.al/blog/guides/              # How-to guides

# Local SEO Pages  
skan.al/albania/                   # Albania market page
skan.al/tirana/                    # Tirana restaurants
skan.al/durres/                    # Durrës restaurants  
skan.al/vlore/                     # Vlorë restaurants
skan.al/sarande/                   # Sarandë restaurants

# AI/Search Optimization
skan.al/help/                      # FAQ and help center
skan.al/integrations/              # POS integrations info
skan.al/api/                       # API documentation
skan.al/developers/                # Developer resources
```

### 📱 CUSTOMER ORDERING APP (React PWA)
**Domain**: `order.skan.al`
**Purpose**: Customer-facing QR ordering experience
**Target**: Restaurant customers scanning QR codes

```
order.skan.al/{venue-slug}/{table}     # QR landing → auto-redirect to menu
order.skan.al/{venue-slug}/{table}/menu # Menu browsing (primary page)
order.skan.al/{venue-slug}/{table}/cart # Shopping cart (contextual)
order.skan.al/{venue-slug}/{table}/order # Order confirmation
order.skan.al/track/{order-number}      # Order tracking (shareable)

# Error/Support Pages  
order.skan.al/help                      # Customer help
order.skan.al/offline                   # Offline fallback page
```

### 🏢 RESTAURANT ADMIN PORTAL (React SPA)
**Domain**: `admin.skan.al`
**Purpose**: Complete restaurant management (staff + owner functions)
**Target**: Restaurant staff, managers, owners

```
admin.skan.al/login                 # Universal authentication
admin.skan.al/orders                # Orders management (primary dashboard)
admin.skan.al/orders/active         # Active orders only
admin.skan.al/orders/history        # Order history
admin.skan.al/menu                  # Menu management
admin.skan.al/tables                # Table/QR management  
admin.skan.al/analytics             # Analytics (role-based views)
admin.skan.al/settings              # Restaurant settings
admin.skan.al/staff                 # Staff management (manager+ only)
admin.skan.al/billing               # Billing (owner only)
admin.skan.al/help                  # Help documentation
```

### 🔗 API & WEBHOOKS
**Domain**: `api.skan.al`
**Purpose**: Backend services and third-party integrations  
**Target**: Applications, integrations, developers

```
api.skan.al/v1/venues               # Venues API
api.skan.al/v1/orders               # Orders API  
api.skan.al/v1/auth                 # Authentication
api.skan.al/v1/analytics            # Analytics API
api.skan.al/webhooks/stripe         # Payment webhooks
api.skan.al/webhooks/pos            # POS integration webhooks
api.skan.al/health                  # Health checks
api.skan.al/docs                    # API documentation
```

---

## QR CODE URL STRATEGY

### Primary QR URLs (Customer Entry Points)
```
# Table-specific QR codes (auto-redirect to menu)
https://order.skan.al/beach-bar-durres/a1  → redirects to /beach-bar-durres/a1/menu
https://order.skan.al/beach-bar-durres/a2  → redirects to /beach-bar-durres/a2/menu
https://order.skan.al/kafe-tirana/t1       → redirects to /kafe-tirana/t1/menu

# Direct menu URLs (what customers actually see)
https://order.skan.al/beach-bar-durres/a1/menu
```

### QR Code Design Strategy
```
Primary:   order.skan.al/{venue-slug}/{table}
Direct:    order.skan.al/{venue-slug}/{table}/menu
Fallback:  skan.al/order/{venue-slug}/{table} → redirects to order subdomain
```

---

## USER JOURNEY FLOWS

### Restaurant Owner Discovery
```
Google Search → skan.al/blog/qr-ordering/ → skan.al/demo/ → 
skan.al/pricing/ → admin.skan.al/signup → admin.skan.al/onboarding
```

### Customer Ordering (Corrected Flow)
```
QR Code → order.skan.al/beach-bar-durres/a1 → auto-redirect to menu →
order.skan.al/beach-bar-durres/a1/menu → add items to cart →
order.skan.al/beach-bar-durres/a1/cart → submit order →
order.skan.al/beach-bar-durres/a1/order → track via order.skan.al/track/SKN-001
```

### Staff Workflow
```
skan.al/help/staff-training/ → admin.skan.al/login → 
admin.skan.al/orders → order management workflow
```

---

## TECHNICAL IMPLEMENTATION

### Astro Main Site (skan.al)
```typescript
// astro.config.mjs
export default defineConfig({
  integrations: [
    tailwind(),
    sitemap(),
    react({ 
      include: ['**/components/interactive/**'] 
    })
  ],
  site: 'https://skan.al',
  experimental: {
    contentCollections: true
  }
});
```

### React Subdomains
```
order.skan.al     → Netlify/Vercel (PWA optimized, contextual routing)
admin.skan.al     → Netlify/Vercel (Role-based access control)  
api.skan.al       → Firebase Functions (Custom domain)
```

### Cross-Domain Integration
```javascript
// Shared authentication across subdomains
// Cookie domain: .skan.al
// CORS origins: *.skan.al

// Contextual state management
// order.skan.al maintains venue/table context throughout session
// admin.skan.al role-based feature access
```

---

## SEO CONTENT STRATEGY

### Content Hubs for Ranking
```
# Industry Content
skan.al/blog/restaurant-technology/
skan.al/blog/qr-menu-systems/
skan.al/blog/contactless-ordering/
skan.al/blog/restaurant-efficiency/

# Local SEO
skan.al/blog/albania-restaurants/
skan.al/blog/tirana-dining/
skan.al/blog/durres-beach-bars/
skan.al/blog/tourism-hospitality-albania/

# Solution Content  
skan.al/blog/how-to-implement-qr-ordering/
skan.al/blog/restaurant-digital-transformation/
skan.al/blog/reducing-wait-times/
skan.al/blog/increasing-table-turnover/

# Case Studies
skan.al/blog/case-study-beach-bar-durres/
skan.al/blog/case-study-restaurant-tirana/
```

### AI Platform Optimization
```
# Structured data for AI platforms
skan.al/solutions/qr-ordering/       # ChatGPT/Claude searchable
skan.al/solutions/restaurant-tech/   # AI recommendation content
skan.al/comparisons/vs-competitors/  # Competitive analysis
skan.al/guides/getting-started/      # Implementation guides
```

---

## ENVIRONMENT CONFIGURATION

### Production Environment Variables
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

### DNS Configuration
```
# Main domain
skan.al                 A record → Netlify/Vercel IP

# Subdomains
order.skan.al          CNAME → Netlify/Vercel
admin.skan.al          CNAME → Netlify/Vercel
api.skan.al            CNAME → Firebase custom domain

# SSL/TLS
All domains configured with automatic SSL certificates
```

---

## COMPETITIVE ADVANTAGES

### Content-Driven Customer Acquisition
```
1. Rank for "QR ordering Albania" → Drive restaurant owner traffic
2. Rank for "Beach Bar Durrës menu" → Drive customer familiarity  
3. Rank for "restaurant technology" → Build industry authority
4. AI platform visibility → ChatGPT/Claude recommendations
```

### Technical Architecture Benefits
```
✅ Fast Astro marketing site (perfect Lighthouse scores)
✅ Optimized React apps for functionality 
✅ Clean URL structure for SEO
✅ Subdomain isolation for performance
✅ Content-first customer acquisition
✅ AI platform discoverability
✅ Contextual user experience (no context loss)
✅ Role-based access control
✅ Scalable microservice architecture
```

---

## EXAMPLE URLS IN PRODUCTION

### Customer Journey
```
QR Code:     order.skan.al/beach-bar-durres/a1
Menu:        order.skan.al/beach-bar-durres/a1/menu
Cart:        order.skan.al/beach-bar-durres/a1/cart
Order:       order.skan.al/beach-bar-durres/a1/order
Tracking:    order.skan.al/track/SKN-20250915-001
```

### Restaurant Journey
```
Login:       admin.skan.al/login
Dashboard:   admin.skan.al/orders
Active:      admin.skan.al/orders/active
Menu:        admin.skan.al/menu
Tables:      admin.skan.al/tables
Analytics:   admin.skan.al/analytics
```

### Marketing & SEO
```
Homepage:    skan.al/
Features:    skan.al/features/
Pricing:     skan.al/pricing/
Blog:        skan.al/blog/
Case Study:  skan.al/blog/case-study-beach-bar-durres/
Local SEO:   skan.al/durres/
```

### API Endpoints
```
Menu:        api.skan.al/v1/venue/beach-bar-durres/menu
Orders:      api.skan.al/v1/orders
Status:      api.skan.al/v1/orders/123/status
Auth:        api.skan.al/v1/auth/login
Health:      api.skan.al/health
```

This architecture positions skan.al as both a technical solution AND a content authority in the Albanian restaurant technology space, driving organic growth through SEO while delivering world-class functionality through optimized subdomains.