# SKAN.AL Marketplace Payment Flow with Verifone

## Account Structure

### Master Platform Account (SKAN.AL)
- **Verifone Marketplace Account**: One master account for entire platform
- **Merchant of Record**: SKAN.AL is the legal merchant for all transactions
- **Commission Collection**: Automatic percentage deduction from each order
- **Payout Distribution**: Handles payments to all restaurants

### Restaurant Sub-Accounts (Venues)
- **No full Verifone account needed**: Restaurants just provide bank details
- **KYC Verification**: Basic business verification through SKAN.AL
- **Payout Recipients**: Receive money directly to their bank accounts
- **Dashboard Access**: View their earnings through SKAN.AL admin portal

## Payment Flow Scenarios

### Scenario 1: Digital Plan (Commission-Based)

#### Step 1: Customer Orders
```
Customer scans QR → Order €20 → Payment via Verifone
```

#### Step 2: Verifone Processing
```
Verifone collects €20 → Deducts 3% fee (€0.60) → Net: €19.40
```

#### Step 3: SKAN.AL Split Logic
```
€19.40 available → Auto-split by SKAN.AL:
├── Platform commission (2.9%): €0.58
├── Restaurant payout: €18.82
└── Transfer timeline: 2-7 days to restaurant bank
```

### Scenario 2: Premium Plan (Subscription-Based)

#### Monthly Subscription
```
Restaurant pays €35/month → Verifone → SKAN.AL account
```

#### Customer Orders
```
Customer orders €20 → Pays cash → Restaurant keeps 100%
```

## Technical Implementation

### 1. Verifone Marketplace Setup
```javascript
// Master platform configuration
const platformConfig = {
  merchantCode: "SKAN_MASTER_001",
  environment: "production",
  webhookUrl: "https://api.skan.al/webhooks/verifone"
}

// Restaurant onboarding
const onboardRestaurant = async (restaurantData) => {
  return await verifone.createSubMerchant({
    businessName: restaurantData.name,
    taxId: restaurantData.taxId,
    bankAccount: restaurantData.bankDetails,
    address: restaurantData.address,
    contactInfo: restaurantData.owner
  });
}
```

### 2. Order Payment Processing
```javascript
// When customer places order
const processOrderPayment = async (order) => {
  const paymentRequest = {
    amount: order.total,
    currency: "EUR",
    orderId: order.id,
    restaurantId: order.venueId,
    splitConfig: {
      platformCommission: 0.029, // 2.9%
      restaurantAccount: order.restaurant.payoutAccount
    }
  };
  
  return await verifone.createMarketplacePayment(paymentRequest);
}
```

### 3. Automatic Payouts
```javascript
// Verifone handles automatic payouts
const payoutSchedule = {
  frequency: "weekly", // or daily/monthly
  minimumAmount: 10, // €10 minimum payout
  currency: "EUR"
};
```

## Compliance & Legal

### SKAN.AL Responsibilities
- ✅ **Merchant of Record**: Legal responsibility for all transactions
- ✅ **Tax Compliance**: Handle VAT/tax reporting for platform
- ✅ **Fraud Prevention**: Monitor for suspicious activity
- ✅ **Customer Support**: Handle payment disputes

### Restaurant Responsibilities  
- ✅ **Service Delivery**: Fulfill orders as promised
- ✅ **Tax Reporting**: Report their portion of income
- ✅ **Business License**: Maintain valid restaurant licenses

## Revenue Examples

### Restaurant doing €3,000/month in digital orders:

**Digital Plan:**
- Gross Revenue: €3,000
- Verifone Fees (3%): -€90
- SKAN.AL Commission (2.9%): -€87
- **Restaurant Net: €2,823**
- **SKAN.AL Earnings: €87/month**

**Premium Plan:**
- SKAN.AL Revenue: €35/month (guaranteed)
- Restaurant keeps 100% of cash orders
- No transaction fees

## Setup Requirements

### For SKAN.AL:
1. **Business Registration**: Albanian company registration
2. **Verifone Application**: Apply for marketplace account
3. **Bank Account**: Business bank account for payouts
4. **Legal Structure**: Terms of service, privacy policy
5. **Technical Integration**: API integration and webhooks

### For Restaurants:
1. **Basic Documents**: Business license, tax ID
2. **Bank Account**: Valid EUR bank account for payouts
3. **Identity Verification**: Owner ID and address proof
4. **Simple Onboarding**: Through SKAN.AL admin portal

## Next Steps for Implementation

1. **Apply for Verifone Marketplace Account**
2. **Set up webhook endpoints for payment notifications**
3. **Build restaurant onboarding flow**
4. **Implement payment splitting logic**
5. **Create payout management system**
6. **Test in sandbox environment**
7. **Go live with pilot restaurants**

This model allows SKAN.AL to earn revenue while providing restaurants with payment processing without them needing individual Verifone accounts.