import { useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../services/enterpriseOrderService';

export interface RealtimeNotification {
    id: string;
    type: 'order_created' | 'status_changed' | 'order_updated' | 'connection_established' | 'error';
    title: string;
    message: string;
    timestamp: string;
    data?: any;
    read?: boolean;
}

export interface ConnectionStats {
    connected: boolean;
    connectionTime?: Date;
    reconnectAttempts: number;
    lastError?: string;
    messageCount: number;
}

export interface RealtimeOrderCallbacks {
    onOrderCreated?: (order: Order) => void;
    onOrderStatusChanged?: (orderId: string, oldStatus: string, newStatus: string, order: Order) => void;
    onOrderUpdated?: (orderId: string, order: Order) => void;
    onConnectionChange?: (connected: boolean) => void;
    onError?: (error: string) => void;
}

export interface UseRealtimeOrdersReturn {
    connected: boolean;
    notifications: RealtimeNotification[];
    connectionStats: ConnectionStats;
    clearNotifications: () => void;
    addNotification: (notification: Omit<RealtimeNotification, 'id' | 'timestamp'>) => void;
    sendMessage: (message: any) => void;
}

const WS_RECONNECT_INTERVAL = 5000; // 5 seconds
const WS_MAX_RECONNECT_ATTEMPTS = 10;
const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const useRealtimeOrders = (
    venueId?: string,
    callbacks: RealtimeOrderCallbacks = {}
): UseRealtimeOrdersReturn => {
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
    const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
        connected: false,
        reconnectAttempts: 0,
        messageCount: 0
    });

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);

    // Get WebSocket URL
    const getWebSocketUrl = useCallback(() => {
        const baseUrl = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app';
        const wsUrl = baseUrl.replace(/^https?:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
        
        // For development, fallback to mock WebSocket behavior
        if (baseUrl.includes('localhost') || !venueId) {
            return null; // Will trigger mock mode
        }
        
        return `${wsUrl}/api/v1/realtime?venueId=${venueId}`;
    }, [venueId]);

    // Add notification helper
    const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp'>) => {
        const newNotification: RealtimeNotification = {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            read: false
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    }, []);

    // Clear notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Handle WebSocket message
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message = JSON.parse(event.data);
            
            setConnectionStats(prev => ({
                ...prev,
                messageCount: prev.messageCount + 1
            }));

            switch (message.type) {
                case 'connection_established':
                    console.log('WebSocket connection established', message);
                    addNotification({
                        type: 'connection_established',
                        title: 'Connected',
                        message: 'Real-time updates are now active'
                    });
                    break;

                case 'order_created':
                    console.log('New order received', message);
                    addNotification({
                        type: 'order_created',
                        title: 'New Order!',
                        message: `Order ${message.order?.orderNumber} from Table ${message.order?.tableNumber}`,
                        data: message.order
                    });
                    callbacks.onOrderCreated?.(message.order);
                    break;

                case 'order_status_changed':
                    console.log('Order status changed', message);
                    const { orderId, order, changes } = message;
                    const statusChange = changes?.status;
                    
                    if (statusChange) {
                        addNotification({
                            type: 'status_changed',
                            title: 'Order Updated',
                            message: `Order ${order?.orderNumber} is now ${statusChange.to}`,
                            data: order
                        });
                        callbacks.onOrderStatusChanged?.(orderId, statusChange.from, statusChange.to, order);
                    }
                    break;

                case 'order_updated':
                    console.log('Order updated', message);
                    callbacks.onOrderUpdated?.(message.orderId, message.order);
                    break;

                case 'cached_updates':
                    console.log('Received cached updates', message);
                    // Process cached updates when reconnecting
                    message.updates?.forEach((update: any) => {
                        handleMessage({ data: JSON.stringify(update) } as MessageEvent);
                    });
                    break;

                case 'pong':
                    // Heartbeat response - connection is healthy
                    break;

                default:
                    console.log('Unknown message type:', message.type, message);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }, [addNotification, callbacks]);

    // Handle connection open
    const handleOpen = useCallback(() => {
        console.log('WebSocket connected');
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        
        setConnectionStats(prev => ({
            ...prev,
            connected: true,
            connectionTime: new Date(),
            reconnectAttempts: 0,
            lastError: undefined
        }));

        callbacks.onConnectionChange?.(true);

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }
        
        heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, WS_HEARTBEAT_INTERVAL);
    }, [callbacks]);

    // Handle connection close
    const handleClose = useCallback((event: CloseEvent) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setConnected(false);
        
        setConnectionStats(prev => ({
            ...prev,
            connected: false
        }));

        callbacks.onConnectionChange?.(false);

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }

        // Auto-reconnect if not a normal closure and under retry limit
        if (event.code !== 1000 && reconnectAttemptsRef.current < WS_MAX_RECONNECT_ATTEMPTS && venueId) {
            reconnectAttemptsRef.current++;
            
            setConnectionStats(prev => ({
                ...prev,
                reconnectAttempts: reconnectAttemptsRef.current
            }));

            console.log(`Reconnecting in ${WS_RECONNECT_INTERVAL}ms (attempt ${reconnectAttemptsRef.current})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, WS_RECONNECT_INTERVAL);
        }
    }, [callbacks, venueId]);

    // Handle connection error
    const handleError = useCallback((event: Event) => {
        console.error('WebSocket error:', event);
        const errorMessage = 'Connection error occurred';
        
        setConnectionStats(prev => ({
            ...prev,
            lastError: errorMessage
        }));

        addNotification({
            type: 'error',
            title: 'Connection Error',
            message: errorMessage
        });

        callbacks.onError?.(errorMessage);
    }, [addNotification, callbacks]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!venueId) {
            console.log('No venue ID provided, skipping WebSocket connection');
            return;
        }

        const wsUrl = getWebSocketUrl();
        
        if (!wsUrl) {
            console.log('WebSocket URL not available, using mock mode');
            // Mock connection for development
            setTimeout(() => {
                setConnected(true);
                setConnectionStats(prev => ({
                    ...prev,
                    connected: true,
                    connectionTime: new Date()
                }));
                addNotification({
                    type: 'connection_established',
                    title: 'Mock Connection',
                    message: 'Development mode - simulated real-time updates'
                });
            }, 1000);
            return;
        }

        try {
            // Close existing connection
            if (wsRef.current) {
                wsRef.current.close();
            }

            console.log('Connecting to WebSocket:', wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = handleOpen;
            ws.onmessage = handleMessage;
            ws.onclose = handleClose;
            ws.onerror = handleError;

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            handleError(new Event('error'));
        }
    }, [venueId, getWebSocketUrl, handleOpen, handleMessage, handleClose, handleError, addNotification]);

    // Send message
    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message:', message);
        }
    }, []);

    // Initial connection and cleanup
    useEffect(() => {
        if (venueId) {
            connect();
        }

        return () => {
            // Cleanup on unmount
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, [venueId, connect]);

    // Mock real-time updates for development/testing
    useEffect(() => {
        if (!venueId || getWebSocketUrl()) {
            return; // Only mock if no real WebSocket available
        }

        // Generate mock notifications for testing
        const mockInterval = setInterval(() => {
            const mockNotifications = [
                {
                    type: 'order_created' as const,
                    title: 'New Order!',
                    message: `Order SKN-${Date.now().toString().slice(-6)} from Table T${Math.floor(Math.random() * 20) + 1}`
                },
                {
                    type: 'status_changed' as const,
                    title: 'Order Ready',
                    message: `Order SKN-${Date.now().toString().slice(-6)} is ready for pickup`
                }
            ];

            // Add random mock notification every 30-60 seconds
            if (Math.random() < 0.3) {
                const notification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
                addNotification(notification);
            }
        }, 30000);

        return () => clearInterval(mockInterval);
    }, [venueId, getWebSocketUrl, addNotification]);

    return {
        connected,
        notifications,
        connectionStats,
        clearNotifications,
        addNotification,
        sendMessage
    };
};