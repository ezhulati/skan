import { Order, OrdersResponse, LoginResponse, OrderFilters, OrderStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app';

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

  // Add auth token if available
  const token = localStorage.getItem('skan-admin-token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

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
  // Authentication
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store the token
    localStorage.setItem('skan-admin-token', response.token);
    
    return response;
  },

  logout() {
    localStorage.removeItem('skan-admin-token');
  },

  // Orders
  async getOrders(venueId: string, filters: OrderFilters = {}): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/venue/${venueId}/orders${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<OrdersResponse>(endpoint);
  },

  async updateOrderStatus(orderId: string, status: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getOrderDetails(orderId: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${orderId}`);
  },

  // Statistics
  getOrderStats(orders: Order[]): OrderStats {
    const stats: OrderStats = {
      totalOrders: orders.length,
      newOrders: 0,
      preparingOrders: 0,
      readyOrders: 0,
      servedOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    };

    orders.forEach(order => {
      switch (order.status) {
        case 'new':
          stats.newOrders++;
          break;
        case 'preparing':
          stats.preparingOrders++;
          break;
        case 'ready':
          stats.readyOrders++;
          break;
        case 'served':
          stats.servedOrders++;
          break;
      }
      stats.totalRevenue += order.totalAmount;
    });

    stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    return stats;
  }
};

export { ApiError };