import React, { useState, useEffect, useRef } from 'react';
import { enterpriseOrderService, Order } from '../services/enterpriseOrderService';

interface OrderSearchModalProps {
    venueId?: string;
    onClose: () => void;
}

const OrderSearchModal: React.FC<OrderSearchModalProps> = ({
    venueId,
    onClose
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Focus search input when modal opens
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                performSearch(searchQuery.trim());
            } else {
                setSearchResults([]);
                setError(null);
            }
        }, 300);

        return () => clearTimeout(delayedSearch);
    }, [searchQuery]);

    // Perform search
    const performSearch = async (query: string) => {
        if (!venueId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await enterpriseOrderService.searchOrders(venueId, query, 1, 20);
            setSearchResults(response.data);
        } catch (err) {
            console.error('Search failed:', err);
            setError('Search failed. Please try again.');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle escape key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (selectedOrder) {
                setSelectedOrder(null);
            } else {
                onClose();
            }
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
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

    // Get search suggestions
    const getSearchSuggestions = (): string[] => {
        return [
            'Order number (e.g., SKN-20250120-001)',
            'Customer name',
            'Table number (e.g., T01, A5)',
            'Date (e.g., 2025-01-20)',
        ];
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onKeyDown={handleKeyDown}>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="flex min-h-full items-start justify-center p-4 sm:p-0">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mt-8 mb-8 overflow-hidden">
                    {!selectedOrder ? (
                        <>
                            {/* Search Header */}
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Search Orders</h2>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Search Input */}
                                <div className="relative">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search by order number, customer name, table number..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {loading && (
                                        <svg className="w-5 h-5 text-blue-500 absolute right-3 top-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    )}
                                </div>

                                {/* Search Tips */}
                                {searchQuery.length === 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Search tips:</p>
                                        <ul className="text-sm text-gray-500 space-y-1">
                                            {getSearchSuggestions().map((tip, index) => (
                                                <li key={index} className="flex items-center space-x-2">
                                                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Search Results */}
                            <div className="max-h-96 overflow-y-auto">
                                {error && (
                                    <div className="p-6 text-center">
                                        <div className="text-red-600 mb-2">
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-red-600">{error}</p>
                                    </div>
                                )}

                                {searchQuery.length >= 2 && !loading && !error && searchResults.length === 0 && (
                                    <div className="p-6 text-center">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600">No orders found for "{searchQuery}"</p>
                                        <p className="text-sm text-gray-500 mt-1">Try a different search term or check the spelling</p>
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="divide-y divide-gray-200">
                                        {searchResults.map((order) => (
                                            <div
                                                key={order.id}
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <h3 className="font-medium text-gray-900">{order.orderNumber}</h3>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                            <div>
                                                                <span className="font-medium">Table:</span> {order.tableNumber}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Customer:</span> {order.customerName || 'No name'}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Items:</span> {order.items.length} items
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Total:</span> €{order.totalAmount.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-sm text-gray-500">
                                                        <div>{formatDate(order.createdAt)}</div>
                                                        <div className="mt-1">
                                                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Order Details View */
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Order Info */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Order Number</p>
                                        <p className="font-medium text-gray-900">{selectedOrder.orderNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedOrder.status)}`}>
                                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Table</p>
                                        <p className="font-medium text-gray-900">{selectedOrder.tableNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Customer</p>
                                        <p className="font-medium text-gray-900">{selectedOrder.customerName || 'No name'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-6">
                                <h3 className="text-md font-medium text-gray-900 mb-3">Order Items</h3>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <div>
                                                <span className="font-medium text-gray-900">{item.quantity}x {item.name}</span>
                                            </div>
                                            <span className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 text-lg font-semibold">
                                        <span>Total</span>
                                        <span>€{selectedOrder.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Special Instructions */}
                            {selectedOrder.specialInstructions && (
                                <div className="mb-6">
                                    <h3 className="text-md font-medium text-gray-900 mb-2">Special Instructions</h3>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                        <p className="text-sm text-yellow-800">{selectedOrder.specialInstructions}</p>
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <p className="font-medium">Created At</p>
                                    <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                                {selectedOrder.updatedAt && (
                                    <div>
                                        <p className="font-medium">Last Updated</p>
                                        <p>{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderSearchModal;