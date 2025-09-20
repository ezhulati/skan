import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { VenueProvider, useVenue } from './contexts/VenueContext';
import { CartProvider } from './contexts/CartContext';
import { QRLanding } from './pages/QRLanding';
import { Menu } from './pages/Menu';
import { Cart } from './pages/Cart';
import { Confirmation } from './pages/Confirmation';
import { OrderTracking } from './pages/OrderTracking';
import { CompactLanguagePicker } from './components/LanguagePicker';
import ScrollToTop from './components/ScrollToTop';
import { api } from './services/api';
import { OrderTracking as OrderTrackingType } from './types';
import { formatPrice } from './utils/currency';
import './index.css';

function VenueRoutes() {
  return (
    <Routes>
      <Route path="/track/:orderNumber" element={<PublicOrderTracking />} />
      <Route path="/:venueSlug/:tableNumber" element={<QRLandingWithContext />} />
      <Route path="/:venueSlug/:tableNumber/menu" element={<MenuWithContext />} />
      <Route path="/:venueSlug/:tableNumber/cart" element={<CartWithContext />} />
      <Route path="/:venueSlug/:tableNumber/confirmation" element={<ConfirmationWithContext />} />
      <Route path="/:venueSlug/:tableNumber/track/:orderNumber" element={<OrderTrackingWithContext />} />
      <Route path="/" element={<Navigate to="/help" replace />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/offline" element={<OfflinePage />} />
    </Routes>
  );
}

function QRLandingWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <QRLanding />
    </VenueProvider>
  );
}

function MenuWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <Menu />
    </VenueProvider>
  );
}

function CartWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <Cart />
    </VenueProvider>
  );
}


function ConfirmationWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <Confirmation />
    </VenueProvider>
  );
}

function OrderTrackingWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <OrderTracking />
    </VenueProvider>
  );
}

function PublicOrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { t, language } = useLanguage();
  const { venue } = useVenue();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<OrderTrackingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const getStatusConfig = () => ({
    new: {
      label: t('order_received'),
      description: t('order_received_desc'),
      icon: '📝',
      color: 'blue',
      progress: 25
    },
    preparing: {
      label: t('preparing'),
      description: t('preparing_desc'),
      icon: '👨‍🍳',
      color: 'yellow',
      progress: 50
    },
    ready: {
      label: t('ready'),
      description: t('ready_desc'),
      icon: '🔔',
      color: 'green',
      progress: 75
    },
    served: {
      label: t('served'),
      description: t('served_desc'),
      icon: '✅',
      color: 'green',
      progress: 100
    }
  });

  const fetchOrderStatus = useCallback(async () => {
    if (!orderNumber) {
      setError('Order number not provided');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const orderData = await api.trackOrder(orderNumber);
      setOrder(orderData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching order status:', error);
      setError(error instanceof Error ? error.message : 'Failed to load order status');
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrderStatus();
  }, [orderNumber, fetchOrderStatus]);

  // Auto-refresh order status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (order && order.status !== 'served') {
        fetchOrderStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [order, fetchOrderStatus]);

  const handleBackToHome = () => {
    navigate('/help');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchOrderStatus();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (status: string) => {
    const statusConfig = getStatusConfig();
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.progress || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading_order_status')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToHome}
                className="text-primary-600 hover:text-primary-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('back')}
              </button>
              <h1 className="text-lg font-semibold text-gray-900">{t('order_status')}</h1>
              <div className="w-16"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">{t('unable_to_load_order')}</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {t('try_again')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('order_not_found')}</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig();
  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 relative">
          <div className="absolute top-4 right-4">
            <CompactLanguagePicker />
          </div>
          <div className="flex items-center justify-between pr-20">
            <button
              onClick={handleBackToHome}
              className="text-primary-600 hover:text-primary-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{t('order_status')}</h1>
            <button
              onClick={handleRefresh}
              className="text-primary-600 hover:text-primary-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Order Status Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-2">{currentStatus.icon}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {currentStatus.label}
            </h2>
            <p className="text-gray-600 mb-4">
              {currentStatus.description}
            </p>
            
            <div className="text-sm text-gray-500 mb-4">
              Order: <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  currentStatus.color === 'blue' ? 'bg-blue-600' :
                  currentStatus.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-green-600'
                }`}
                style={{ width: `${getProgressPercentage(order.status)}%` }}
              ></div>
            </div>

            <div className="text-sm text-gray-600">
              {t('progress_complete').replace('{percent}', getProgressPercentage(order.status).toString())}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('order_details')}</h3>
          
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {language === 'sq' && item.nameAlbanian ? item.nameAlbanian : item.name}
                  </div>
                  {language === 'en' && item.nameAlbanian && item.nameAlbanian !== item.name && (
                    <div className="text-sm text-gray-600 italic">{item.nameAlbanian}</div>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <div className="font-medium text-gray-900">
                    {item.quantity}x {formatPrice(item.price, venue?.settings?.currency)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatPrice(item.quantity * item.price, venue?.settings?.currency)}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatPrice(order.totalAmount, venue?.settings?.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('timing')}</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('order_placed')}</span>
              <span className="font-medium text-gray-900">{formatTime(order.createdAt)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">{t('estimated_ready_time')}</span>
              <span className="font-medium text-gray-900">{order.estimatedTime}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">{t('last_updated')}</span>
              <span className="font-medium text-gray-900">{formatTime(lastUpdated.toISOString())}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRefresh}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('refresh_status')}
        </button>
      </div>
    </div>
  );
}

function HelpPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        {/* Language picker in top right */}
        <div className="absolute top-4 right-4">
          <CompactLanguagePicker />
        </div>
        
        <div className="text-primary-600 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Skan.al {t('help')}</h1>
        <div className="space-y-4 text-left">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">{t('how_to_order')}</h2>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>{t('scan_qr')}</li>
              <li>{t('browse_menu')}</li>
              <li>{t('review_order')}</li>
              <li>{t('wait_preparation')}</li>
            </ol>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">{t('need_help')}</h2>
            <p className="text-sm text-gray-600">
              {t('ask_staff')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="text-gray-400 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v20M2 12h20" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">You're offline</h1>
        <p className="text-gray-600 mb-6">
          Please check your internet connection and try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg min-h-[48px]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <VenueRoutes />
        </Router>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;