/**
 * Currency formatting utilities for SKAN.AL customer app
 */

/**
 * Format price according to venue currency settings
 */
export function formatPrice(price: number, currency: string = 'ALL'): string {
  // For Albanian Lek (default for Albanian restaurants)
  if (currency === 'ALL' || currency === 'LEK') {
    return `${Math.round(price)} Lek`;
  }
  
  // For EUR, display as €X.XX
  if (currency === 'EUR') {
    return `€${price.toFixed(2)}`;
  }
  
  // Default fallback
  return `${price} ${currency}`;
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string = 'EUR'): string {
  switch (currency.toUpperCase()) {
    case 'EUR':
      return '€';
    case 'ALL':
    case 'LEK':
      return 'Lek';
    case 'USD':
      return '$';
    default:
      return currency;
  }
}

/**
 * Format total amount for order summary
 */
export function formatTotalAmount(amount: number, currency: string = 'ALL'): string {
  return formatPrice(amount, currency);
}