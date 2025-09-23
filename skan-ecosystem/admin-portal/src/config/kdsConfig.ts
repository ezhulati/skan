/**
 * KDS Configuration - Simple, Two-Number Approach
 * Based on insights from Target Time.md - let kitchen experience guide timing
 */

export interface KDSConfig {
  // Simple timing thresholds (only two numbers needed)
  highlightNewAfterMinutes: number;
  highlightPreparingAfterMinutes: number;
  
  // Rush mode settings
  rushThreshold: number; // orders per 10 minutes
  rushTimeWindowMinutes: number;
  
  // Basic service standards
  serviceStandard: {
    lunch: number;    // minutes for lunch service
    dinner: number;   // minutes for dinner service
  };
}

// Default configuration - can be customized per restaurant
export const DEFAULT_KDS_CONFIG: KDSConfig = {
  // Core timing (as suggested in Target Time.md)
  highlightNewAfterMinutes: 5,     // NEW orders get yellow after 5 min, red after this
  highlightPreparingAfterMinutes: 15, // PREPARING orders get yellow after 15 min, red after this
  
  // Rush detection
  rushThreshold: 8,
  rushTimeWindowMinutes: 10,
  
  // Service standards (one number per period)
  serviceStandard: {
    lunch: 15,   // "We aim for 15-minute lunch service"
    dinner: 25   // "We aim for 25-minute dinner service"
  }
};

/**
 * Get current service period based on time of day
 */
export const getCurrentServicePeriod = (): 'lunch' | 'dinner' => {
  const hour = new Date().getHours();
  return (hour >= 11 && hour < 16) ? 'lunch' : 'dinner';
};

/**
 * Check if order is late based on simple service standard
 */
export const isOrderLate = (orderCreatedAt: string, config: KDSConfig = DEFAULT_KDS_CONFIG): boolean => {
  const elapsedMinutes = (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60);
  const servicePeriod = getCurrentServicePeriod();
  const standard = config.serviceStandard[servicePeriod];
  
  return elapsedMinutes > standard;
};

/**
 * Get urgency level based on elapsed time and status
 */
export const getOrderUrgency = (
  orderCreatedAt: string, 
  status: string, 
  config: KDSConfig = DEFAULT_KDS_CONFIG
): 'normal' | 'warning' | 'critical' => {
  const elapsedMinutes = (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60);
  
  // Normalize status
  const normalizedStatus = status === '3' ? 'new' : 
                          status === '5' ? 'preparing' : 
                          status === '7' ? 'ready' : 
                          status;
  
  if (normalizedStatus === 'new') {
    if (elapsedMinutes >= config.highlightNewAfterMinutes * 1.5) return 'critical'; // 7.5 min
    if (elapsedMinutes >= config.highlightNewAfterMinutes) return 'warning';         // 5 min
    return 'normal';
  }
  
  if (normalizedStatus === 'preparing') {
    if (elapsedMinutes >= config.highlightPreparingAfterMinutes * 1.3) return 'critical'; // 19.5 min
    if (elapsedMinutes >= config.highlightPreparingAfterMinutes) return 'warning';         // 15 min
    return 'normal';
  }
  
  if (normalizedStatus === 'ready') {
    if (elapsedMinutes >= 5) return 'critical';  // Ready food sitting too long
    if (elapsedMinutes >= 3) return 'warning';
    return 'normal';
  }
  
  return 'normal';
};

/**
 * Format elapsed time for display
 */
export const formatElapsedTime = (orderCreatedAt: string): string => {
  const elapsedMinutes = (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60);
  
  if (elapsedMinutes < 1) {
    return '< 1 min';
  } else if (elapsedMinutes < 60) {
    return `${Math.floor(elapsedMinutes)} min`;
  } else {
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = Math.floor(elapsedMinutes % 60);
    return `${hours}h ${minutes}min`;
  }
};

/**
 * Get status display text in Albanian
 */
export const getStatusDisplayText = (status: string): string => {
  const normalizedStatus = status === '3' ? 'new' : 
                          status === '5' ? 'preparing' : 
                          status === '7' ? 'ready' : 
                          status === '9' ? 'served' : 
                          status;
  
  switch (normalizedStatus) {
    case 'new': return 'E Re';
    case 'preparing': return 'Duke u Përgatitur';
    case 'ready': return 'Gati';
    case 'served': return 'Shërbyer';
    default: return status;
  }
};