import { useEffect, useRef, useState, useCallback } from 'react';

export interface OrderEvent {
  type: 'order.created' | 'order.updated' | 'order.cancelled';
  payload: any;
  version: number;
  timestamp: string;
  venueId: string;
}

interface WebSocketOptions {
  url: string;
  venueId: string;
  token?: string;
  onOrderEvent?: (event: OrderEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEvent: OrderEvent | null;
  reconnectAttempts: number;
  send: (data: any) => boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for WebSocket connection with automatic reconnection
 * Handles real-time order events for the KDS system
 */
export const useWebSocket = (options: WebSocketOptions): WebSocketState => {
  const {
    url,
    venueId,
    token,
    onOrderEvent,
    onConnectionChange,
    onError,
    autoReconnect = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 10
  } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<OrderEvent | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Clear timeouts helper
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      }));
    }
  }, []);

  // Start heartbeat interval
  const startHeartbeat = useCallback(() => {
    clearTimeouts();
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000); // Every 30 seconds
  }, [sendHeartbeat, clearTimeouts]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'pong') {
        // Heartbeat response - connection is healthy
        return;
      }
      
      if (data.type === 'order.created' || data.type === 'order.updated' || data.type === 'order.cancelled') {
        const orderEvent: OrderEvent = {
          type: data.type,
          payload: data.payload,
          version: data.version || 1,
          timestamp: data.timestamp || new Date().toISOString(),
          venueId: data.venueId || venueId
        };
        
        setLastEvent(orderEvent);
        onOrderEvent?.(orderEvent);
        
        console.log('[WS] Order event received:', orderEvent);
      } else if (data.type === 'connection.established') {
        console.log('[WS] Connection established for venue:', data.venueId);
        setError(null);
      } else {
        console.log('[WS] Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  }, [onOrderEvent, venueId]);

  // Exponential backoff for reconnection
  const getReconnectDelay = useCallback((attempts: number): number => {
    const baseDelay = reconnectInterval;
    const maxDelay = 30000; // Max 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }, [reconnectInterval]);

  // Reconnect with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!autoReconnect || !mountedRef.current || reconnectAttempts >= maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached or auto-reconnect disabled');
      return;
    }

    const delay = getReconnectDelay(reconnectAttempts);
    console.log(`[WS] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setReconnectAttempts(prev => prev + 1);
        connect();
      }
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReconnect, reconnectAttempts, maxReconnectAttempts, getReconnectDelay]); // connect creates circular dependency

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected or connecting');
      return;
    }

    setConnecting(true);
    setError(null);
    clearTimeouts();

    try {
      // Construct WebSocket URL with authentication
      const wsUrl = new URL(url);
      if (token) {
        wsUrl.searchParams.set('token', token);
      }
      wsUrl.searchParams.set('venueId', venueId);

      console.log('[WS] Connecting to:', wsUrl.toString());
      
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('[WS] Connected successfully');
        setConnected(true);
        setConnecting(false);
        setReconnectAttempts(0);
        setError(null);
        onConnectionChange?.(true);
        
        // Send authentication and venue subscription
        ws.send(JSON.stringify({
          type: 'subscribe',
          venueId: venueId,
          events: ['order.created', 'order.updated', 'order.cancelled']
        }));
        
        startHeartbeat();
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        
        console.log('[WS] Connection closed:', event.code, event.reason);
        setConnected(false);
        setConnecting(false);
        onConnectionChange?.(false);
        clearTimeouts();
        
        if (event.code !== 1000) { // Not a normal closure
          setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
          scheduleReconnect();
        }
      };

      ws.onerror = (event) => {
        if (!mountedRef.current) return;
        
        console.error('[WS] Connection error:', event);
        setError('WebSocket connection error');
        setConnecting(false);
        onError?.(event);
      };

    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create WebSocket');
      setConnecting(false);
      scheduleReconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, venueId, token, onConnectionChange, onError, handleMessage, startHeartbeat, clearTimeouts]); // scheduleReconnect creates circular dependency

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('[WS] Disconnecting...');
    clearTimeouts();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnected(false);
    setConnecting(false);
    setReconnectAttempts(0);
    setError(null);
    onConnectionChange?.(false);
  }, [clearTimeouts, onConnectionChange]);

  // Send data through WebSocket
  const send = useCallback((data: any): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.error('[WS] Failed to send data:', err);
        return false;
      }
    }
    
    console.warn('[WS] Cannot send data - not connected');
    return false;
  }, []);

  // Auto-connect on mount and when dependencies change
  useEffect(() => {
    if (url && venueId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, venueId, token]); // Don't include connect/disconnect to avoid infinite loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [clearTimeouts]);

  return {
    connected,
    connecting,
    error,
    lastEvent,
    reconnectAttempts,
    send,
    connect,
    disconnect
  };
};

export default useWebSocket;