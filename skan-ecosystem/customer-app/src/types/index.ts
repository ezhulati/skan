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
    subscriptionTier: 'basic';
  };
}

export interface MenuItem {
  id: string;
  name: string;
  nameAlbanian: string;
  description?: string;
  descriptionAlbanian?: string;
  price: number;
  allergens: string[];
  imageUrl?: string;
  preparationTime: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameAlbanian: string;
  items: MenuItem[];
}

export interface VenueMenuResponse {
  venue: Venue;
  categories: MenuCategory[];
}

export interface CartItem {
  id: string;
  name: string;
  nameAlbanian: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
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
  id?: string;
  venueId: string;
  tableNumber: string;
  customerName?: string;
  orderNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  specialInstructions?: string;
  status: 'new' | 'preparing' | 'ready' | 'served';
  paymentMethod: 'pay_waiter';
  paymentStatus: 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  message: string;
}

export interface OrderTracking {
  orderNumber: string;
  status: 'new' | 'preparing' | 'ready' | 'served';
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  estimatedTime: string;
}

export interface VenueContextType {
  venueSlug: string;
  tableNumber: string;
  venue: Venue | null;
  menuCategories: MenuCategory[];
  isLoading: boolean;
  error: string | null;
  loadVenueMenu: () => Promise<void>;
}

export interface CartContextType {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  updateSpecialInstructions: (itemId: string, instructions: string) => void;
}