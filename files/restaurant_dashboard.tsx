// Restaurant Dashboard - Complete Application
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/order/:orderId" element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

// ============================================================================
// AUTHENTICATION CONTEXT
// ============================================================================

// contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { loginUser, getCurrentUser } from '../services/auth';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  venueId: string;
}

interface Venue {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  user: User | null;
  venue: Venue | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; venue: Venue; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
} | null>(null);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        venue: action.payload.venue,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        venue: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      };
    
    case 'LOGOUT':
      localStorage.removeItem('skan_auth_token');
      return {
        ...state,
        user: null,
        venue: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    venue: null,
    token: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    // Check for stored auth token on app start
    const checkStoredAuth = async () => {
      const storedToken = localStorage.getItem('skan_auth_token');
      if (storedToken) {
        try {
          const userData = await getCurrentUser(storedToken);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: userData.user,
              venue: userData.venue,
              token: storedToken
            }
          });
        } catch (error) {
          localStorage.removeItem('skan_auth_token');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkStoredAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await loginUser(email, password);
      
      localStorage.setItem('skan_auth_token', response.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          venue: response.venue,
          token: response.token
        }
      });
      
      return true;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// PAGES
// ============================================================================

// pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { state, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restaurant Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your orders
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={state.isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {state.isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>Email: manager_email@gmail.com</p>
            <p>Password: demo123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

// pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchVenueOrders, updateOrderStatus } from '../services/orders';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  items: any[];
  totalAmount: number;
  status: 'new' | 'preparing' | 'ready' | 'served';
  createdAt: string;
  specialInstructions?: string;
}

const Dashboard: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active'); // active, all, new, preparing, ready, served
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [authState.venue?.id]);

  const loadOrders = async () => {
    if (!authState.venue?.id) return;
    
    try {
      const ordersData = await fetchVenueOrders(authState.venue.id, authState.token!);
      setOrders(ordersData.orders);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus, authState.token!);
      
      // Update local state immediately for better UX
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus as any }
            : order
        )
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const filterOrders = (orders: Order[]) => {
    switch (filter) {
      case 'new':
        return orders.filter(order => order.status === 'new');
      case 'preparing':
        return orders.filter(order => order.status === 'preparing');
      case 'ready':
        return orders.filter(order => order.status === 'ready');
      case 'served':
        return orders.filter(order => order.status === 'served');
      case 'active':
        return orders.filter(order => order.status !== 'served');
      default:
        return orders;
    }
  };

  const getOrderCounts = () => {
    return {
      new: orders.filter(o => o.status === 'new').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      served: orders.filter(o => o.status === 'served').length,
      total: orders.length
    };
  };

  if (loading) return <LoadingSpinner />;

  const filteredOrders = filterOrders(orders);
  const counts = getOrderCounts();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {authState.venue?.name}
              </h1>
              <p className="text-sm text-gray-600">
                Order Management Dashboard
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh Orders
              </button>
              
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{counts.new}</div>
            <div className="text-sm text-red-800">New Orders</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{counts.preparing}</div>
            <div className="text-sm text-yellow-800">Preparing</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{counts.ready}</div>
            <div className="text-sm text-green-800">Ready</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{counts.served}</div>
            <div className="text-sm text-gray-800">Served</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
            <div className="text-sm text-blue-800">Total Today</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg">
          {[
            { key: 'active', label: 'Active', count: counts.new + counts.preparing + counts.ready },
            { key: 'new', label: 'New', count: counts.new },
            { key: 'preparing', label: 'Preparing', count: counts.preparing },
            { key: 'ready', label: 'Ready', count: counts.ready },
            { key: 'served', label: 'Served', count: counts.served },
            { key: 'all', label: 'All', count: counts.total }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {filter === 'active' ? 'No active orders' : `No ${filter} orders`}
              </div>
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
              />
            ))
          )}
        </div>

        {/* Last Refresh */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// ============================================================================
// COMPONENTS
// ============================================================================

// components/OrderCard.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    tableNumber: string;
    customerName: string;
    items: any[];
    totalAmount: number;
    status: 'new' | 'preparing' | 'ready' | 'served';
    createdAt: string;
    specialInstructions?: string;
  };
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'served': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'new': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      default: return null;
    }
  };

  const getStatusButton = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return null;

    const buttonText = {
      preparing: 'Start Preparing',
      ready: 'Mark Ready',
      served: 'Mark Served'
    }[nextStatus];

    const buttonColor = {
      preparing: 'bg-yellow-600 hover:bg-yellow-700',
      ready: 'bg-green-600 hover:bg-green-700',
      served: 'bg-gray-600 hover:bg-gray-700'
    }[nextStatus];

    return (
      <button
        onClick={() => onStatusUpdate(order.id, nextStatus)}
        className={`px-4 py-2 text-white text-sm font-medium rounded-lg ${buttonColor}`}
      >
        {buttonText}
      </button>
    );
  };

  const orderAge = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Table {order.tableNumber} • {order.customerName} • {orderAge}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold">€{order.totalAmount.toFixed(2)}</div>
          {getStatusButton(order.status)}
        </div>
      </div>

      {/* Order Items */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">Items:</h4>
        <div className="space-y-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span>€{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-2 text-orange-800">Special Instructions:</h4>
          <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded">
            {order.specialInstructions}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderCard;

// components/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuth();

  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

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
// SERVICES
// ============================================================================

// services/auth.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkamlu7ta-e-europe-west1.cloudfunctions.net/api';

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

export const getCurrentUser = async (token: string) => {
  // For now, we'll decode the token client-side
  // In production, you might want a dedicated /me endpoint
  return JSON.parse(atob(token.split('.')[1]));
};

// services/orders.ts
export const fetchVenueOrders = async (venueId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/venue/${venueId}/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
};

export const updateOrderStatus = async (orderId: string, status: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update order status');
  }

  return response.json();
};

export const fetchOrder = async (orderId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  return response.json();
};