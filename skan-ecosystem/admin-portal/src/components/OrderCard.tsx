import { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

const statusConfig = {
  new: {
    label: 'New',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    nextStatus: 'preparing' as OrderStatus,
    nextLabel: 'Start Preparing'
  },
  preparing: {
    label: 'Preparing',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    nextStatus: 'ready' as OrderStatus,
    nextLabel: 'Mark Ready'
  },
  ready: {
    label: 'Ready',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    nextStatus: 'served' as OrderStatus,
    nextLabel: 'Mark Served'
  },
  served: {
    label: 'Served',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    nextStatus: null,
    nextLabel: null
  }
};

export function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const config = statusConfig[order.status];

  const handleStatusUpdate = async () => {
    if (!config.nextStatus) return;
    
    setIsUpdating(true);
    try {
      await api.updateOrderStatus(order.id, config.nextStatus);
      onStatusUpdate(order.id, config.nextStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {order.orderNumber}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                {config.label}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Table: <span className="font-medium">{order.tableNumber}</span></p>
              <p>Customer: <span className="font-medium">{order.customerName}</span></p>
              <p>Time: <span className="font-medium">{formatTime(order.createdAt)}</span> ({getTimeAgo(order.createdAt)})</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              €{order.totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
          <div className="space-y-1">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                  {item.specialInstructions && (
                    <span className="text-gray-500 italic"> (Note: {item.specialInstructions})</span>
                  )}
                </span>
                <span className="text-gray-900 font-medium">
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {order.specialInstructions && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Special Instructions:</strong> {order.specialInstructions}
            </p>
          </div>
        )}

        {config.nextStatus && (
          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors min-h-[48px] ${
              isUpdating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
            }`}
          >
            {isUpdating ? 'Updating...' : config.nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}