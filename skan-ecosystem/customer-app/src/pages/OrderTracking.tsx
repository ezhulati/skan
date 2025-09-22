import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { OrderTracking as OrderTrackingType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useVenue } from '../contexts/VenueContext';
import { formatPrice } from '../utils/currency';
import { formatCustomerOrderNumber } from '../utils/orderNumber';
// import { CompactLanguagePicker } from '../components/LanguagePicker';

export function OrderTracking() {
  const { venueSlug, tableNumber, orderNumber } = useParams<{
    venueSlug: string;
    tableNumber: string;
    orderNumber: string;
  }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { venue } = useVenue();
  
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

  const fetchOrderStatus = async () => {
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
  };

  useEffect(() => {
    fetchOrderStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  // Auto-refresh order status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (order && order.status !== 'served') {
        fetchOrderStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const handleBackToMenu = () => {
    // Scroll to top immediately before navigation
    window.scrollTo({ top: 0, left: 0 });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    navigate(`/${venueSlug}/${tableNumber}/menu`);
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
                onClick={handleBackToMenu}
                className="text-primary-600 hover:text-primary-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('back_to_menu')}
              </button>
              <h1 className="text-lg font-semibold text-gray-900">{t('order_status')}</h1>
              <div className="w-20"></div>
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
              <button
                onClick={handleBackToMenu}
                className="block bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {t('back_to_menu')}
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
            {/* <CompactLanguagePicker /> */}
          </div>
          <div className="flex items-center justify-between pr-20">
            <button
              onClick={handleBackToMenu}
              className="text-primary-600 hover:text-primary-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('back_to_menu')}
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
              Order: <span className="font-mono font-semibold text-gray-900">{formatCustomerOrderNumber(order.orderNumber)}</span>
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

        {/* Status Timeline */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('order_timeline')}</h3>
          
          <div className="space-y-4">
            {Object.entries(getStatusConfig()).map(([status, config], index) => {
              const typedConfig = config as { label: string; description: string; icon: string; color: string; progress: number };
              const isCompleted = getProgressPercentage(order.status) > typedConfig.progress - 25;
              const isCurrent = order.status === status;
              
              return (
                <div key={status} className="flex items-center">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted 
                      ? isCurrent 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted && !isCurrent ? '✓' : index + 1}
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <div className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                      {typedConfig.label}
                    </div>
                    <div className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                      {typedConfig.description}
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <div className="flex-shrink-0 text-2xl animate-pulse">
                      {typedConfig.icon}
                    </div>
                  )}
                </div>
              );
            })}
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
                  {item.specialInstructions && (
                    <div className="text-sm text-gray-500 italic mt-1">
                      {t('note')}: {item.specialInstructions}
                    </div>
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

        {/* Auto-refresh Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-700">
                {t('auto_refresh_notice')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {order.status === 'served' ? (
          <button
            onClick={handleBackToMenu}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            {t('order_another_round')}
          </button>
        ) : (
          <button
            onClick={handleRefresh}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('refresh_status')}
          </button>
        )}
      </div>
    </div>
  );
}