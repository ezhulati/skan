import React, { useState, useEffect, useCallback } from 'react';
import { enterpriseOrderService, Order, OrderListResponse } from '../services/enterpriseOrderService';

interface HistoricalOrdersTabProps {
    venueId?: string;
}

interface DateRange {
    start: string;
    end: string;
}

interface FilterState {
    dateRange: DateRange;
    customerName: string;
    tableNumber: string;
    orderNumber: string;
    minAmount: string;
    maxAmount: string;
    status: string;
}

const HistoricalOrdersTab: React.FC<HistoricalOrdersTabProps> = ({ venueId }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const itemsPerPage = 50;

    // Filter state
    const [filters, setFilters] = useState<FilterState>({
        dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
            end: new Date().toISOString().split('T')[0] // today
        },
        customerName: '',
        tableNumber: '',
        orderNumber: '',
        minAmount: '',
        maxAmount: '',
        status: 'all'
    });

    const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'customerName'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Load historical orders
    const loadHistoricalOrders = useCallback(async (
        page: number = 1,
        filterParams: FilterState = filters
    ) => {
        if (!venueId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await enterpriseOrderService.getHistoricalOrders(
                venueId,
                page,
                itemsPerPage,
                {
                    dateStart: filterParams.dateRange.start,
                    dateEnd: filterParams.dateRange.end,
                    customerName: filterParams.customerName || undefined,
                    tableNumber: filterParams.tableNumber || undefined,
                    orderNumber: filterParams.orderNumber || undefined,
                    minAmount: filterParams.minAmount ? parseFloat(filterParams.minAmount) : undefined,
                    maxAmount: filterParams.maxAmount ? parseFloat(filterParams.maxAmount) : undefined,
                    status: filterParams.status !== 'all' ? filterParams.status : undefined,
                    sortBy,
                    sortOrder
                }
            );

            setOrders(response.data);
            setCurrentPage(response.pagination.page);
            setTotalPages(response.pagination.totalPages);
            setTotalOrders(response.pagination.total);

        } catch (err) {
            console.error('Error loading historical orders:', err);
            setError('Failed to load historical orders');
        } finally {
            setLoading(false);
        }
    }, [venueId, sortBy, sortOrder, itemsPerPage]);

    // Initial load
    useEffect(() => {
        if (venueId) {
            loadHistoricalOrders(1, filters);
        }
    }, [venueId, loadHistoricalOrders]);

    // Handle filter change
    const handleFilterChange = (field: keyof FilterState, value: string | DateRange) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        setCurrentPage(1);
        loadHistoricalOrders(1, newFilters);
    };

    // Handle date range change
    const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
        const newDateRange = { ...filters.dateRange, [field]: value };
        handleFilterChange('dateRange', newDateRange);
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadHistoricalOrders(page, filters);
    };

    // Clear all filters
    const clearFilters = () => {
        const defaultFilters: FilterState = {
            dateRange: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
            },
            customerName: '',
            tableNumber: '',
            orderNumber: '',
            minAmount: '',
            maxAmount: '',
            status: 'all'
        };
        setFilters(defaultFilters);
        setCurrentPage(1);
        loadHistoricalOrders(1, defaultFilters);
    };

    // Handle export
    const handleExport = async (format: 'csv' | 'excel') => {
        if (!venueId) return;

        setExportLoading(true);
        try {
            const response = await enterpriseOrderService.exportOrders(venueId, {
                format,
                dateStart: filters.dateRange.start,
                dateEnd: filters.dateRange.end,
                customerName: filters.customerName || undefined,
                tableNumber: filters.tableNumber || undefined,
                orderNumber: filters.orderNumber || undefined,
                minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
                maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
                status: filters.status !== 'all' ? filters.status : undefined
            });

            // Create download link
            const blob = new Blob([response], { 
                type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `orders_${filters.dateRange.start}_to_${filters.dateRange.end}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Export failed:', err);
            setError('Failed to export orders');
        } finally {
            setExportLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge color
    const getStatusBadgeColor = (status: string): string => {
        const colors = {
            'new': 'bg-red-100 text-red-800',
            'preparing': 'bg-yellow-100 text-yellow-800',
            'ready': 'bg-green-100 text-green-800',
            'served': 'bg-blue-100 text-blue-800',
            'cancelled': 'bg-gray-100 text-gray-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Advanced Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Historical Orders</h2>
                    <div className="flex items-center space-x-2">
                        {exportLoading ? (
                            <div className="flex items-center space-x-2 text-blue-600">
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-sm">Exporting...</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Export Excel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.dateRange.start}
                            onChange={(e) => handleDateRangeChange('start', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.dateRange.end}
                            onChange={(e) => handleDateRangeChange('end', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                        <input
                            type="text"
                            placeholder="SKN-20250120-001"
                            value={filters.orderNumber}
                            onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="served">Served</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="ready">Ready</option>
                            <option value="preparing">Preparing</option>
                            <option value="new">New</option>
                        </select>
                    </div>
                </div>

                {/* Additional Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                        <input
                            type="text"
                            placeholder="Enter customer name"
                            value={filters.customerName}
                            onChange={(e) => handleFilterChange('customerName', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                        <input
                            type="text"
                            placeholder="T01, A5, etc."
                            value={filters.tableNumber}
                            onChange={(e) => handleFilterChange('tableNumber', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (€)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            value={filters.minAmount}
                            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (€)</label>
                        <input
                            type="number"
                            placeholder="1000.00"
                            step="0.01"
                            value={filters.maxAmount}
                            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Sort and Clear */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="createdAt">Order Date</option>
                                <option value="totalAmount">Amount</option>
                                <option value="customerName">Customer</option>
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

                    <button
                        onClick={clearFilters}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error loading historical orders</h3>
                            <p className="mt-1 text-sm text-red-700">{error}</p>
                            <button
                                onClick={() => loadHistoricalOrders(currentPage, filters)}
                                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {!loading && !error && (
                <>
                    {/* Results Summary */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Found <span className="font-medium">{totalOrders}</span> orders from{' '}
                                    <span className="font-medium">{new Date(filters.dateRange.start).toLocaleDateString()}</span> to{' '}
                                    <span className="font-medium">{new Date(filters.dateRange.end).toLocaleDateString()}</span>
                                </p>
                            </div>
                            <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {orders.length === 0 ? (
                            <div className="p-8 text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                                <p className="text-gray-600">Try adjusting your search filters or date range.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
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
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </span>
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
                                            let page: number;
                                            if (totalPages <= 5) {
                                                page = i + 1;
                                            } else if (currentPage <= 3) {
                                                page = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                page = totalPages - 4 + i;
                                            } else {
                                                page = currentPage - 2 + i;
                                            }
                                            
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
                </>
            )}
        </div>
    );
};

export default HistoricalOrdersTab;