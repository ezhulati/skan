# SKAN.AL TEST PLAN - CLEAR PASS/FAIL CRITERIA

## Overview

This document provides **explicit pass/fail criteria** for every test case in the SKAN.AL comprehensive test plan. Each test has binary success/failure conditions with measurable metrics.

---

## CUSTOMER TESTS (order.skan.al)

### Test Case 1.A.1: QR Landing Page

**PASS Criteria:**
- ✅ Page loads completely within 3 seconds
- ✅ Venue name displays correctly (matches venue slug)
- ✅ Table number displays correctly (matches URL parameter)
- ✅ Language picker is visible and functional
- ✅ Auto-redirect occurs within 3-5 seconds OR manual navigation button works
- ✅ No JavaScript errors in console
- ✅ Mobile responsive design works (tested on 320px width)

**FAIL Criteria:**
- ❌ Page load time exceeds 3 seconds
- ❌ Venue name is missing or incorrect
- ❌ Table number is missing or incorrect
- ❌ Language picker is not visible or non-functional
- ❌ Auto-redirect fails AND manual navigation button doesn't work
- ❌ JavaScript errors present in console
- ❌ Layout breaks on mobile devices

### Test Case 1.A.2: Menu Browsing

**PASS Criteria:**
- ✅ Menu loads within 2 seconds
- ✅ All menu categories display (minimum 3 categories expected)
- ✅ All menu items have valid prices (> €0.00)
- ✅ Albanian/English translations present for 95%+ of items
- ✅ Add to cart functionality works for all items
- ✅ Cart counter updates accurately when items added
- ✅ Item quantity can be modified (1-10 range)
- ✅ Items can be removed from cart successfully
- ✅ Running total calculation is mathematically correct

**FAIL Criteria:**
- ❌ Menu load time exceeds 2 seconds
- ❌ Less than 3 menu categories display
- ❌ Any menu item has price ≤ €0.00 or missing price
- ❌ Translation coverage below 95%
- ❌ Add to cart fails for any item
- ❌ Cart counter shows incorrect count
- ❌ Quantity modification fails or allows invalid values
- ❌ Item removal fails
- ❌ Total calculation is mathematically incorrect (±€0.01 tolerance)

### Test Case 1.A.3: Cart Management

**PASS Criteria:**
- ✅ All cart items display with correct names and prices
- ✅ Quantity modification works (1-10 range)
- ✅ Item removal works without errors
- ✅ Total recalculation is accurate within €0.01
- ✅ Special instructions field accepts text (max 500 characters)
- ✅ Customer name field accepts text (max 100 characters)
- ✅ "Continue Shopping" returns to menu
- ✅ "Proceed to Checkout" advances to confirmation

**FAIL Criteria:**
- ❌ Any cart item displays incorrect information
- ❌ Quantity modification fails or accepts invalid values
- ❌ Item removal fails or causes errors
- ❌ Total calculation error exceeds €0.01
- ❌ Special instructions field rejects valid text or exceeds character limit
- ❌ Customer name field rejects valid text or exceeds character limit
- ❌ Navigation buttons don't work as expected

### Test Case 1.A.4: Order Confirmation

**PASS Criteria:**
- ✅ Order summary displays all items correctly
- ✅ Total amount is mathematically correct
- ✅ Customer information displays as entered
- ✅ Order submission succeeds (returns 200/201 status)
- ✅ Order number generated in format SKN-YYYYMMDD-###
- ✅ Estimated time provided (5-30 minutes range)
- ✅ Navigation to tracking page works
- ✅ Order appears in restaurant dashboard within 30 seconds

**FAIL Criteria:**
- ❌ Order summary missing or incorrect items
- ❌ Total amount calculation error exceeds €0.01
- ❌ Customer information incorrect or missing
- ❌ Order submission fails (non-2xx status code)
- ❌ Order number doesn't match expected format
- ❌ Estimated time missing or outside 5-30 minute range
- ❌ Navigation to tracking fails
- ❌ Order doesn't appear in restaurant dashboard within 30 seconds

### Test Case 1.A.5: Order Tracking

**PASS Criteria:**
- ✅ Order status displays correctly ("new", "preparing", "ready", "served")
- ✅ Status updates within 5 seconds of restaurant changes
- ✅ Order details match original order exactly
- ✅ Estimated time updates appropriately
- ✅ Page refreshes/polls for updates every 10-30 seconds
- ✅ Status progression follows logical order

**FAIL Criteria:**
- ❌ Order status missing or incorrect
- ❌ Status updates take longer than 5 seconds
- ❌ Order details don't match original order
- ❌ Estimated time doesn't update or becomes unrealistic
- ❌ Page doesn't refresh for updates
- ❌ Status progression is illogical (e.g., served → preparing)

### Test Case 1.B.1: Public Order Tracking

**PASS Criteria:**
- ✅ Valid order number returns correct order data
- ✅ Invalid order number returns appropriate error (404)
- ✅ Order status displays correctly
- ✅ No sensitive customer data exposed
- ✅ Response time under 1 second

**FAIL Criteria:**
- ❌ Valid order number fails to return data
- ❌ Invalid order number doesn't return 404 error
- ❌ Order status missing or incorrect
- ❌ Sensitive data (customer details, full address) exposed
- ❌ Response time exceeds 1 second

---

## RESTAURANT OWNER TESTS (admin.skan.al)

### Test Case 2.A.1: Account Creation

**PASS Criteria:**
- ✅ Registration form accepts all required fields
- ✅ Email validation prevents invalid formats
- ✅ Password validation enforces complexity (8+ chars, mixed case, numbers)
- ✅ Account creation returns success status (200/201)
- ✅ User receives confirmation email within 5 minutes
- ✅ Automatic login works after registration
- ✅ User redirected to onboarding page

**FAIL Criteria:**
- ❌ Registration form rejects valid input
- ❌ Invalid email formats accepted
- ❌ Weak passwords accepted
- ❌ Account creation fails with valid data
- ❌ Confirmation email not received within 5 minutes
- ❌ Automatic login fails
- ❌ User not redirected to onboarding

### Test Case 2.B.1: Onboarding Wizard

**PASS Criteria:**
- ✅ All 6 onboarding steps complete successfully
- ✅ Venue configuration saves all required fields
- ✅ At least 3 menu categories created
- ✅ At least 5 menu items created with prices
- ✅ Minimum 5 table QR codes generated
- ✅ At least 1 staff invitation sent successfully
- ✅ Test order creation and receipt works
- ✅ Onboarding marked as complete in database
- ✅ User redirected to main dashboard

**FAIL Criteria:**
- ❌ Any onboarding step fails to complete
- ❌ Venue configuration missing required fields
- ❌ Less than 3 menu categories created
- ❌ Less than 5 menu items or items missing prices
- ❌ Less than 5 QR codes generated
- ❌ Staff invitation fails to send
- ❌ Test order creation fails
- ❌ Onboarding not marked complete
- ❌ User not redirected to dashboard

### Test Case 2.C.1: Dashboard Overview

**PASS Criteria:**
- ✅ Dashboard loads within 3 seconds
- ✅ Real-time order count is accurate (±0 tolerance)
- ✅ Revenue calculations are mathematically correct (±€0.01)
- ✅ Order notifications appear within 10 seconds of placement
- ✅ Quick action buttons work (all tested)
- ✅ Auto-refresh occurs every 30 seconds

**FAIL Criteria:**
- ❌ Dashboard load time exceeds 3 seconds
- ❌ Order count is inaccurate
- ❌ Revenue calculations have errors exceeding €0.01
- ❌ Order notifications delayed beyond 10 seconds
- ❌ Any quick action button fails
- ❌ Auto-refresh fails or occurs outside 30-60 second range

### Test Case 2.C.2: Order Management

**PASS Criteria:**
- ✅ New orders appear within 10 seconds of placement
- ✅ Status updates save successfully (200 response)
- ✅ Status changes reflect in customer app within 5 seconds
- ✅ Order filtering returns accurate results
- ✅ Search functionality works with table numbers and customer names
- ✅ Order details display complete information
- ✅ Special instructions clearly visible

**FAIL Criteria:**
- ❌ New orders delayed beyond 10 seconds
- ❌ Status updates fail or return errors
- ❌ Status changes don't reflect in customer app within 5 seconds
- ❌ Order filtering returns incorrect results
- ❌ Search functionality fails or returns wrong results
- ❌ Order details missing or incorrect
- ❌ Special instructions not visible or truncated

---

## API TESTS

### Test Case 12.1.1: User Login (POST /v1/auth/login)

**PASS Criteria:**
- ✅ Valid credentials return 200 status
- ✅ Response includes valid JWT token
- ✅ Token contains required fields (uid, role, venueId)
- ✅ User object includes all expected fields
- ✅ Invalid credentials return 401 status
- ✅ Missing fields return 400 status
- ✅ Response time under 500ms

**FAIL Criteria:**
- ❌ Valid credentials don't return 200 status
- ❌ Response missing JWT token or token invalid
- ❌ Token missing required fields
- ❌ User object incomplete or missing
- ❌ Invalid credentials don't return 401
- ❌ Missing fields don't return 400
- ❌ Response time exceeds 500ms

### Test Case 12.1.2: Create Order (POST /v1/orders)

**PASS Criteria:**
- ✅ Valid order data returns 201 status
- ✅ Response includes order ID and order number
- ✅ Order number follows SKN-YYYYMMDD-### format
- ✅ Total calculation is mathematically correct
- ✅ Order appears in venue orders within 5 seconds
- ✅ Missing required fields return 400 status
- ✅ Invalid venue ID returns 404 status

**FAIL Criteria:**
- ❌ Valid order data doesn't return 201 status
- ❌ Response missing order ID or order number
- ❌ Order number doesn't match expected format
- ❌ Total calculation incorrect (±€0.01 tolerance)
- ❌ Order doesn't appear in venue orders within 5 seconds
- ❌ Missing fields don't return 400 status
- ❌ Invalid venue ID doesn't return 404 status

---

## PERFORMANCE TESTS

### Test Case 8.1.1: API Response Times

**PASS Criteria:**
- ✅ 95% of requests complete under 500ms
- ✅ 99% of requests complete under 1000ms
- ✅ Zero failed requests under normal load (10 concurrent users)
- ✅ Error rate under 1% at 100 concurrent users
- ✅ System remains responsive at 500 concurrent users

**FAIL Criteria:**
- ❌ More than 5% of requests exceed 500ms
- ❌ More than 1% of requests exceed 1000ms
- ❌ Any failed requests under normal load
- ❌ Error rate exceeds 1% at 100 concurrent users
- ❌ System becomes unresponsive at 500 concurrent users

### Test Case 8.1.2: Page Load Performance

**PASS Criteria:**
- ✅ Customer app loads under 3 seconds (mobile 3G)
- ✅ Admin portal loads under 5 seconds (desktop)
- ✅ Marketing site loads under 2 seconds (desktop)
- ✅ Lighthouse Performance score ≥ 90
- ✅ Lighthouse Accessibility score ≥ 90
- ✅ Lighthouse Best Practices score ≥ 90
- ✅ Lighthouse SEO score ≥ 90

**FAIL Criteria:**
- ❌ Customer app exceeds 3 seconds on mobile 3G
- ❌ Admin portal exceeds 5 seconds on desktop
- ❌ Marketing site exceeds 2 seconds on desktop
- ❌ Any Lighthouse score below 90

---

## SECURITY TESTS

### Test Case 9.1.1: JWT Token Security

**PASS Criteria:**
- ✅ Tokens use secure signing algorithm (HS256 or better)
- ✅ Expired tokens return 401 status
- ✅ Invalid signatures return 401 status
- ✅ Tampered tokens return 401 status
- ✅ Token payload doesn't contain sensitive data
- ✅ Token expiration time is reasonable (≤ 24 hours)

**FAIL Criteria:**
- ❌ Tokens use weak or no signing
- ❌ Expired tokens accepted
- ❌ Invalid signatures accepted
- ❌ Tampered tokens accepted
- ❌ Token payload contains passwords or sensitive data
- ❌ Token expiration exceeds 24 hours

### Test Case 9.1.2: Role-Based Access Control

**PASS Criteria:**
- ✅ Staff users cannot access manager endpoints (403 status)
- ✅ Manager users cannot access admin endpoints (403 status)
- ✅ Users cannot access other venues' data (403 status)
- ✅ Unauthenticated requests return 401 status
- ✅ Role changes reflected immediately

**FAIL Criteria:**
- ❌ Staff users can access manager endpoints
- ❌ Manager users can access admin endpoints
- ❌ Cross-venue data access allowed
- ❌ Unauthenticated requests succeed
- ❌ Role changes not enforced immediately

---

## ACCESSIBILITY TESTS

### Test Case 10.1.1: WCAG Compliance

**PASS Criteria:**
- ✅ All text has contrast ratio ≥ 4.5:1 (AA standard)
- ✅ All interactive elements accessible via keyboard
- ✅ All images have alt text
- ✅ All forms have proper labels
- ✅ Screen reader can navigate entire application
- ✅ Focus indicators visible on all interactive elements
- ✅ No information conveyed by color alone

**FAIL Criteria:**
- ❌ Any text below 4.5:1 contrast ratio
- ❌ Any interactive element not keyboard accessible
- ❌ Any image missing alt text
- ❌ Any form missing proper labels
- ❌ Screen reader cannot navigate any section
- ❌ Focus indicators missing or unclear
- ❌ Information conveyed only by color

---

## BROWSER COMPATIBILITY TESTS

### Test Case 11.1.1: Cross-Browser Functionality

**PASS Criteria:**
- ✅ All core features work in Chrome (latest version)
- ✅ All core features work in Safari (latest version)
- ✅ All core features work in Firefox (latest version)
- ✅ All core features work in Edge (latest version)
- ✅ Mobile Safari supports PWA installation
- ✅ No JavaScript errors in any browser

**FAIL Criteria:**
- ❌ Any core feature fails in any supported browser
- ❌ PWA installation fails on Mobile Safari
- ❌ JavaScript errors present in any browser

---

## INTEGRATION TESTS

### Test Case 7.1: QR Code Flow Integration

**PASS Criteria:**
- ✅ QR code generated in admin portal works in customer app
- ✅ Order placed in customer app appears in admin dashboard within 10 seconds
- ✅ Status update in admin reflects in customer app within 5 seconds
- ✅ Cross-domain authentication works seamlessly
- ✅ Data consistency maintained across all applications

**FAIL Criteria:**
- ❌ QR code doesn't work or leads to wrong page
- ❌ Order doesn't appear in admin dashboard within 10 seconds
- ❌ Status updates don't sync within 5 seconds
- ❌ Cross-domain authentication fails
- ❌ Data inconsistency between applications

---

## AUTOMATED TEST EXECUTION CRITERIA

### Test Suite Pass/Fail Thresholds

**OVERALL PASS Criteria:**
- ✅ ≥ 95% of all test cases pass
- ✅ Zero critical failures (security, data loss, authentication)
- ✅ All P0 (critical path) tests pass
- ✅ Performance benchmarks met
- ✅ No regression in previously passing tests

**OVERALL FAIL Criteria:**
- ❌ < 95% test pass rate
- ❌ Any critical failures present
- ❌ Any P0 test failures
- ❌ Performance benchmarks not met
- ❌ Regression detected in critical features

### Test Execution Metrics

**Success Metrics:**
- **Pass Rate**: 95%+ required for production deployment
- **Execution Time**: Complete suite under 10 minutes
- **Test Coverage**: 100% of identified user flows
- **Performance**: All benchmarks met
- **Security**: Zero critical vulnerabilities

**Failure Indicators:**
- **Pass Rate**: Below 95%
- **Execution Time**: Exceeds 15 minutes
- **Test Coverage**: Missing any critical user flow
- **Performance**: Any benchmark missed
- **Security**: Any critical vulnerability found

---

## REPORTING CRITERIA

### Test Report Requirements

**PASS Report Must Include:**
- ✅ Executive summary with overall pass/fail status
- ✅ Detailed pass/fail breakdown by test category
- ✅ Performance metrics vs. targets
- ✅ Test execution times and coverage
- ✅ Environment information and test data used
- ✅ Any minor issues or warnings with mitigation plans

**FAIL Report Must Include:**
- ❌ Clear identification of all failing tests
- ❌ Root cause analysis for each failure
- ❌ Impact assessment (high/medium/low)
- ❌ Recommended remediation steps
- ❌ Retest strategy and timeline
- ❌ Risk assessment for deployment

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Total Pass/Fail Criteria**: 100+ explicit criteria
**Coverage**: Every test case has clear binary success/failure conditions