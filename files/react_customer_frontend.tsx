// App.tsx - Main React Application
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import QRLanding from './pages/QRLanding';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Confirmation from './pages/Confirmation';
import OrderTracking from './pages/OrderTracking';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/order/:venueSlug/:tableNumber" element={<QRLanding />} />
            <Route path="/menu/:venueId" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/confirmation/:orderId" element={<Confirmation />} />
            <Route path="/track/:orderId" element={<OrderTracking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;

// ============================================================================
// CONTEXT - Cart Management
// ============================================================================

// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface MenuItem {
  id: string;
  name: string;
  nameAlbanian?: string;
  price: number;
  description?: string;
  allergens?: string[];
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  venueInfo: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tableNumber: string;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_VENUE_INFO'; payload: { venue: any; tableNumber: string } };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems)
        };
      } else {
        const newItems = [...state.items, { ...action.payload, quantity: 1 }];
        return {
          ...state,
          items: newItems,
          total: calculateTotal(newItems)
        };
      }
    
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        total: calculateTotal(filteredItems)
      };
    
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity === 0) {
        const filteredItems = state.items.filter(item => item.id !== action.payload.id);
        return {
          ...state,
          items: filteredItems,
          total: calculateTotal(filteredItems)
        };
      }
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0
      };
    
    case 'SET_VENUE_INFO':
      return {
        ...state,
        venueInfo: action.payload.venue,
        tableNumber: action.payload.tableNumber
      };
    
    default:
      return state;
  }
};

const calculateTotal = (items: CartItem[]): number => {
  return Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    venueInfo: null,
    tableNumber: ''
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// ============================================================================
// PAGES - Customer Journey
// ============================================================================

// pages/QRLanding.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { fetchVenueMenu } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const QRLanding: React.FC = () => {
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVenue = async () => {
      if (!venueSlug) return;
      
      try {
        const data = await fetchVenueMenu(venueSlug);
        setVenue(data.venue);
        dispatch({ 
          type: 'SET_VENUE_INFO', 
          payload: { venue: data.venue, tableNumber: tableNumber || '' }
        });
      } catch (err) {
        setError('Venue not found');
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [venueSlug, tableNumber, dispatch]);

  const handleContinue = () => {
    if (venue) {
      navigate(`/menu/${venue.id}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {venue?.name}
          </h1>
          <p className="text-gray-600">{venue?.address}</p>
        </div>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-1">
            Table {tableNumber?.toUpperCase()}
          </h2>
          <p className="text-blue-600 text-sm">
            You're ready to order from your table
          </p>
        </div>

        {venue?.description && (
          <p className="text-gray-600 mb-6 text-sm">
            {venue.description}
          </p>
        )}

        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Menu
        </button>
      </div>
    </div>
  );
};

export default QRLanding;

// pages/Menu.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { fetchVenueMenu } from '../services/api';
import MenuItem from '../components/MenuItem';
import CartSummary from '../components/CartSummary';
import LoadingSpinner from '../components/LoadingSpinner';

interface MenuCategory {
  id: string;
  name: string;
  nameAlbanian?: string;
  items: any[];
}

const Menu: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const { state } = useCart();
  const [menu, setMenu] = useState<{ venue: any; categories: MenuCategory[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const loadMenu = async () => {
      if (!state.venueInfo?.slug) return;
      
      try {
        const data = await fetchVenueMenu(state.venueInfo.slug);
        setMenu(data);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [state.venueInfo?.slug]);

  if (loading) return <LoadingSpinner />;
  if (!menu) return <div className="text-center p-8">Menu not available</div>;

  const selectedCategoryData = menu.categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{menu.venue.name}</h1>
            <p className="text-sm text-gray-600">Table {state.tableNumber}</p>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg relative"
          >
            Cart ({state.items.length})
            {state.items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {state.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto px-4">
          {menu.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {category.nameAlbanian || category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4">
        {selectedCategoryData && (
          <div className="space-y-4">
            {selectedCategoryData.items.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary (Fixed at bottom) */}
      {state.items.length > 0 && <CartSummary />}
    </div>
  );
};

export default Menu;

// pages/Cart.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { createOrder } from '../services/api';
import CartItem from '../components/CartItem';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (state.items.length === 0 || !state.venueInfo) return;

    setIsSubmitting(true);
    try {
      const orderData = {
        venueId: state.venueInfo.id,
        tableNumber: state.tableNumber,
        customerName: customerName.trim() || 'Anonymous Customer',
        items: state.items.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        specialInstructions: specialInstructions.trim()
      };

      const response = await createOrder(orderData);
      
      // Clear cart and navigate to confirmation
      dispatch({ type: 'CLEAR_CART' });
      navigate(`/confirmation/${response.orderId}`, {
        state: { orderNumber: response.orderNumber, orderData }
      });
      
    } catch (error) {
      console.error('Failed to submit order:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-600"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold">Your Order</h1>
            <p className="text-sm text-gray-600">
              {state.venueInfo?.name} - Table {state.tableNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Order Items</h2>
          </div>
          <div className="divide-y">
            {state.items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total:</span>
              <span>€{state.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
          <h2 className="font-semibold mb-4">Order Details</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests or allergies?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || state.items.length === 0}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting Order...' : `Submit Order - €${state.total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default Cart;

// pages/Confirmation.tsx
import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const Confirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const orderNumber = location.state?.orderNumber;
  const orderData = location.state?.orderData;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-green-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-green-600">
            Your order has been sent to the kitchen
          </p>
        </div>

        {orderNumber && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="text-xl font-bold text-gray-800">{orderNumber}</p>
          </div>
        )}

        {orderData && (
          <div className="mb-6 text-left">
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              {orderData.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>€{orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-600 mb-6">
          <p>The restaurant will prepare your order.</p>
          <p>Staff will bring it to your table when ready.</p>
        </div>

        <div className="space-y-3">
          {orderId && (
            <button
              onClick={() => navigate(`/track/${orderId}`)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Track Order Status
            </button>
          )}
          
          <button
            onClick={() => navigate(-2)}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
          >
            Order More Items
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;

// ============================================================================
// COMPONENTS
// ============================================================================

// components/MenuItem.tsx
import React from 'react';
import { useCart } from '../contexts/CartContext';

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    nameAlbanian?: string;
    description?: string;
    price: number;
    allergens?: string[];
    imageUrl?: string;
  };
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const { dispatch } = useCart();

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg mr-4"
        />
      )}
      
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800">
            {item.nameAlbanian || item.name}
          </h3>
          <span className="font-bold text-green-600">
            €{item.price.toFixed(2)}
          </span>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-2">
            {item.description}
          </p>
        )}
        
        {item.allergens && item.allergens.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-orange-600">
              Allergens: {item.allergens.join(', ')}
            </p>
          </div>
        )}
        
        <button
          onClick={handleAddToCart}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default MenuItem;

// components/CartItem.tsx
import React from 'react';
import { useCart } from '../contexts/CartContext';

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { dispatch } = useCart();

  const updateQuantity = (newQuantity: number) => {
    dispatch({ 
      type: 'UPDATE_QUANTITY', 
      payload: { id: item.id, quantity: newQuantity } 
    });
  };

  const removeItem = () => {
    dispatch({ type: 'REMOVE_ITEM', payload: item.id });
  };

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-medium">{item.name}</h4>
        <p className="text-sm text-gray-600">€{item.price.toFixed(2)} each</p>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateQuantity(item.quantity - 1)}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600"
          >
            -
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"
          >
            +
          </button>
        </div>
        
        <div className="text-right">
          <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
        </div>
        
        <button
          onClick={removeItem}
          className="text-red-600 p-1"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CartItem;

// components/CartSummary.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const CartSummary: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useCart();

  if (state.items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {state.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </p>
          <p className="font-bold text-lg">€{state.total.toFixed(2)}</p>
        </div>
        <button
          onClick={() => navigate('/cart')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
        >
          View Cart
        </button>
      </div>
    </div>
  );
};

export default CartSummary;

// components/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default LoadingSpinner;

// ============================================================================
// API SERVICE
// ============================================================================

// services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api';

export const fetchVenueMenu = async (venueSlug: string) => {
  const response = await fetch(`${API_BASE_URL}/venue/${venueSlug}/menu`);
  if (!response.ok) {
    throw new Error('Failed to fetch menu');
  }
  return response.json();
};

export const createOrder = async (orderData: any) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create order');
  }
  
  return response.json();
};

export const fetchOrder = async (orderId: string) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }
  return response.json();
};

// ============================================================================
// STYLES
// ============================================================================

// App.css
/*
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 480px;
  margin: 0 auto;
}
*/