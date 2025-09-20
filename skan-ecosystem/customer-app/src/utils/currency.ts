/**
 * Currency formatting utilities for SKAN.AL customer app
 */

/**
 * Format price according to venue currency settings
 */
export function formatPrice(price: number, currency: string = 'EUR'): string {
  // For EUR, display as €X.XX
  if (currency === 'EUR') {
    return `€${price}`;
  }
  
  // For Albanian Lek, convert EUR to ALL (approximately 1 EUR = 100-105 ALL)
  if (currency === 'ALL' || currency === 'LEK') {
    const lekPrice = Math.round(price * 100); // Updated conversion rate
    return `${lekPrice} Lek`;
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
export function formatTotalAmount(amount: number, currency: string = 'EUR'): string {
  return formatPrice(amount, currency);
}