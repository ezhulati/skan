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
  status: 'new' | 'preparing' | 'ready' | 'served';
  createdAt: string;
  updatedAt?: string;
}

class RestaurantApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
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