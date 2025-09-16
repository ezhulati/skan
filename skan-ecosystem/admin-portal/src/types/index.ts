export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'staff' | 'manager' | 'owner';
  venueId: string;
  isActive: boolean;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  description: string;
  settings: {
    currency: string;
    orderingEnabled: boolean;
    estimatedPreparationTime: number;
  };
}

export interface OrderItem {
  id: string;
  name: string;
  nameAlbanian: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  venueId: string;
  tableNumber: string;
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  specialInstructions?: string;
  status: 'new' | 'preparing' | 'ready' | 'served';
  createdAt: string;
  updatedAt: string;
  preparedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

export interface OrdersResponse {
  orders: Order[];
}

export interface AuthContextType {
  user: User | null;
  venue: Venue | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface LoginResponse {
  token: string;
  user: User;
  venue: Venue;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served';

export interface OrderFilters {
  status?: OrderStatus | 'all';
  date?: string;
  limit?: number;
}

export interface OrderStats {
  totalOrders: number;
  newOrders: number;
  preparingOrders: number;
  readyOrders: number;
  servedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}