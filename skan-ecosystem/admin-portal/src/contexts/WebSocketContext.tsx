import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket, OrderEvent } from '../hooks/useWebSocket';

interface WebSocketContextType {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastOrderEvent: OrderEvent | null;
  reconnectAttempts: number;
  sendMessage: (data: any) => boolean;
  toggleConnection: () => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket Provider for real-time KDS updates
 * Manages the WebSocket connection lifecycle and provides order events to the app
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { auth } = useAuth();
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastOrderEvent, setLastOrderEvent] = useState<OrderEvent | null>(null);

  // Load WebSocket preferences from localStorage
  useEffect(() => {
    const savedEnabled = localStorage.getItem('skan-websocket-enabled');
    if (savedEnabled !== null) {
      setIsEnabled(savedEnabled === 'true');
    }
  }, []);

  // Save WebSocket preferences to localStorage
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('skan-websocket-enabled', enabled.toString());
  }, []);

  // Handle order events
  const handleOrderEvent = useCallback((event: OrderEvent) => {
    console.log('[WebSocket] Order event received:', event);
    setLastOrderEvent(event);
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('kds-order-event', {
      detail: event
    }));
  }, []);

  // Handle connection state changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log('[WebSocket] Connection state changed:', connected ? 'CONNECTED' : 'DISCONNECTED');
    
    // Show connection status to user
    if (connected) {
      // Could show a toast or update UI indicator
      console.log('[WebSocket] Real-time updates enabled');
    } else {
      console.log('[WebSocket] Real-time updates disabled - using polling fallback');
    }
  }, []);

  // Handle WebSocket errors
  const handleError = useCallback((error: Event) => {
    console.error('[WebSocket] Connection error:', error);
  }, []);

  // Determine WebSocket URL based on environment
  const getWebSocketUrl = useCallback((): string => {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app';
    
    // Convert HTTP(S) API URL to WebSocket URL
    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://') + '/ws';
    } else if (apiUrl.startsWith('http://')) {
      return apiUrl.replace('http://', 'ws://') + '/ws';
    } else {
      // Fallback for local development
      return 'ws://localhost:5001/ws';
    }
  }, []);

  // Initialize WebSocket connection
  const webSocket = useWebSocket({
    url: getWebSocketUrl(),
    venueId: auth.user?.venueId || '',
    token: auth.token || '',
    onOrderEvent: handleOrderEvent,
    onConnectionChange: handleConnectionChange,
    onError: handleError,
    autoReconnect: isEnabled,
    reconnectInterval: 2000,
    maxReconnectAttempts: 5
  });

  // Toggle connection (for manual control)
  const toggleConnection = useCallback(() => {
    if (webSocket.connected) {
      webSocket.disconnect();
      setEnabled(false);
    } else {
      webSocket.connect();
      setEnabled(true);
    }
  }, [webSocket, setEnabled]);

  // Don't render if user is not authenticated or has no venue
  const shouldConnect = auth.user?.venueId && auth.token && isEnabled;

  const contextValue: WebSocketContextType = {
    connected: shouldConnect ? webSocket.connected : false,
    connecting: shouldConnect ? webSocket.connecting : false,
    error: shouldConnect ? webSocket.error : null,
    lastOrderEvent,
    reconnectAttempts: webSocket.reconnectAttempts,
    sendMessage: webSocket.send,
    toggleConnection,
    isEnabled,
    setEnabled
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket context
 */
export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

/**
 * Hook to listen for specific order events
 */
export const useOrderEvents = (
  eventTypes: OrderEvent['type'][],
  callback: (event: OrderEvent) => void
) => {
  useEffect(() => {
    const handleEvent = (event: CustomEvent<OrderEvent>) => {
      if (eventTypes.includes(event.detail.type)) {
        callback(event.detail);
      }
    };

    window.addEventListener('kds-order-event', handleEvent as EventListener);
    
    return () => {
      window.removeEventListener('kds-order-event', handleEvent as EventListener);
    };
  }, [eventTypes, callback]);
};

export default WebSocketContext;