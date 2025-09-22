/**
 * Extracts the short order number from a full order number
 * Converts "SKN-20250922-007" to "007"
 * @param fullOrderNumber - The full order number (e.g., "SKN-20250922-007")
 * @returns The short order number (e.g., "007")
 */
export function getShortOrderNumber(fullOrderNumber: string): string {
  // Split by hyphens and get the last part
  const parts = fullOrderNumber.split('-');
  if (parts.length >= 3) {
    return parts[parts.length - 1]; // Return the last part (e.g., "007")
  }
  
  // Fallback: if format is unexpected, return the full number
  return fullOrderNumber;
}

/**
 * Formats the short order number for customer display
 * @param fullOrderNumber - The full order number
 * @returns Formatted short number for display
 */
export function formatCustomerOrderNumber(fullOrderNumber: string): string {
  return getShortOrderNumber(fullOrderNumber);
}