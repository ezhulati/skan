import React from 'react';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
}

interface Venue {
    id: string;
    name: string;
    address?: string;
}

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

interface WelcomeHeaderProps {
    user?: User | null;
    venue?: Venue | null;
    orderCounts: OrderCounts;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
    user,
    venue,
    orderCounts
}) => {
    // Get current time of day greeting
    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Get priority indicator based on active orders
    const getPriorityLevel = (): { level: string; color: string; message: string } => {
        const { active } = orderCounts;
        
        if (active.new >= 5) {
            return {
                level: 'urgent',
                color: 'text-red-600 bg-red-50 border-red-200',
                message: `${active.new} new orders need attention!`
            };
        }
        
        if (active.ready >= 3) {
            return {
                level: 'warning',
                color: 'text-orange-600 bg-orange-50 border-orange-200',
                message: `${active.ready} orders ready for pickup!`
            };
        }
        
        if (active.total > 0) {
            return {
                level: 'normal',
                color: 'text-blue-600 bg-blue-50 border-blue-200',
                message: `${active.total} active orders in progress`
            };
        }
        
        return {
            level: 'calm',
            color: 'text-green-600 bg-green-50 border-green-200',
            message: 'All caught up! No pending orders'
        };
    };

    const priority = getPriorityLevel();

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                {/* Welcome message */}
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {getGreeting()}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {venue?.name || 'Restaurant Dashboard'}
                        {venue?.address && (
                            <span className="text-gray-400"> • {venue.address}</span>
                        )}
                    </p>
                </div>

                {/* Priority indicator */}
                <div className={`px-3 py-2 rounded-lg border ${priority.color}`}>
                    <div className="flex items-center space-x-2">
                        {priority.level === 'urgent' && (
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                        {priority.level === 'warning' && (
                            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        )}
                        {priority.level === 'normal' && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        )}
                        {priority.level === 'calm' && (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="text-sm font-medium">{priority.message}</span>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{orderCounts.active.total}</div>
                    <div className="text-gray-600">Active</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{orderCounts.recent}</div>
                    <div className="text-gray-600">Today</div>
                </div>
                {user?.role && (
                    <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 capitalize">{user.role}</div>
                        <div className="text-xs text-gray-500">Role</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeHeader;