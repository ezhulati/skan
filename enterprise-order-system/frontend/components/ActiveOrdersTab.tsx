import React, { useState } from 'react';
import { Order } from '../services/enterpriseOrderService';

interface ActiveOrderCounts {
    new: number;
    preparing: number;
    ready: number;
    total: number;
}

interface ActiveOrdersTabProps {
    orders: Order[];
    counts: ActiveOrderCounts;
    onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
    loading: boolean;
}

const ActiveOrdersTab: React.FC<ActiveOrdersTabProps> = ({
    orders,
    counts,
    onUpdateStatus,
    loading
}) => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'tableNumber'>('createdAt');
    const [updating, setUpdating] = useState<string | null>(null);

    // Filter orders by status
    const filteredOrders = orders.filter(order => {
        if (statusFilter === 'all') return true;
        return order.status === statusFilter;
    });

    // Sort orders
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === 'createdAt') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
            return a.tableNumber.localeCompare(b.tableNumber);
        }
    });

    // Handle status update
    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            await onUpdateStatus(orderId, newStatus);
        } catch (error) {
            console.error('Failed to update order status:', error);
        } finally {
            setUpdating(null);
        }
    };

    // Get next status for order
    const getNextStatus = (currentStatus: string): string | null => {
        const statusFlow = {
            'new': 'preparing',
            'preparing': 'ready',
            'ready': 'served'
        };
        return statusFlow[currentStatus as keyof typeof statusFlow] || null;
    };

    // Get status badge color
    const getStatusBadgeColor = (status: string): string => {
        const colors = {
            'new': 'bg-red-100 text-red-800',
            'preparing': 'bg-yellow-100 text-yellow-800',
            'ready': 'bg-green-100 text-green-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    // Get order timing info
    const getOrderTiming = (order: Order): string => {
        const now = new Date();
        const created = new Date(order.createdAt);
        const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const hours = Math.floor(diffMinutes / 60);
        return `${hours}h ${diffMinutes % 60}m ago`;
    };

    // Get urgency level based on time elapsed
    const getUrgencyLevel = (order: Order): 'normal' | 'urgent' | 'critical' => {
        const now = new Date();
        const created = new Date(order.createdAt);
        const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
        
        if (order.status === 'new' && diffMinutes > 10) return 'urgent';
        if (order.status === 'preparing' && diffMinutes > 30) return 'urgent';
        if (order.status === 'ready' && diffMinutes > 15) return 'critical';
        if (diffMinutes > 45) return 'critical';
        
        return 'normal';
    };

    return (
        <div className="space-y-6">
            {/* Header with counts and filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Active Orders</h2>
                    {loading && (
                        <div className="flex items-center space-x-2 text-blue-600">
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm">Refreshing...</span>
                        </div>
                    )}
                </div>

                {/* Status count cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{counts.new}</div>
                        <div className="text-sm text-red-700">New Orders</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{counts.preparing}</div>
                        <div className="text-sm text-yellow-700">Preparing</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{counts.ready}</div>
                        <div className="text-sm text-green-700">Ready</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
                        <div className="text-sm text-blue-700">Total Active</div>
                    </div>
                </div>

                {/* Filters and sorting */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All ({counts.total})</option>
                                <option value="new">New ({counts.new})</option>
                                <option value="preparing">Preparing ({counts.preparing})</option>
                                <option value="ready">Ready ({counts.ready})</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mr-2">Sort:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'tableNumber')}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="createdAt">Order Time</option>
                                <option value="tableNumber">Table Number</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders list */}
            <div className="space-y-4">
                {sortedOrders.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                        <p className="text-gray-600">
                            {statusFilter === 'all' 
                                ? 'There are no active orders right now.' 
                                : `No orders with status "${statusFilter}".`}
                        </p>
                    </div>
                ) : (
                    sortedOrders.map((order) => {
                        const urgency = getUrgencyLevel(order);
                        const nextStatus = getNextStatus(order.status);
                        const isUpdating = updating === order.id;

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-lg shadow-sm border-l-4 ${
                                    urgency === 'critical' ? 'border-red-500' :
                                    urgency === 'urgent' ? 'border-yellow-500' :
                                    'border-gray-200'
                                } p-6 hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Order header */}
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {order.orderNumber}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                            {urgency !== 'normal' && (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {urgency === 'critical' ? '🚨 Critical' : '⚠️ Urgent'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Order details */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Table</p>
                                                <p className="font-medium text-gray-900">{order.tableNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Customer</p>
                                                <p className="font-medium text-gray-900">{order.customerName || 'No name'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Total</p>
                                                <p className="font-medium text-gray-900">€{order.totalAmount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Time</p>
                                                <p className="font-medium text-gray-900">{getOrderTiming(order)}</p>
                                            </div>
                                        </div>

                                        {/* Order items */}
                                        <div className="border-t border-gray-200 pt-3">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Items ({order.items.length})</p>
                                            <div className="space-y-1">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {item.quantity}x {item.name}
                                                        </span>
                                                        <span className="font-medium text-gray-900">
                                                            €{(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Special instructions */}
                                        {order.specialInstructions && (
                                            <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                                                <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions:</p>
                                                <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="ml-6 flex flex-col space-y-2">
                                        {nextStatus && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, nextStatus)}
                                                disabled={isUpdating}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                    nextStatus === 'preparing' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                                                    nextStatus === 'ready' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                                    nextStatus === 'served' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                                                    'bg-gray-600 hover:bg-gray-700 text-white'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isUpdating ? (
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        <span>Updating...</span>
                                                    </div>
                                                ) : (
                                                    `Mark as ${nextStatus}`
                                                )}
                                            </button>
                                        )}
                                        
                                        <button
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ActiveOrdersTab;