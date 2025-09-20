import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { enterpriseOrderService, Order, OrderListResponse } from '../services/enterpriseOrderService';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import ActiveOrdersTab from './components/ActiveOrdersTab';
import RecentOrdersTab from './components/RecentOrdersTab';
import HistoricalOrdersTab from './components/HistoricalOrdersTab';
import OrderSearchModal from './components/OrderSearchModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NotificationCenter from './components/NotificationCenter';
import WelcomeHeader from './components/WelcomeHeader';

// Tab configuration
const TABS = [
    { id: 'active', label: 'Aktive', icon: '🔥', description: 'Orders needing attention' },
    { id: 'recent', label: 'Shërbyer Sot', icon: '✅', description: 'Completed today' },
    { id: 'history', label: 'Historiku', icon: '📋', description: 'Past orders' },
    { id: 'analytics', label: 'Analitika', icon: '📊', description: 'Reports & insights' }
] as const;

type TabId = typeof TABS[number]['id'];

interface OrderCounts {
    active: {
        new: number;
        preparing: number;
        ready: number;
        total: number;
    };
    recent: number;
    total: number;
}

const EnterpriseOrderDashboard: React.FC = () => {
    const { auth } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('active');
    const [orderCounts, setOrderCounts] = useState<OrderCounts>({
        active: { new: 0, preparing: 0, ready: 0, total: 0 },
        recent: 0,
        total: 0
    });
    
    // Data states
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // UI states
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Real-time connection
    const {
        connected,
        notifications,
        clearNotifications,
        connectionStats
    } = useRealtimeOrders(auth.user?.venueId, {
        onOrderCreated: handleNewOrder,
        onOrderStatusChanged: handleOrderStatusChange,
        onOrderUpdated: handleOrderUpdate
    });
    
    // Audio notification
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Initialize dashboard
    useEffect(() => {
        if (auth.user?.venueId) {
            loadInitialData();
            
            // Set up periodic refresh for active orders (every 30 seconds)
            const interval = setInterval(() => {
                if (activeTab === 'active') {
                    refreshActiveOrders();
                }
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [auth.user?.venueId, activeTab]);
    
    // Load initial dashboard data
    const loadInitialData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            await Promise.all([
                loadActiveOrders(),
                loadRecentOrders()
            ]);
        } catch (err) {
            console.error('Error loading initial data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };
    
    // Load active orders (new, preparing, ready)
    const loadActiveOrders = async () => {
        if (!auth.user?.venueId) return;
        
        try {
            const response = await enterpriseOrderService.getActiveOrders(auth.user.venueId);
            setActiveOrders(response.data);
            setOrderCounts(prev => ({
                ...prev,
                active: response.counts
            }));
        } catch (error) {
            console.error('Error loading active orders:', error);
            throw error;
        }
    };
    
    // Load recent served orders (last 24 hours)
    const loadRecentOrders = async () => {
        if (!auth.user?.venueId) return;
        
        try {
            const response = await enterpriseOrderService.getRecentOrders(auth.user.venueId, 1, 50);
            setRecentOrders(response.data);
            setOrderCounts(prev => ({
                ...prev,
                recent: response.analytics.totalOrders
            }));
        } catch (error) {
            console.error('Error loading recent orders:', error);
            throw error;
        }
    };
    
    // Refresh active orders (for manual refresh)
    const refreshActiveOrders = async () => {
        setRefreshing(true);
        try {
            await loadActiveOrders();
        } catch (error) {
            console.error('Error refreshing active orders:', error);
        } finally {
            setRefreshing(false);
        }
    };
    
    // Real-time event handlers
    const handleNewOrder = useCallback((order: Order) => {
        // Add to active orders
        setActiveOrders(prev => [order, ...prev]);
        
        // Update counts
        setOrderCounts(prev => ({
            ...prev,
            active: {
                ...prev.active,
                new: prev.active.new + 1,
                total: prev.active.total + 1
            }
        }));
        
        // Play audio notification
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Flash notification
        document.title = `🔔 New Order - ${document.title.replace('🔔 ', '')}`;
        setTimeout(() => {
            document.title = document.title.replace('🔔 ', '');
        }, 5000);
        
    }, []);
    
    const handleOrderStatusChange = useCallback((orderId: string, oldStatus: string, newStatus: string, order: Order) => {
        if (newStatus === 'served') {
            // Move from active to recent
            setActiveOrders(prev => prev.filter(o => o.id !== orderId));
            setRecentOrders(prev => [order, ...prev.slice(0, 49)]); // Keep last 50
            
            // Update counts
            setOrderCounts(prev => ({
                ...prev,
                active: {
                    ...prev.active,
                    [oldStatus as keyof typeof prev.active]: Math.max(0, prev.active[oldStatus as keyof typeof prev.active] - 1),
                    total: prev.active.total - 1
                },
                recent: prev.recent + 1
            }));
        } else {
            // Update within active orders
            setActiveOrders(prev => prev.map(o => o.id === orderId ? order : o));
            
            // Update status counts
            setOrderCounts(prev => ({
                ...prev,
                active: {
                    ...prev.active,
                    [oldStatus as keyof typeof prev.active]: Math.max(0, prev.active[oldStatus as keyof typeof prev.active] - 1),
                    [newStatus as keyof typeof prev.active]: prev.active[newStatus as keyof typeof prev.active] + 1
                }
            }));
        }
    }, []);
    
    const handleOrderUpdate = useCallback((orderId: string, order: Order) => {
        // Update order in current view
        setActiveOrders(prev => prev.map(o => o.id === orderId ? order : o));
    }, []);
    
    // Optimistic order status update
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        const order = activeOrders.find(o => o.id === orderId);
        if (!order) return;
        
        const oldStatus = order.status;
        
        // Optimistic update
        handleOrderStatusChange(orderId, oldStatus, newStatus, {
            ...order,
            status: newStatus as any,
            updatedAt: new Date().toISOString()
        });
        
        try {
            await enterpriseOrderService.updateOrderStatus(orderId, newStatus);
        } catch (error) {
            // Rollback on error
            handleOrderStatusChange(orderId, newStatus, oldStatus, order);
            throw error;
        }
    };
    
    // Calculate total orders across all statuses
    const totalActiveOrders = orderCounts.active.total;
    const hasActiveOrders = totalActiveOrders > 0;
    
    return (
        <div className=\"enterprise-dashboard min-h-screen bg-gray-50\">
            {/* Header */}
            <div className=\"bg-white border-b border-gray-200 sticky top-0 z-40\">
                <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
                    <div className=\"flex items-center justify-between h-16\">
                        <WelcomeHeader 
                            user={auth.user} 
                            venue={auth.venue}
                            orderCounts={orderCounts}
                        />
                        
                        <div className=\"flex items-center space-x-4\">
                            {/* Connection Status */}
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                                connected 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                    connected ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <span>{connected ? 'Live' : 'Offline'}</span>
                            </div>
                            
                            {/* Notifications */}
                            <button
                                onClick={() => setShowNotifications(true)}
                                className=\"relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors\"
                            >
                                <svg className=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 17h5l-5 5v-5z\" />
                                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M11 19l-4-4\" />
                                </svg>
                                {notifications.length > 0 && (
                                    <span className=\"absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center\">
                                        {notifications.length > 9 ? '9+' : notifications.length}
                                    </span>
                                )}
                            </button>
                            
                            {/* Search */}
                            <button
                                onClick={() => setShowSearch(true)}
                                className=\"p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors\"
                            >
                                <svg className=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\" />
                                </svg>
                            </button>
                            
                            {/* Manual Refresh */}
                            <button
                                onClick={refreshActiveOrders}
                                disabled={refreshing}
                                className=\"p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50\"
                            >
                                <svg className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tab Navigation */}
            <div className=\"bg-white border-b border-gray-200\">
                <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
                    <nav className=\"flex space-x-8\" aria-label=\"Tabs\">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const count = tab.id === 'active' ? totalActiveOrders 
                                        : tab.id === 'recent' ? orderCounts.recent 
                                        : null;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${
                                        isActive
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                                >
                                    <span className=\"text-lg\">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {count !== null && count > 0 && (
                                        <span className={`${
                                            isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        } inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
            
            {/* Main Content */}
            <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6\">
                {loading ? (
                    <div className=\"flex items-center justify-center h-64\">
                        <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600\"></div>
                    </div>
                ) : error ? (
                    <div className=\"bg-red-50 border border-red-200 rounded-md p-4\">
                        <div className=\"flex\">
                            <div className=\"flex-shrink-0\">
                                <svg className=\"h-5 w-5 text-red-400\" viewBox=\"0 0 20 20\" fill=\"currentColor\">
                                    <path fillRule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clipRule=\"evenodd\" />
                                </svg>
                            </div>
                            <div className=\"ml-3\">
                                <h3 className=\"text-sm font-medium text-red-800\">Error loading dashboard</h3>
                                <p className=\"mt-1 text-sm text-red-700\">{error}</p>
                                <button
                                    onClick={loadInitialData}
                                    className=\"mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200\"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tab Content */}
                        {activeTab === 'active' && (
                            <ActiveOrdersTab
                                orders={activeOrders}
                                counts={orderCounts.active}
                                onUpdateStatus={updateOrderStatus}
                                loading={refreshing}
                            />
                        )}
                        
                        {activeTab === 'recent' && (
                            <RecentOrdersTab
                                venueId={auth.user?.venueId}
                                initialOrders={recentOrders}
                            />
                        )}
                        
                        {activeTab === 'history' && (
                            <HistoricalOrdersTab
                                venueId={auth.user?.venueId}
                            />
                        )}
                        
                        {activeTab === 'analytics' && (
                            <AnalyticsDashboard
                                venueId={auth.user?.venueId}
                                orderCounts={orderCounts}
                            />
                        )}
                    </>
                )}
            </div>
            
            {/* Modals */}
            {showSearch && (
                <OrderSearchModal
                    venueId={auth.user?.venueId}
                    onClose={() => setShowSearch(false)}
                />
            )}
            
            {showNotifications && (
                <NotificationCenter
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onClear={clearNotifications}
                />
            )}
            
            {/* Audio element for notifications */}
            <audio
                ref={audioRef}
                preload=\"auto\"
                src=\"/notification-sound.mp3\"
            />
        </div>
    );
};

export default EnterpriseOrderDashboard;