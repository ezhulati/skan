/**
 * Verifone (2Checkout) Payment Integration Utilities
 * Handles marketplace split payments and subscription billing for SKAN.AL
 */

// Verifone configuration
interface VerifoneConfig {
  apiUrl: string;
  merchantCode: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
  currency: string;
}

// Payment split configuration
interface PaymentSplit {
  restaurantAccountId: string;
  platformCommissionRate: number; // e.g., 0.029 for 2.9%
  orderAmount: number;
  currency: string;
}

// Subscription plan types
type SubscriptionPlan = 'digital' | 'premium';

interface SubscriptionConfig {
  plan: SubscriptionPlan;
  monthlyPrice: number;
  currency: string;
  customerId: string;
}

// Order payment structure
interface OrderPayment {
  orderId: string;
  restaurantId: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

/**
 * Initialize Verifone configuration
 */
export const initializeVerifone = (config: VerifoneConfig) => {
  // Store configuration securely
  sessionStorage.setItem('verifone_config', JSON.stringify(config));
  
  // Load Verifone JavaScript SDK
  if (!document.getElementById('verifone-sdk')) {
    const script = document.createElement('script');
    script.id = 'verifone-sdk';
    script.src = config.environment === 'production' 
      ? 'https://secure.2checkout.com/checkout/api/2co.min.js'
      : 'https://sandbox.2checkout.com/checkout/api/2co.min.js';
    document.head.appendChild(script);
  }
};

/**
 * Calculate payment splits for marketplace model
 */
export const calculatePaymentSplit = (split: PaymentSplit) => {
  const totalAmount = split.orderAmount;
  const platformCommission = Math.round(totalAmount * split.platformCommissionRate * 100) / 100;
  const restaurantAmount = Math.round((totalAmount - platformCommission) * 100) / 100;
  
  // Verifone charges 3% transaction fee
  const verifoneTransactionFee = Math.round(totalAmount * 0.03 * 100) / 100;
  
  return {
    totalAmount,
    platformCommission,
    restaurantAmount,
    transactionFee: verifoneTransactionFee,
    restaurantNet: restaurantAmount - verifoneTransactionFee
  };
};

/**
 * Create marketplace payment with split
 */
export const createMarketplacePayment = async (payment: OrderPayment): Promise<any> => {
  const config = getVerifoneConfig();
  
  // Calculate splits
  const split = calculatePaymentSplit({
    restaurantAccountId: payment.restaurantId,
    platformCommissionRate: 0.029, // 2.9% commission
    orderAmount: payment.amount,
    currency: payment.currency
  });
  
  try {
    // Demo mode - simulate successful payment
    if (config.environment === 'sandbox') {
      return simulatePaymentSuccess(payment, split);
    }
    
    // Production Verifone API call would go here
    const paymentData = {
      sellerId: config.merchantCode,
      merchantOrderId: payment.orderId,
      currency: payment.currency,
      amount: payment.amount,
      buyerEmail: payment.customerEmail,
      split: {
        vendors: [
          {
            vendorId: payment.restaurantId,
            amount: split.restaurantAmount
          }
        ],
        platformFee: split.platformCommission
      },
      product: {
        name: `Order ${payment.orderId}`,
        description: payment.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
      }
    };
    
    // This would be the actual API call to Verifone
    const response = await fetch(`${config.apiUrl}/rest/6.0/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Avangate-Authentication': generateAuthHeader(config)
      },
      body: JSON.stringify(paymentData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Verifone payment error:', error);
    throw new Error('Payment processing failed');
  }
};

/**
 * Create subscription for monthly plans
 */
export const createSubscription = async (subscription: SubscriptionConfig): Promise<any> => {
  const config = getVerifoneConfig();
  
  try {
    // Demo mode simulation
    if (config.environment === 'sandbox') {
      return {
        subscriptionId: `sub_demo_${Date.now()}`,
        status: 'active',
        plan: subscription.plan,
        amount: subscription.monthlyPrice,
        currency: subscription.currency,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    
    // Production subscription creation
    const subscriptionData = {
      sellerId: config.merchantCode,
      customerId: subscription.customerId,
      productCode: `skan-${subscription.plan}-monthly`,
      billingCycle: 'MONTH',
      amount: subscription.monthlyPrice,
      currency: subscription.currency
    };
    
    const response = await fetch(`${config.apiUrl}/rest/6.0/subscriptions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Avangate-Authentication': generateAuthHeader(config)
      },
      body: JSON.stringify(subscriptionData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Subscription creation error:', error);
    throw new Error('Subscription creation failed');
  }
};

/**
 * Handle webhook notifications from Verifone
 */
export const handleVerifoneWebhook = (webhookData: any) => {
  const { messageType, refNo, orderNumber } = webhookData;
  
  switch (messageType) {
    case 'ORDER_CREATED':
      // Handle successful payment
      console.log(`Payment successful for order: ${orderNumber}`);
      break;
    case 'SUBSCRIPTION_CHARGED':
      // Handle subscription renewal
      console.log(`Subscription charged: ${refNo}`);
      break;
    case 'REFUND_ISSUED':
      // Handle refund
      console.log(`Refund issued for: ${refNo}`);
      break;
    default:
      console.log(`Unknown webhook type: ${messageType}`);
  }
};

/**
 * Get stored Verifone configuration
 */
const getVerifoneConfig = (): VerifoneConfig => {
  const config = sessionStorage.getItem('verifone_config');
  if (!config) {
    throw new Error('Verifone not initialized');
  }
  return JSON.parse(config);
};

/**
 * Generate authentication header for Verifone API
 */
const generateAuthHeader = (config: VerifoneConfig): string => {
  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(7);
  
  // This is a simplified version - actual implementation would use HMAC
  return `code="${config.merchantCode}" date="${timestamp}" nonce="${nonce}"`;
};

/**
 * Simulate payment success for demo mode
 */
const simulatePaymentSuccess = (payment: OrderPayment, split: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        orderId: payment.orderId,
        status: 'success',
        transactionId: `demo_txn_${Date.now()}`,
        amount: payment.amount,
        currency: payment.currency,
        split: {
          restaurantAmount: split.restaurantAmount,
          platformCommission: split.platformCommission,
          transactionFee: split.transactionFee
        },
        timestamp: new Date().toISOString()
      });
    }, 1500); // Simulate network delay
  });
};

/**
 * Redirect to Verifone hosted checkout
 */
export const redirectToCheckout = (payment: OrderPayment) => {
  const config = getVerifoneConfig();
  const split = calculatePaymentSplit({
    restaurantAccountId: payment.restaurantId,
    platformCommissionRate: 0.029,
    orderAmount: payment.amount,
    currency: payment.currency
  });
  
  // Build checkout URL
  const checkoutUrl = new URL(
    config.environment === 'production' 
      ? 'https://secure.2checkout.com/order/checkout.php'
      : 'https://sandbox.2checkout.com/order/checkout.php'
  );
  
  checkoutUrl.searchParams.set('sid', config.merchantCode);
  checkoutUrl.searchParams.set('mode', '2CO');
  checkoutUrl.searchParams.set('li_0_type', 'product');
  checkoutUrl.searchParams.set('li_0_name', `Order ${payment.orderId}`);
  checkoutUrl.searchParams.set('li_0_price', payment.amount.toString());
  checkoutUrl.searchParams.set('currency_code', payment.currency);
  checkoutUrl.searchParams.set('merchant_order_id', payment.orderId);
  
  // Redirect to Verifone checkout
  window.location.href = checkoutUrl.toString();
};

/**
 * Default configuration for SKAN.AL
 */
export const SKAN_VERIFONE_CONFIG: Partial<VerifoneConfig> = {
  environment: 'sandbox', // Change to 'production' when ready
  apiUrl: 'https://api.avangate.com', // Production API URL
  currency: 'EUR'
};

/**
 * Subscription plan configurations
 */
export const SUBSCRIPTION_PLANS = {
  digital: {
    name: 'Digital Plan',
    monthlyPrice: 0,
    commissionRate: 0.029,
    features: ['Card payments via Verifone', 'Real-time orders', 'Basic analytics']
  },
  premium: {
    name: 'Premium Plan', 
    monthlyPrice: 35,
    commissionRate: 0,
    features: ['Cash-only payments', 'Advanced analytics', 'Priority support', 'No transaction fees']
  }
};