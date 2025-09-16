const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api';

export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  description?: string;
  isActive: boolean;
  categoryId: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameEn?: string;
  items: MenuItem[];
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
}

export interface MenuResponse {
  venue: Venue;
  menu: MenuCategory[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderRequest {
  venueId: string;
  tableNumber: string;
  customerName?: string;
  items: OrderItem[];
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  message: string;
}

class ApiService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getMenuBySlug(slug: string): Promise<MenuResponse> {
    return this.request<MenuResponse>(`/venue/${slug}/menu`);
  }

  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();
