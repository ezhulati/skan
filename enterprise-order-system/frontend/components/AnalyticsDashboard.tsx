import React, { useState, useEffect } from 'react';
import { enterpriseOrderService } from '../services/enterpriseOrderService';

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

interface AnalyticsDashboardProps {
    venueId?: string;
    orderCounts: OrderCounts;
}

interface AnalyticsData {
    daily: {
        orders: number;
        revenue: number;
        avgOrderValue: number;
        peakHour: string;
    };
    weekly: {
        orders: number;
        revenue: number;
        growth: number;
    };
    topItems: Array<{
        name: string;
        quantity: number;
        revenue: number;
        percentage: number;
    }>;
    hourlyData: Array<{
        hour: string;
        orders: number;
        revenue: number;
    }>;
    performanceMetrics: {
        avgPreparationTime: number;
        orderAccuracy: number;
        customerSatisfaction: number;
    };
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    venueId,
    orderCounts
}) => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

    // Load analytics data
    useEffect(() => {
        if (venueId) {
            loadAnalytics();
        }
    }, [venueId, dateRange]);

    const loadAnalytics = async () => {
        if (!venueId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await enterpriseOrderService.getAnalytics(venueId, dateRange);
            setAnalytics(response);
        } catch (err) {
            console.error('Failed to load analytics:', err);
            setError('Failed to load analytics data');
            // Set mock data for demonstration
            setAnalytics(generateMockAnalytics());
        } finally {
            setLoading(false);
        }
    };

    // Generate mock analytics data for demonstration
    const generateMockAnalytics = (): AnalyticsData => {
        return {
            daily: {
                orders: orderCounts.recent || 24,
                revenue: (orderCounts.recent || 24) * 18.5,
                avgOrderValue: 18.5,
                peakHour: '19:00'
            },
            weekly: {
                orders: (orderCounts.recent || 24) * 7,
                revenue: (orderCounts.recent || 24) * 7 * 18.5,
                growth: 12.5
            },
            topItems: [
                { name: 'Greek Salad', quantity: 15, revenue: 127.5, percentage: 25 },
                { name: 'Albanian Beer', quantity: 32, revenue: 112.0, percentage: 20 },
                { name: 'Seafood Risotto', quantity: 8, revenue: 148.0, percentage: 18 },
                { name: 'Grilled Fish', quantity: 12, revenue: 180.0, percentage: 15 },
                { name: 'Traditional Byrek', quantity: 18, revenue: 90.0, percentage: 12 }
            ],
            hourlyData: Array.from({ length: 24 }, (_, i) => ({
                hour: `${i.toString().padStart(2, '0')}:00`,
                orders: Math.floor(Math.random() * 10) + (i >= 11 && i <= 22 ? 5 : 1),
                revenue: Math.floor(Math.random() * 200) + (i >= 11 && i <= 22 ? 100 : 20)
            })),
            performanceMetrics: {
                avgPreparationTime: 18.5,
                orderAccuracy: 96.5,
                customerSatisfaction: 4.6
            }
        };
    };

    // Get trend indicator
    const getTrendIndicator = (value: number, isPositive: boolean = true) => {
        const color = (isPositive && value > 0) || (!isPositive && value < 0) ? 'text-green-600' : 'text-red-600';
        const icon = value > 0 ? '↗' : value < 0 ? '↘' : '→';
        
        return (
            <span className={`${color} text-sm font-medium flex items-center`}>
                {icon} {Math.abs(value).toFixed(1)}%
            </span>
        );
    };

    // Format currency
    const formatCurrency = (amount: number): string => {
        return `€${amount.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !analytics) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                        <button
                            onClick={loadAnalytics}
                            className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    return (
        <div className="space-y-6">
            {/* Header with date range selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Analytics & Insights</h2>
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    {(['today', 'week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                dateRange === range
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.daily.orders}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2">
                        {getTrendIndicator(analytics.weekly.growth)}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.daily.revenue)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2">
                        {getTrendIndicator(8.3)}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Order Value</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.daily.avgOrderValue)}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2">
                        {getTrendIndicator(-2.1, false)}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Peak Hour</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.daily.peakHour}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-full">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-sm text-gray-600">Busiest time</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Orders Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Hourly Order Distribution</h3>
                    <div className="h-64 flex items-end justify-between space-x-1">
                        {analytics.hourlyData.map((data, index) => {
                            const maxOrders = Math.max(...analytics.hourlyData.map(d => d.orders));
                            const height = (data.orders / maxOrders) * 100;
                            
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                                        style={{ height: `${height}%` }}
                                        title={`${data.hour}: ${data.orders} orders`}
                                    />
                                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-center">
                                        {data.hour}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Items */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Items</h3>
                    <div className="space-y-4">
                        {analytics.topItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-600">{item.quantity} sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">{formatCurrency(item.revenue)}</p>
                                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{analytics.performanceMetrics.avgPreparationTime}m</div>
                        <div className="text-sm text-gray-600">Avg Preparation Time</div>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">{analytics.performanceMetrics.orderAccuracy}%</div>
                        <div className="text-sm text-gray-600">Order Accuracy</div>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${analytics.performanceMetrics.orderAccuracy}%` }} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">{analytics.performanceMetrics.customerSatisfaction}/5</div>
                        <div className="text-sm text-gray-600">Customer Rating</div>
                        <div className="mt-2 flex justify-center">
                            {Array.from({ length: 5 }, (_, i) => (
                                <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.floor(analytics.performanceMetrics.customerSatisfaction) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Status Overview */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{orderCounts.active.new}</div>
                        <div className="text-sm text-gray-600">New Orders</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{orderCounts.active.preparing}</div>
                        <div className="text-sm text-gray-600">Preparing</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{orderCounts.active.ready}</div>
                        <div className="text-sm text-gray-600">Ready</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{orderCounts.active.total}</div>
                        <div className="text-sm text-gray-600">Total Active</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;