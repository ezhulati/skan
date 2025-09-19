# FAILURE FIX REQUIREMENTS
## SKAN.AL QR Restaurant Ordering System

**Document Version**: 1.0  
**Created**: January 17, 2025  
**Priority**: CRITICAL - Production Blocking Issues  
**Status**: Ready for Development  

---

## EXECUTIVE SUMMARY

This document provides detailed development requirements to fix all identified failures from the comprehensive test execution report. The failures have been categorized by priority and impact, with specific technical requirements for each fix.

### Critical Failures Identified
1. **🔴 User Management API Failure** (Priority: CRITICAL)
2. **⚠️ Order Management Security Warning** (Priority: MEDIUM)  
3. **🔍 Incomplete Security Testing** (Priority: HIGH)
4. **📱 Missing Accessibility & Browser Testing** (Priority: MEDIUM)
5. **👑 System Admin Testing Gap** (Priority: LOW)

---

## 🔴 CRITICAL PRIORITY: USER MANAGEMENT API FAILURE

### Issue Summary
**Test Failed**: Restaurant Staff/Manager Flows - User Management Test  
**Error**: HTTP 500 Internal Server Error at `/v1/users/invite` endpoint  
**Impact**: HIGH - Restaurant owners cannot invite staff members  
**Blocking**: Complete staff management functionality  

### Root Cause Analysis Required
**Immediate Investigation Tasks**:
1. Check Firebase Functions logs for `/v1/users/invite` endpoint errors
2. Verify Firestore security rules for user creation operations
3. Validate email service configuration for invitation emails
4. Test user invitation data validation and sanitization

### Technical Requirements for Fix

#### R1.1: Server-Side Error Investigation
```bash
# Required Actions:
1. Access Firebase Console → Functions → Logs
2. Filter logs for user invitation endpoint errors
3. Identify specific error stack trace
4. Document exact failure point in code
```

#### R1.2: User Invitation Endpoint Fix
**File**: `skan-ecosystem/functions/src/routes/users.js` (or equivalent)  
**Requirements**:
- Fix HTTP 500 error in POST `/v1/users/invite` endpoint
- Implement proper error handling with descriptive error messages
- Add input validation for invitation data
- Ensure proper Firestore transaction handling

**Code Structure Expected**:
```javascript
// User invitation endpoint requirements
app.post('/users/invite', authenticateToken, async (req, res) => {
  try {
    // Input validation
    const { email, fullName, role } = req.body;
    if (!email || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Email validation
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Role validation
    if (!['staff', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Generate invitation token
    const inviteToken = generateSecureToken();
    
    // Create invitation record in Firestore
    const invitationData = {
      email,
      fullName,
      role,
      inviteToken,
      invitedBy: req.user.uid,
      venueId: req.user.venueId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending'
    };
    
    const invitationRef = await admin.firestore()
      .collection('invitations')
      .add(invitationData);
    
    // Send invitation email (implement email service)
    await sendInvitationEmail(email, fullName, inviteToken);
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitationId: invitationRef.id,
      inviteToken: process.env.NODE_ENV === 'development' ? inviteToken : undefined
    });
    
  } catch (error) {
    console.error('User invitation error:', error);
    res.status(500).json({ 
      error: 'Failed to create invitation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

#### R1.3: Accept Invitation Endpoint
**File**: `skan-ecosystem/functions/src/routes/auth.js` (or equivalent)  
**Requirements**:
- Implement POST `/v1/auth/accept-invitation` endpoint
- Validate invitation token and expiration
- Create user account from invitation data
- Hash password securely using scrypt
- Remove used invitation record

**Code Structure Expected**:
```javascript
app.post('/auth/accept-invitation', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Validate input
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password required' });
    }
    
    // Find invitation by token
    const invitationQuery = await admin.firestore()
      .collection('invitations')
      .where('inviteToken', '==', token)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (invitationQuery.empty) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }
    
    const invitationDoc = invitationQuery.docs[0];
    const invitationData = invitationDoc.data();
    
    // Check expiration
    if (invitationData.expiresAt.toDate() < new Date()) {
      return res.status(410).json({ error: 'Invitation has expired' });
    }
    
    // Hash password using scrypt
    const passwordHash = await hashPassword(password);
    
    // Create user account
    const userData = {
      email: invitationData.email,
      fullName: invitationData.fullName,
      role: invitationData.role,
      venueId: invitationData.venueId,
      passwordHash,
      isActive: true,
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const userRef = await admin.firestore()
      .collection('users')
      .add(userData);
    
    // Mark invitation as used
    await invitationDoc.ref.update({
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userRef.id
    });
    
    // Generate JWT token for immediate login
    const token = generateJWT({
      uid: userRef.id,
      email: userData.email,
      role: userData.role,
      venueId: userData.venueId
    });
    
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: userRef.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId
      },
      token
    });
    
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});
```

#### R1.4: User Management CRUD Operations
**Requirements**:
- Fix GET `/v1/users` endpoint for user listing
- Fix GET `/v1/users/:userId` for individual user details
- Fix PUT `/v1/users/:userId` for user updates
- Implement proper role-based access control

#### R1.5: Email Service Integration
**Requirements**:
- Set up email service for invitation emails (SendGrid, Mailgun, or SMTP)
- Create email templates for user invitations
- Handle email delivery failures gracefully
- Add email configuration to environment variables

#### R1.6: Firestore Security Rules Update
**File**: `firestore.rules`  
**Requirements**:
```javascript
// Add rules for invitations collection
match /invitations/{invitationId} {
  allow read, write: if request.auth != null 
    && (request.auth.token.role == 'manager' || request.auth.token.role == 'admin')
    && request.auth.token.venueId == invitation.venueId;
}

// Update users collection rules
match /users/{userId} {
  allow read: if request.auth != null 
    && (request.auth.uid == userId || 
        request.auth.token.role in ['manager', 'admin']);
  allow write: if request.auth != null 
    && request.auth.token.role in ['manager', 'admin'];
}
```

### Testing Requirements for Fix
1. Create automated test for user invitation flow
2. Test invitation email delivery
3. Test invitation acceptance with password creation
4. Test role-based access control for user management
5. Verify invitation expiration handling

---

## ⚠️ MEDIUM PRIORITY: ORDER MANAGEMENT SECURITY

### Issue Summary
**Test Warning**: Order deletion endpoint accepts invalid status values  
**Impact**: MEDIUM - Potential data integrity issues  
**Security Risk**: LOW - Input validation weakness  

### Technical Requirements for Fix

#### R2.1: Order Status Validation
**File**: `skan-ecosystem/functions/src/routes/orders.js`  
**Requirements**:
- Add strict validation for order status values
- Implement status transition validation (logical progression)
- Return proper error responses for invalid status values

**Code Structure Expected**:
```javascript
const VALID_ORDER_STATUSES = ['new', 'preparing', 'ready', 'served'];
const VALID_STATUS_TRANSITIONS = {
  'new': ['preparing', 'served'], // Can skip to served for immediate orders
  'preparing': ['ready', 'served'],
  'ready': ['served'],
  'served': [] // Final state
};

app.put('/orders/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status value
    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validStatuses: VALID_ORDER_STATUSES
      });
    }
    
    // Get current order
    const orderDoc = await admin.firestore()
      .collection('orders')
      .doc(req.params.orderId)
      .get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const currentOrder = orderDoc.data();
    const currentStatus = currentOrder.status;
    
    // Validate status transition
    if (!VALID_STATUS_TRANSITIONS[currentStatus].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status transition',
        currentStatus,
        attemptedStatus: status,
        validTransitions: VALID_STATUS_TRANSITIONS[currentStatus]
      });
    }
    
    // Update order with timestamp tracking
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add specific timestamp fields
    switch (status) {
      case 'preparing':
        updateData.preparedAt = admin.firestore.FieldValue.serverTimestamp();
        break;
      case 'ready':
        updateData.readyAt = admin.firestore.FieldValue.serverTimestamp();
        break;
      case 'served':
        updateData.servedAt = admin.firestore.FieldValue.serverTimestamp();
        break;
    }
    
    await orderDoc.ref.update(updateData);
    
    res.json({
      message: 'Order status updated successfully',
      orderId: req.params.orderId,
      status,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});
```

---

## 🔍 HIGH PRIORITY: COMPLETE SECURITY TESTING

### Issue Summary
**Test Incomplete**: Security testing was rate-limited  
**Impact**: HIGH - Security validation incomplete  
**Risk**: Unknown security vulnerabilities may exist  

### Technical Requirements for Comprehensive Security Testing

#### R3.1: Rate Limiting Strategy for Testing
**Requirements**:
- Implement test-friendly rate limiting bypass for automated testing
- Create dedicated test API key or environment
- Document rate limiting thresholds and reset periods

#### R3.2: Complete Security Test Suite Implementation
**File**: `skan-ecosystem/e2e-tests/test-security-comprehensive.cjs`  
**Requirements**:

```javascript
// Complete security test requirements
const securityTests = [
  // Authentication Tests
  { name: 'Invalid credentials rejected', endpoint: '/auth/login' },
  { name: 'Expired tokens rejected', endpoint: '/users' },
  { name: 'Malformed tokens rejected', endpoint: '/users' },
  { name: 'Missing authentication headers', endpoint: '/orders' },
  
  // Authorization Tests  
  { name: 'Role-based access control', endpoint: '/users' },
  { name: 'Cross-venue data access prevention', endpoint: '/venue/*/orders' },
  { name: 'Staff user restrictions', endpoint: '/users/invite' },
  
  // Input Validation Tests
  { name: 'SQL injection protection', endpoint: '/auth/login' },
  { name: 'XSS prevention in form inputs', endpoint: '/orders' },
  { name: 'Command injection prevention', endpoint: '/venue/*/menu' },
  { name: 'Path traversal prevention', endpoint: '/users/*' },
  
  // Data Protection Tests
  { name: 'Password hashing verification', endpoint: '/auth/register' },
  { name: 'Sensitive data exposure check', endpoint: '/users' },
  { name: 'Token payload security', endpoint: '/auth/login' },
  
  // CORS and Headers Tests
  { name: 'CORS configuration validation', endpoint: '/venue/*/menu' },
  { name: 'Security headers presence', endpoint: '/*' },
  { name: 'Content-Type validation', endpoint: '/orders' }
];
```

#### R3.3: JWT Token Security Validation
**Requirements**:
- Verify JWT signing algorithm (HS256 or better)
- Test token expiration enforcement
- Validate token payload doesn't contain sensitive data
- Test token revocation mechanisms

#### R3.4: API Rate Limiting Configuration
**File**: `skan-ecosystem/functions/src/middleware/rateLimiting.js`  
**Requirements**:
- Document current rate limiting configuration
- Implement different limits for different endpoint types
- Add rate limiting bypass for testing environments
- Create monitoring for rate limiting events

---

## 📱 MEDIUM PRIORITY: ACCESSIBILITY & BROWSER COMPATIBILITY

### Issue Summary
**Test Missing**: Accessibility and browser compatibility not tested  
**Impact**: MEDIUM - User experience and compliance risk  
**Standards**: WCAG 2.1 AA compliance required  

### Technical Requirements for Accessibility Testing

#### R4.1: WCAG 2.1 AA Compliance Testing
**File**: `skan-ecosystem/e2e-tests/test-accessibility.spec.ts`  
**Requirements**:
- Implement automated accessibility testing using @axe-core/playwright
- Test all major user flows for accessibility compliance
- Validate keyboard navigation on all interactive elements
- Check color contrast ratios (minimum 4.5:1)

**Code Structure Expected**:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing', () => {
  test('Customer ordering flow accessibility', async ({ page }) => {
    await page.goto('https://order.skan.al/beach-bar-durres/a1');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Admin portal accessibility', async ({ page }) => {
    // Login flow
    await page.goto('https://admin.skan.al/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Keyboard navigation', async ({ page }) => {
    await page.goto('https://order.skan.al/beach-bar-durres/menu');
    
    // Test tab navigation through all interactive elements
    await page.keyboard.press('Tab');
    // ... validate focus indicators and keyboard accessibility
  });
});
```

#### R4.2: Cross-Browser Compatibility Testing
**File**: `skan-ecosystem/e2e-tests/test-browser-compatibility.spec.ts`  
**Requirements**:
- Test on Chrome, Firefox, Safari, Edge (latest versions)
- Test on mobile Safari and Chrome mobile
- Validate PWA functionality on mobile devices
- Test critical user flows on each browser

#### R4.3: Screen Reader Compatibility
**Requirements**:
- Test with screen reader simulation
- Validate proper ARIA labels and roles
- Ensure semantic HTML structure
- Test form labels and error announcements

---

## 👑 LOW PRIORITY: SYSTEM ADMIN TESTING

### Issue Summary
**Test Missing**: System Admin user type not tested  
**Impact**: LOW - Advanced admin features not validated  
**Scope**: Multi-venue management, system-wide operations  

### Technical Requirements for Admin Testing

#### R5.1: System Admin Test Account Creation
**Requirements**:
- Create test system admin account with elevated privileges
- Document admin-specific endpoints and permissions
- Test multi-venue access and management capabilities

#### R5.2: Admin-Specific Functionality Testing
**File**: `skan-ecosystem/e2e-tests/test-system-admin-flows.cjs`  
**Requirements**:
```javascript
// System admin test scenarios
const adminTests = [
  { name: 'Multi-venue dashboard access', endpoint: '/admin/venues' },
  { name: 'System-wide user management', endpoint: '/admin/users' },
  { name: 'Global analytics and reporting', endpoint: '/admin/analytics' },
  { name: 'System configuration management', endpoint: '/admin/config' },
  { name: 'Venue creation and approval', endpoint: '/admin/venues/create' }
];
```

---

## IMPLEMENTATION TIMELINE

### Phase 1: Critical Fixes (Week 1)
1. **Day 1-2**: User Management API Investigation and Fix
2. **Day 3-4**: User Invitation Flow Implementation  
3. **Day 5**: Testing and Validation

### Phase 2: Security and Validation (Week 2)
1. **Day 1-2**: Order Management Security Improvements
2. **Day 3-4**: Complete Security Testing Implementation
3. **Day 5**: Security Validation and Documentation

### Phase 3: Quality Assurance (Week 3)
1. **Day 1-3**: Accessibility and Browser Compatibility Testing
2. **Day 4**: System Admin Testing Implementation
3. **Day 5**: Final Integration Testing

---

## ACCEPTANCE CRITERIA

### User Management Fix (Critical)
- [ ] User invitation endpoint returns 201 status for valid requests
- [ ] Invitation emails are sent successfully
- [ ] Users can accept invitations and create accounts
- [ ] Role-based permissions work correctly
- [ ] All user management CRUD operations functional

### Security Improvements (High)
- [ ] Order status validation prevents invalid transitions
- [ ] Complete security test suite passes 100%
- [ ] JWT token security validated
- [ ] Rate limiting properly configured

### Quality Assurance (Medium)
- [ ] WCAG 2.1 AA compliance achieved
- [ ] Cross-browser compatibility confirmed
- [ ] PWA functionality working on mobile
- [ ] System admin flows validated

---

## SUCCESS METRICS

1. **Test Pass Rate**: 95%+ (up from current 75%)
2. **User Management**: 100% functional (up from 40%)
3. **Security Coverage**: 100% (up from 70%)
4. **Accessibility Score**: 90+ on Lighthouse
5. **Browser Compatibility**: 100% on targeted browsers

---

**Document Owner**: Development Team  
**Review Required**: After each phase completion  
**Testing Required**: Comprehensive re-test after all fixes  
**Production Readiness**: Blocked until Phase 1 completion