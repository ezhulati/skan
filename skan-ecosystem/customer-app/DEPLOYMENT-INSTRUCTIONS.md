# SKAN Customer App - Deployment Instructions

## 🚨 URGENT: Deploy to order.skan.al to Fix Demo Experience

### Current Issue
The customer ordering demo at `https://order.skan.al/beach-bar-durres/a1` is showing a blank page, breaking the critical customer demo flow.

### Files Ready for Deployment
- ✅ Production build in `/build/` folder
- ✅ Netlify configuration in `netlify.toml`
- ✅ SPA redirects in `public/_redirects`
- ✅ Deployment package: `customer-app-deployment.tar.gz`

## Method 1: Manual Netlify Deployment (FASTEST)

1. **Extract Build Files**:
   ```bash
   cd skan-ecosystem/customer-app
   tar -xzf customer-app-deployment.tar.gz -C /tmp/customer-app-deploy
   ```

2. **Deploy to Netlify**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Deploy manually"
   - Drag the entire `/tmp/customer-app-deploy/` folder
   - Wait for deployment to complete

3. **Configure Custom Domain**:
   - In new site settings → Domain management
   - Add custom domain: `order.skan.al`
   - Update DNS to point to Netlify subdomain

## Method 2: Git-Based Continuous Deployment

1. **Create New Netlify Site from Git**:
   - Connect to your GitHub repository
   - **Base directory**: `skan-ecosystem/customer-app`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

2. **Configure Domain**: Same as Method 1

## Expected Result After Deployment

✅ `https://order.skan.al/beach-bar-durres/a1` will show:
- QR Landing page for Beach Bar Durrës, Table A1
- Venue information and table confirmation
- Auto-redirect to menu after 2.5 seconds
- Complete menu with 5 categories
- Full ordering functionality

## Complete Demo Flow (Post-Deployment)

1. **Lead Capture** → `skan.al/demo` ✅ Working
2. **Demo Request** → Form submission ✅ Working  
3. **Demo Credentials** → Provided to user ✅ Working
4. **Customer Ordering** → `order.skan.al/beach-bar-durres/a1` ❌ **WILL BE FIXED**
5. **Restaurant Dashboard** → `admin.skan.al` ✅ Working

## Business Impact

This deployment will:
- ✅ Complete the demo conversion funnel
- ✅ Allow prospects to experience the core product
- ✅ Increase demo-to-customer conversion rates
- ✅ Provide full working demo of QR ordering system

## Priority: URGENT

This is the only remaining blocker preventing the complete demo experience. All other components are working perfectly.

---

**Deployment Status**: Ready to deploy  
**Estimated Fix Time**: 15-30 minutes  
**Impact**: Critical - Fixes broken demo funnel