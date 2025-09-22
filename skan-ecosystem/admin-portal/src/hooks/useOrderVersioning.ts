/**
 * React hook for order versioning and conflict resolution
 * Provides optimistic updates and automatic conflict resolution for KDS
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  VersionedOrder,
  OptimisticUpdate,
  OrderUpdateRequest,
  OrderUpdateResponse,
  OrderVersionEvent
} from '../types/orderTypes';
import orderVersionService from '../services/orderVersionService';

interface UseOrderVersioningOptions {
  onConflict?: (conflict: OrderVersionEvent) => void;
  onResolution?: (resolution: OrderVersionEvent) => void;
  onUpdate?: (update: OrderVersionEvent) => void;
  enableOptimisticUpdates?: boolean;
}

interface UseOrderVersioningReturn {
  orders: VersionedOrder[];
  pendingUpdates: OptimisticUpdate[];
  isUpdating: boolean;
  updateOrder: (orderId: string, changes: Partial<VersionedOrder>, metadata?: any) => Promise<boolean>;
  refreshOrders: () => void;
  getOrder: (orderId: string) => VersionedOrder | null;
  hasPendingUpdates: (orderId: string) => boolean;
  cacheStats: {
    totalOrders: number;
    pendingUpdates: number;
    lastSync: string;
    syncVersion: number;
  };
}

/**
 * Hook for managing versioned orders with conflict resolution
 */
export const useOrderVersioning = (options: UseOrderVersioningOptions = {}): UseOrderVersioningReturn => {
  const {
    onConflict,
    onResolution,
    onUpdate,
    enableOptimisticUpdates = true
  } = options;

  const [orders, setOrders] = useState<VersionedOrder[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cacheStats, setCacheStats] = useState(orderVersionService.getCacheStats());

  const mountedRef = useRef(true);

  // Update local state when cache changes
  const refreshLocalState = useCallback(() => {
    if (!mountedRef.current) return;

    setOrders(orderVersionService.getAllOrders());
    setPendingUpdates(orderVersionService.getPendingUpdates());
    setCacheStats(orderVersionService.getCacheStats());
  }, []);

  // Handle version events
  const handleVersionEvent = useCallback((event: OrderVersionEvent) => {
    console.log('[useOrderVersioning] Version event:', event);

    switch (event.type) {
      case 'order.version.conflict':
        onConflict?.(event);
        break;
      case 'order.version.resolved':
        onResolution?.(event);
        break;
      case 'order.version.updated':
        onUpdate?.(event);
        break;
    }

    // Refresh local state after any version event
    refreshLocalState();
  }, [onConflict, onResolution, onUpdate, refreshLocalState]);

  // Setup event listeners
  useEffect(() => {
    orderVersionService.addEventListener(handleVersionEvent);
    
    return () => {
      orderVersionService.removeEventListener(handleVersionEvent);
    };
  }, [handleVersionEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update order with versioning and conflict resolution
  const updateOrder = useCallback(async (
    orderId: string,
    changes: Partial<VersionedOrder>,
    metadata?: any
  ): Promise<boolean> => {
    try {
      setIsUpdating(true);

      // Apply optimistic update if enabled
      let optimisticUpdate: OptimisticUpdate | null = null;
      if (enableOptimisticUpdates) {
        optimisticUpdate = orderVersionService.applyOptimisticUpdate(orderId, changes, metadata);
        refreshLocalState();
      }

      // Create versioned update request
      const updateRequest = orderVersionService.createUpdateRequest(orderId, changes, metadata);

      // Simulate API call (replace with actual API call)
      const response = await simulateOrderUpdate(updateRequest);

      // Handle response
      if (optimisticUpdate) {
        orderVersionService.handleUpdateResponse(response, optimisticUpdate.id);
      } else if (response.success && response.order) {
        // Direct update without optimistic UI
        orderVersionService.updateCache([response.order]);
      }

      refreshLocalState();
      return response.success;

    } catch (error) {
      console.error('[useOrderVersioning] Update failed:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [enableOptimisticUpdates, refreshLocalState]);

  // Get specific order
  const getOrder = useCallback((orderId: string): VersionedOrder | null => {
    return orderVersionService.getOrder(orderId);
  }, []);

  // Check if order has pending updates
  const hasPendingUpdates = useCallback((orderId: string): boolean => {
    return orderVersionService.hasPendingUpdates(orderId);
  }, []);

  // Refresh orders from cache
  const refreshOrders = useCallback(() => {
    refreshLocalState();
  }, [refreshLocalState]);

  // Initialize with current cache state
  useEffect(() => {
    refreshLocalState();
  }, [refreshLocalState]);

  return {
    orders,
    pendingUpdates,
    isUpdating,
    updateOrder,
    refreshOrders,
    getOrder,
    hasPendingUpdates,
    cacheStats
  };
};

/**
 * Simulate API order update (replace with real API call)
 */
async function simulateOrderUpdate(request: OrderUpdateRequest): Promise<OrderUpdateResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Simulate occasional conflicts (10% chance)
  if (Math.random() < 0.1) {
    return {
      success: false,
      conflict: {
        currentVersion: request.version + 1,
        expectedVersion: request.version,
        conflictingChanges: ['status'],
        serverOrder: {
          ...createMockOrder(request.orderId),
          version: request.version + 1,
          status: 'preparing' // Different from expected
        }
      }
    };
  }

  // Simulate occasional failures (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      error: 'Network timeout'
    };
  }

  // Success case
  const updatedOrder = {
    ...createMockOrder(request.orderId),
    ...request.changes,
    version: request.version + 1,
    lastModified: new Date().toISOString()
  };

  return {
    success: true,
    order: updatedOrder
  };
}

/**
 * Create mock order for simulation
 */
function createMockOrder(orderId: string): VersionedOrder {
  return {
    id: orderId,
    venueId: 'beach-bar-durres',
    tableNumber: 'T01',
    orderNumber: 'SKN-20250922-001',
    customerName: 'Test Customer',
    items: [
      {
        id: 'item-1',
        name: 'Albanian Beer',
        price: 3.50,
        quantity: 1
      }
    ],
    totalAmount: 3.50,
    status: 'new',
    version: 1,
    lastModified: new Date().toISOString(),
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [],
      versionHistory: []
    }
  };
}

export default useOrderVersioning;