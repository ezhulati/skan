import { VenueMenuResponse, Order, OrderResponse, OrderTracking } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

export const api = {
  async getVenueMenu(venueSlug: string): Promise<VenueMenuResponse> {
    return apiRequest<VenueMenuResponse>(`/venue/${venueSlug}/menu`);
  },

  async createOrder(order: Order): Promise<OrderResponse> {
    return apiRequest<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async trackOrder(orderNumber: string): Promise<OrderTracking> {
    return apiRequest<OrderTracking>(`/track/${orderNumber}`);
  },

  async getOrderDetails(orderId: string): Promise<OrderTracking> {
    return apiRequest<OrderTracking>(`/orders/${orderId}`);
  },

};

export { ApiError };