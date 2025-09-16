import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import * as api from '../services/api';

export function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setError(null);
      const orderData = await api.getOrder(orderId);
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError('Failed to load order details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      await api.updateOrderStatus(order.id, newStatus);
      setOrder(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null);
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order status. Please try again.');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const progression: Record<OrderStatus, OrderStatus | null> = {
      new: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: null
    };
    return progression[currentStatus];
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels = {
      new: 'New',
      preparing: 'Preparing',
      ready: 'Ready',
      served: 'Served'
    };
    return labels[status];
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested order could not be found.'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/orders')}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-sm text-gray-600">
                  Table {order.tableNumber} • {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              {nextStatus && (
                <button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
                >
                  Mark as {getStatusLabel(nextStatus)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.nameAlbanian && item.nameAlbanian !== item.name && (
                        <p className="text-sm text-gray-600">{item.nameAlbanian}</p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Note:</span> {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-medium text-gray-900">
                        €{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        €{item.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {order.specialInstructions && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">Special Instructions</h4>
                  <p className="text-yellow-700">{order.specialInstructions}</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">€{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Info Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Info</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Table</label>
                  <p className="text-gray-900">Table {order.tableNumber}</p>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                  </div>
                </div>
                
                {order.preparedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Started Preparing</p>
                      <p className="text-xs text-gray-500">{formatTime(order.preparedAt)}</p>
                    </div>
                  </div>
                )}

                {order.readyAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ready for Pickup</p>
                      <p className="text-xs text-gray-500">{formatTime(order.readyAt)}</p>
                    </div>
                  </div>
                )}

                {order.servedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Served</p>
                      <p className="text-xs text-gray-500">{formatTime(order.servedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {order.status !== 'served' && (
                  <button
                    onClick={() => handleStatusUpdate('served')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                  >
                    Mark as Served
                  </button>
                )}
                
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Print Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}