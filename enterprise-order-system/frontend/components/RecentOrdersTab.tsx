import React, { useState, useEffect, useCallback } from 'react';
import { enterpriseOrderService, Order, OrderListResponse } from '../services/enterpriseOrderService';

interface RecentOrdersTabProps {
    venueId?: string;
    initialOrders?: Order[];
}

interface DailyAnalytics {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    peakHour: string;
    topItems: Array<{
        name: string;
        quantity: number;
        revenue: number;
    }>;
}

const RecentOrdersTab: React.FC<RecentOrdersTabProps> = ({
    venueId,
    initialOrders = []
}) => {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'servedAt' | 'totalAmount' | 'tableNumber'>('servedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const itemsPerPage = 20;

    // Load recent orders
    const loadRecentOrders = useCallback(async (page: number = 1, search: string = '') => {
        if (!venueId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await enterpriseOrderService.getRecentOrders(
                venueId,
                page,
                itemsPerPage,
                search
            );

            setOrders(response.data);
            setCurrentPage(response.pagination.page);
            setTotalPages(response.pagination.totalPages);
            setTotalOrders(response.pagination.total);

            // Calculate analytics
            if (response.analytics) {
                setAnalytics({
                    totalOrders: response.analytics.totalOrders,
                    totalRevenue: response.analytics.totalRevenue,
                    averageOrderValue: response.analytics.averageOrderValue,
                    peakHour: response.analytics.peakHour || 'N/A',
                    topItems: response.analytics.topItems || []
                });
            }

        } catch (err) {
            console.error('Error loading recent orders:', err);
            setError('Failed to load recent orders');
        } finally {
            setLoading(false);
        }
    }, [venueId, itemsPerPage]);

    // Initial load
    useEffect(() => {
        if (venueId && initialOrders.length === 0) {
            loadRecentOrders(1, searchQuery);
        } else if (initialOrders.length > 0) {
            // Calculate analytics from initial orders
            calculateAnalytics(initialOrders);
        }
    }, [venueId, loadRecentOrders, searchQuery, initialOrders]);

    // Calculate analytics from orders
    const calculateAnalytics = (orderList: Order[]) => {
        if (orderList.length === 0) {
            setAnalytics(null);
            return;
        }

        const totalRevenue = orderList.reduce((sum, order) => sum + order.totalAmount, 0);
        const avgOrderValue = totalRevenue / orderList.length;

        // Calculate peak hour
        const hourCounts: { [hour: string]: number } = {};
        orderList.forEach(order => {
            if (order.servedAt) {
                const hour = new Date(order.servedAt).getHours();
                const hourKey = `${hour.toString().padStart(2, '0')}:00`;
                hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
            }
        });

        const peakHour = Object.entries(hourCounts).reduce((peak, [hour, count]) => 
            count > peak.count ? { hour, count } : peak, { hour: 'N/A', count: 0 }
        ).hour;

        // Calculate top items
        const itemCounts: { [itemName: string]: { quantity: number; revenue: number } } = {};
        orderList.forEach(order => {
            order.items.forEach(item => {
                if (!itemCounts[item.name]) {
                    itemCounts[item.name] = { quantity: 0, revenue: 0 };
                }
                itemCounts[item.name].quantity += item.quantity;
                itemCounts[item.name].revenue += item.price * item.quantity;
            });
        });

        const topItems = Object.entries(itemCounts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        setAnalytics({
            totalOrders: orderList.length,
            totalRevenue,
            averageOrderValue: avgOrderValue,
            peakHour,
            topItems
        });
    };

    // Handle search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
        loadRecentOrders(1, query);
    }, [loadRecentOrders]);

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadRecentOrders(page, searchQuery);
    };

    // Filter and sort orders
    const filteredOrders = orders.filter(order => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            order.orderNumber.toLowerCase().includes(query) ||
            order.customerName?.toLowerCase().includes(query) ||
            order.tableNumber.toLowerCase().includes(query)
        );
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
            case 'servedAt':
                aValue = new Date(a.servedAt || a.updatedAt).getTime();
                bValue = new Date(b.servedAt || b.updatedAt).getTime();
                break;
            case 'totalAmount':
                aValue = a.totalAmount;
                bValue = b.totalAmount;
                break;
            case 'tableNumber':
                aValue = a.tableNumber;
                bValue = b.tableNumber;
                break;
            default:
                return 0;
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Format time
    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get time since served
    const getTimeSinceServed = (servedAt: string): string => {
        const now = new Date();
        const served = new Date(servedAt);
        const diffMinutes = Math.floor((now.getTime() - served.getTime()) / (1000 * 60));
        
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const hours = Math.floor(diffMinutes / 60);
        return `${hours}h ${diffMinutes % 60}m ago`;
    };

    return (
        <div className="space-y-6">
            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">{analytics.totalOrders}</div>
                        <div className="text-sm text-gray-600">Orders Today</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">€{analytics.totalRevenue.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">€{analytics.averageOrderValue.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Avg Order Value</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-orange-600">{analytics.peakHour}</div>
                        <div className="text-sm text-gray-600">Peak Hour</div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders (Last 24h)</h2>
                    {loading && (
                        <div className="flex items-center space-x-2 text-blue-600">
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm">Loading...</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Sort by */}
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="servedAt">Served Time</option>
                                <option value="totalAmount">Amount</option>
                                <option value="tableNumber">Table</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <svg className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Pagination info */}
                    <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} orders
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error loading recent orders</h3>
                            <p className="mt-1 text-sm text-red-700">{error}</p>
                            <button
                                onClick={() => loadRecentOrders(currentPage, searchQuery)}
                                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {sortedOrders.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-600">
                            {searchQuery ? `No orders matching "${searchQuery}"` : 'No orders served in the last 24 hours.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Served</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                                                <div className="text-sm text-gray-500">{getTimeSinceServed(order.servedAt || order.updatedAt)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.tableNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.customerName || 'No name'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.items.length} items
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            €{order.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatTime(order.servedAt || order.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalOrders)}</span> of{' '}
                                <span className="font-medium">{totalOrders}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                page === currentPage
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Items Analytics */}
            {analytics && analytics.topItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Items Today</h3>
                    <div className="space-y-3">
                        {analytics.topItems.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>{item.quantity} sold</span>
                                    <span className="font-medium text-gray-900">€{item.revenue.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentOrdersTab;