/**
 * Verifone (2Checkout) Configuration for SKAN.AL Admin Portal
 */

export interface VerifoneEnvironment {
  apiUrl: string;
  checkoutUrl: string;
  webhookUrl: string;
  environment: 'sandbox' | 'production';
}

export const VERIFONE_ENVIRONMENTS: Record<string, VerifoneEnvironment> = {
  sandbox: {
    apiUrl: 'https://api.avangate.com',
    checkoutUrl: 'https://sandbox.2checkout.com',
    webhookUrl: 'https://api.skan.al/webhooks/verifone',
    environment: 'sandbox'
  },
  production: {
    apiUrl: 'https://api.avangate.com',
    checkoutUrl: 'https://secure.2checkout.com',
    webhookUrl: 'https://api.skan.al/webhooks/verifone',
    environment: 'production'
  }
};

export const VERIFONE_CONFIG = {
  // Environment (change to 'production' when ready)
  currentEnvironment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  
  // Merchant credentials (these should be environment variables in production)
  merchantCode: process.env.REACT_APP_VERIFONE_MERCHANT_CODE || 'DEMO_MERCHANT',
  secretKey: process.env.REACT_APP_VERIFONE_SECRET_KEY || 'demo_secret_key',
  
  // Payment configuration
  currency: 'EUR',
  language: 'sq', // Albanian
  country: 'AL',
  
  // Commission rates
  platformCommissionRate: 0.029, // 2.9% for digital plan
  verifoneTransactionFee: 0.03, // 3% Verifone fee
  
  // Subscription plans
  subscriptionPlans: {
    digital: {
      productCode: 'SKAN_DIGITAL_MONTHLY',
      name: 'Digital Plan',
      price: 0,
      billingCycle: 'MONTH',
      features: ['Card payments', 'Real-time orders', 'Basic analytics']
    },
    premium: {
      productCode: 'SKAN_PREMIUM_MONTHLY', 
      name: 'Premium Plan',
      price: 35,
      billingCycle: 'MONTH',
      features: ['Cash payments', 'Advanced analytics', 'Priority support', 'No fees']
    }
  },
  
  // Webhook events to handle
  webhookEvents: [
    'ORDER_CREATED',
    'ORDER_COMPLETED', 
    'SUBSCRIPTION_CHARGED',
    'SUBSCRIPTION_CANCELED',
    'REFUND_ISSUED'
  ]
};

/**
 * Get current Verifone environment configuration
 */
export const getCurrentEnvironment = (): VerifoneEnvironment => {
  return VERIFONE_ENVIRONMENTS[VERIFONE_CONFIG.currentEnvironment];
};

/**
 * Build Verifone checkout URL for marketplace payments
 */
export const buildCheckoutUrl = (params: {
  orderId: string;
  amount: number;
  restaurantId: string;
  customerEmail?: string;
  returnUrl?: string;
}): string => {
  const env = getCurrentEnvironment();
  const checkoutUrl = new URL(`${env.checkoutUrl}/order/checkout.php`);
  
  // Required parameters
  checkoutUrl.searchParams.set('sid', VERIFONE_CONFIG.merchantCode);
  checkoutUrl.searchParams.set('mode', '2CO');
  checkoutUrl.searchParams.set('currency_code', VERIFONE_CONFIG.currency);
  checkoutUrl.searchParams.set('lang', VERIFONE_CONFIG.language);
  
  // Order details
  checkoutUrl.searchParams.set('merchant_order_id', params.orderId);
  checkoutUrl.searchParams.set('li_0_type', 'product');
  checkoutUrl.searchParams.set('li_0_name', `Restaurant Order ${params.orderId}`);
  checkoutUrl.searchParams.set('li_0_price', params.amount.toString());
  
  // Customer details
  if (params.customerEmail) {
    checkoutUrl.searchParams.set('email', params.customerEmail);
  }
  
  // Return URL after payment
  if (params.returnUrl) {
    checkoutUrl.searchParams.set('return_url', params.returnUrl);
  }
  
  return checkoutUrl.toString();
};

/**
 * Calculate payment splits for marketplace
 */
export const calculateSplit = (orderAmount: number) => {
  const platformCommission = Math.round(orderAmount * VERIFONE_CONFIG.platformCommissionRate * 100) / 100;
  const verifoneTransactionFee = Math.round(orderAmount * VERIFONE_CONFIG.verifoneTransactionFee * 100) / 100;
  const restaurantAmount = Math.round((orderAmount - platformCommission) * 100) / 100;
  
  return {
    orderAmount,
    platformCommission,
    restaurantAmount,
    verifoneTransactionFee,
    restaurantNet: restaurantAmount - verifoneTransactionFee
  };
};

/**
 * Subscription billing URLs
 */
export const getSubscriptionUrls = () => {
  const env = getCurrentEnvironment();
  
  return {
    digital: `${env.checkoutUrl}/order/checkout.php?PRODS=${VERIFONE_CONFIG.subscriptionPlans.digital.productCode}&QTY=1&CART=1&CARD=1`,
    premium: `${env.checkoutUrl}/order/checkout.php?PRODS=${VERIFONE_CONFIG.subscriptionPlans.premium.productCode}&QTY=1&CART=1&CARD=1`
  };
};

/**
 * Validate webhook signature
 */
export const validateWebhookSignature = (payload: string, signature: string): boolean => {
  // In production, implement proper HMAC signature validation
  // This is a simplified version for demo purposes
  if (VERIFONE_CONFIG.currentEnvironment === 'sandbox') {
    return true; // Accept all webhooks in sandbox
  }
  
  // Production signature validation would go here
  // using crypto.createHmac('sha1', secretKey).update(payload).digest('hex')
  return signature.length > 0;
};

export default VERIFONE_CONFIG;