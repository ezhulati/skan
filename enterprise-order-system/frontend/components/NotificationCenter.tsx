import React, { useState } from 'react';

interface Notification {
    id: string;
    type: 'order_created' | 'status_changed' | 'order_updated' | 'system' | 'warning';
    title: string;
    message: string;
    timestamp: string;
    data?: any;
    read?: boolean;
}

interface NotificationCenterProps {
    notifications: Notification[];
    onClose: () => void;
    onClear: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    onClose,
    onClear
}) => {
    const [filter, setFilter] = useState<'all' | 'unread' | 'order_created' | 'status_changed'>('all');

    // Filter notifications based on selected filter
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.read;
        return notification.type === filter;
    });

    // Group notifications by date
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = new Date(notification.timestamp).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notification);
        return groups;
    }, {} as Record<string, Notification[]>);

    // Get notification icon
    const getNotificationIcon = (type: string): JSX.Element => {
        const iconClasses = "w-6 h-6";
        
        switch (type) {
            case 'order_created':
                return (
                    <div className="p-2 bg-green-100 rounded-full">
                        <svg className={`${iconClasses} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                );
            case 'status_changed':
                return (
                    <div className="p-2 bg-blue-100 rounded-full">
                        <svg className={`${iconClasses} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'order_updated':
                return (
                    <div className="p-2 bg-yellow-100 rounded-full">
                        <svg className={`${iconClasses} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="p-2 bg-red-100 rounded-full">
                        <svg className={`${iconClasses} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                );
            case 'system':
            default:
                return (
                    <div className="p-2 bg-gray-100 rounded-full">
                        <svg className={`${iconClasses} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    // Format relative time
    const formatRelativeTime = (timestamp: string): string => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffTime = now.getTime() - time.getTime();
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return time.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get notification priority color
    const getNotificationColor = (type: string, read: boolean): string => {
        const opacity = read ? 'opacity-60' : '';
        
        switch (type) {
            case 'order_created':
                return `border-l-green-500 ${opacity}`;
            case 'status_changed':
                return `border-l-blue-500 ${opacity}`;
            case 'order_updated':
                return `border-l-yellow-500 ${opacity}`;
            case 'warning':
                return `border-l-red-500 ${opacity}`;
            default:
                return `border-l-gray-500 ${opacity}`;
        }
    };

    // Get filter counts
    const filterCounts = {
        all: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        order_created: notifications.filter(n => n.type === 'order_created').length,
        status_changed: notifications.filter(n => n.type === 'status_changed').length
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                            <div className="flex items-center space-x-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={onClear}
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Filter tabs */}
                        <div className="mt-4">
                            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                                {[
                                    { key: 'all', label: 'All', count: filterCounts.all },
                                    { key: 'unread', label: 'Unread', count: filterCounts.unread },
                                    { key: 'order_created', label: 'New Orders', count: filterCounts.order_created },
                                    { key: 'status_changed', label: 'Updates', count: filterCounts.status_changed }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFilter(tab.key as any)}
                                        className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                            filter === tab.key
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                                                filter === tab.key
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notifications list */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M11 19l-4-4" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                                <p className="text-gray-600">
                                    {filter === 'all' 
                                        ? "You're all caught up! No notifications yet." 
                                        : `No ${filter.replace('_', ' ')} notifications.`}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
                                    <div key={date}>
                                        {/* Date header */}
                                        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-sm font-medium text-gray-700">
                                                {new Date(date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </h3>
                                        </div>

                                        {/* Notifications for this date */}
                                        {dayNotifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 border-l-4 ${getNotificationColor(notification.type, !!notification.read)} hover:bg-gray-50 cursor-pointer`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    {getNotificationIcon(notification.type)}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                                                    {notification.title}
                                                                </p>
                                                                <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                                                                    {notification.message}
                                                                </p>
                                                                
                                                                {/* Additional data for order notifications */}
                                                                {(notification.type === 'order_created' || notification.type === 'status_changed') && notification.data && (
                                                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                                                        <div className="flex justify-between">
                                                                            <span>Order: {notification.data.orderNumber}</span>
                                                                            <span>Table: {notification.data.tableNumber}</span>
                                                                        </div>
                                                                        {notification.data.customerName && (
                                                                            <div className="mt-1">Customer: {notification.data.customerName}</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-2 flex-shrink-0">
                                                                <span className="text-xs text-gray-500">
                                                                    {formatRelativeTime(notification.timestamp)}
                                                                </span>
                                                                {!notification.read && (
                                                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 ml-auto" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    {filteredNotifications.length} of {notifications.length} notifications
                                </span>
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-600">
                                        {filterCounts.unread} unread
                                    </span>
                                    {filterCounts.unread > 0 && (
                                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;