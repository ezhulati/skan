const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  venueId: string;
  tableNumber: string;
  orderNumber: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'new' | 'preparing' | 'ready' | 'served' | '3' | '5' | '7' | '9';
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
  preparedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

export interface ActiveOrdersResponse {
  data: Order[];
  counts: {
    new: number;
    preparing: number;
    ready: number;
    total: number;
  };
  metadata: {
    limit: number;
    lastUpdated: string;
  };
}

export interface RecentServedOrdersResponse {
  data: Order[];
  metadata: {
    limit: number;
    hours: number;
    total: number;
    lastUpdated: string;
  };
}

class RestaurantApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add any existing headers
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getOrders(venueId: string, status?: string): Promise<Order[]> {
    const statusQuery = status && status !== 'all' ? `?status=${status}` : '';
    return this.request<Order[]>(`/venue/${venueId}/orders${statusQuery}`);
  }

  async getActiveOrders(venueId: string, params?: { limit?: number }): Promise<ActiveOrdersResponse> {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', params.limit.toString());
    }
    const query = search.toString();
    return this.request<ActiveOrdersResponse>(`/venue/${venueId}/orders/active${query ? `?${query}` : ''}`);
  }

  async getRecentServedOrders(venueId: string, params?: { limit?: number; hours?: number }): Promise<RecentServedOrdersResponse> {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', params.limit.toString());
    }
    if (params?.hours) {
      search.set('hours', params.hours.toString());
    }
    const query = search.toString();
    return this.request<RecentServedOrdersResponse>(`/venue/${venueId}/orders/recent-served${query ? `?${query}` : ''}`);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<{ message: string; orderId: string; status: string }> {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const restaurantApiService = new RestaurantApiService();
