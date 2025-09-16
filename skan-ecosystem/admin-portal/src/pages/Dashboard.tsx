import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { OrderCard } from '../components/OrderCard';
import { OrderFilters } from '../components/OrderFilters';
import { Order, OrderStatus } from '../types';
import * as api from '../services/api';

export function Dashboard() {
  const { user, venue } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderCounts = {
    all: orders.length,
    new: orders.filter(order => order.status === 'new').length,
    preparing: orders.filter(order => order.status === 'preparing').length,
    ready: orders.filter(order => order.status === 'ready').length,
    served: orders.filter(order => order.status === 'served').length,
  };

  useEffect(() => {
    if (venue?.id) {
      loadOrders();
      
      // Set up polling for real-time updates
      const interval = setInterval(loadOrders, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [venue?.id]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === activeFilter));
    }
  }, [orders, activeFilter]);

  const loadOrders = async () => {
    if (!venue?.id) return;

    try {
      setError(null);
      const response = await api.getOrders(venue.id, activeFilter === 'all' ? undefined : activeFilter);
      setOrders(response.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      
      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleFilterChange = (filter: OrderStatus | 'all') => {
    setActiveFilter(filter);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {user?.fullName}
              </h1>
              <p className="text-sm text-gray-600">
                {venue?.name} - Order Management Dashboard
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Role: {user?.role}</p>
              <p className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Filters */}
        <OrderFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          orderCounts={orderCounts}
        />

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeFilter === 'all' 
                ? 'No orders have been placed yet.'
                : `No ${activeFilter} orders at the moment.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{orderCounts.new}</div>
              <div className="text-sm text-gray-500">New Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{orderCounts.preparing}</div>
              <div className="text-sm text-gray-500">Preparing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{orderCounts.ready}</div>
              <div className="text-sm text-gray-500">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{orderCounts.served}</div>
              <div className="text-sm text-gray-500">Served</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}