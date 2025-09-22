/**
 * Order Versioning Service
 * Handles version-based updates, conflict resolution, and optimistic UI updates
 * Implements the "Never Duplicate" core requirement for KDS
 */

import {
  VersionedOrder,
  OrderUpdateRequest,
  OrderUpdateResponse,
  OptimisticUpdate,
  ConflictResolution,
  OrderCache,
  OrderVersionEvent
} from '../types/orderTypes';

class OrderVersionService {
  private cache: OrderCache;
  private eventListeners: ((event: OrderVersionEvent) => void)[] = [];
  private syncInProgress = false;

  constructor() {
    this.cache = {
      orders: new Map(),
      pendingUpdates: new Map(),
      lastSync: new Date().toISOString(),
      syncVersion: 0
    };
  }

  /**
   * Add event listener for version events
   */
  addEventListener(listener: (event: OrderVersionEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: OrderVersionEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit version event to all listeners
   */
  private emitEvent(event: OrderVersionEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[OrderVersion] Event listener error:', error);
      }
    });
  }

  /**
   * Get order from cache
   */
  getOrder(orderId: string): VersionedOrder | null {
    return this.cache.orders.get(orderId) || null;
  }

  /**
   * Get all cached orders
   */
  getAllOrders(): VersionedOrder[] {
    return Array.from(this.cache.orders.values())
      .sort((a, b) => new Date(b.audit.createdAt).getTime() - new Date(a.audit.createdAt).getTime());
  }

  /**
   * Update cache with new orders
   */
  updateCache(orders: VersionedOrder[]): void {
    orders.forEach(order => {
      const existing = this.cache.orders.get(order.id);
      
      // Only update if server version is newer or equal
      if (!existing || order.version >= existing.version) {
        this.cache.orders.set(order.id, order);
        
        // Remove any pending updates that are now resolved
        const pendingUpdate = this.cache.pendingUpdates.get(order.id);
        if (pendingUpdate && order.version >= (pendingUpdate.serverVersion || 0)) {
          this.cache.pendingUpdates.delete(order.id);
        }
      }
    });
  }

  /**
   * Apply optimistic update to local cache
   */
  applyOptimisticUpdate(orderId: string, changes: Partial<VersionedOrder>, metadata?: any): OptimisticUpdate {
    const currentOrder = this.cache.orders.get(orderId);
    if (!currentOrder) {
      throw new Error(`Order ${orderId} not found in cache`);
    }

    // Create optimistic update record
    const optimisticUpdate: OptimisticUpdate = {
      id: `${orderId}-${Date.now()}`,
      orderId,
      localVersion: currentOrder.version + 1,
      changes,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    };

    // Apply changes to cached order
    const updatedOrder: VersionedOrder = {
      ...currentOrder,
      ...changes,
      version: optimisticUpdate.localVersion,
      clientVersion: optimisticUpdate.localVersion,
      lastModified: optimisticUpdate.timestamp,
      audit: {
        ...currentOrder.audit,
        updatedAt: optimisticUpdate.timestamp,
        updatedBy: metadata?.updatedBy,
        statusHistory: changes.status ? [
          ...currentOrder.audit.statusHistory,
          {
            fromStatus: currentOrder.status,
            toStatus: changes.status,
            timestamp: optimisticUpdate.timestamp,
            updatedBy: metadata?.updatedBy,
            reason: metadata?.reason
          }
        ] : currentOrder.audit.statusHistory
      }
    };

    // Update cache
    this.cache.orders.set(orderId, updatedOrder);
    this.cache.pendingUpdates.set(orderId, optimisticUpdate);

    console.log('[OrderVersion] Applied optimistic update:', optimisticUpdate);
    return optimisticUpdate;
  }

  /**
   * Handle server response to update request
   */
  handleUpdateResponse(response: OrderUpdateResponse, pendingUpdateId: string): void {
    const pendingUpdate = Array.from(this.cache.pendingUpdates.values())
      .find(update => update.id === pendingUpdateId);

    if (!pendingUpdate) {
      console.warn('[OrderVersion] Pending update not found:', pendingUpdateId);
      return;
    }

    if (response.success && response.order) {
      // Success - update cache with server version
      this.cache.orders.set(response.order.id, response.order);
      this.cache.pendingUpdates.delete(pendingUpdate.orderId);
      
      pendingUpdate.status = 'confirmed';
      pendingUpdate.serverVersion = response.order.version;

      console.log('[OrderVersion] Update confirmed:', response.order.id);
      
      this.emitEvent({
        type: 'order.version.updated',
        orderId: response.order.id,
        version: response.order.version,
        timestamp: new Date().toISOString()
      });

    } else if (response.conflict) {
      // Conflict detected
      console.warn('[OrderVersion] Version conflict detected:', response.conflict);
      
      pendingUpdate.status = 'conflict';
      
      this.emitEvent({
        type: 'order.version.conflict',
        orderId: pendingUpdate.orderId,
        version: response.conflict.currentVersion,
        conflict: response.conflict,
        timestamp: new Date().toISOString()
      });

      // Attempt automatic resolution
      this.resolveConflict(pendingUpdate, response.conflict);

    } else {
      // Update failed
      console.error('[OrderVersion] Update failed:', response.error);
      
      pendingUpdate.status = 'failed';
      pendingUpdate.retryCount++;

      // Retry if under limit
      if (pendingUpdate.retryCount < pendingUpdate.maxRetries) {
        setTimeout(() => {
          this.retryUpdate(pendingUpdate);
        }, this.getRetryDelay(pendingUpdate.retryCount));
      } else {
        // Max retries reached - revert optimistic update
        this.revertOptimisticUpdate(pendingUpdate);
      }
    }
  }

  /**
   * Resolve version conflicts automatically where possible
   */
  private resolveConflict(
    pendingUpdate: OptimisticUpdate, 
    conflict: NonNullable<OrderUpdateResponse['conflict']>
  ): void {
    const resolution = this.determineResolutionStrategy(pendingUpdate, conflict);
    
    console.log('[OrderVersion] Resolving conflict with strategy:', resolution.strategy);

    switch (resolution.strategy) {
      case 'server-wins':
        // Accept server version, discard local changes
        this.cache.orders.set(conflict.serverOrder.id, conflict.serverOrder);
        this.cache.pendingUpdates.delete(pendingUpdate.orderId);
        break;

      case 'client-wins':
        // Retry with server version as base
        this.retryUpdateWithServerBase(pendingUpdate, conflict.serverOrder);
        break;

      case 'merge':
        // Attempt to merge changes
        const mergedOrder = this.mergeOrders(conflict.serverOrder, pendingUpdate);
        this.cache.orders.set(mergedOrder.id, mergedOrder);
        this.cache.pendingUpdates.delete(pendingUpdate.orderId);
        break;

      case 'manual':
        // Require manual intervention
        console.warn('[OrderVersion] Manual conflict resolution required');
        break;
    }

    this.emitEvent({
      type: 'order.version.resolved',
      orderId: pendingUpdate.orderId,
      version: conflict.currentVersion,
      resolution,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Determine the best conflict resolution strategy
   */
  private determineResolutionStrategy(
    pendingUpdate: OptimisticUpdate,
    conflict: NonNullable<OrderUpdateResponse['conflict']>
  ): ConflictResolution {
    // For status changes, usually client (KDS) wins as it's authoritative
    if (pendingUpdate.changes.status) {
      return {
        strategy: 'client-wins',
        resolvedOrder: conflict.serverOrder
      };
    }

    // For other changes, server typically wins to maintain consistency
    return {
      strategy: 'server-wins',
      resolvedOrder: conflict.serverOrder
    };
  }

  /**
   * Merge conflicting orders intelligently
   */
  private mergeOrders(serverOrder: VersionedOrder, pendingUpdate: OptimisticUpdate): VersionedOrder {
    const mergedOrder: VersionedOrder = {
      ...serverOrder,
      version: serverOrder.version + 1,
      lastModified: new Date().toISOString()
    };

    // Apply non-conflicting changes from pending update
    Object.entries(pendingUpdate.changes).forEach(([field, value]) => {
      if (field === 'status') {
        // Status changes from KDS take precedence
        (mergedOrder as any)[field] = value;
      }
      // Add other merge rules as needed
    });

    return mergedOrder;
  }

  /**
   * Retry failed update with exponential backoff
   */
  private retryUpdate(pendingUpdate: OptimisticUpdate): void {
    console.log(`[OrderVersion] Retrying update (attempt ${pendingUpdate.retryCount + 1}):`, pendingUpdate.orderId);
    
    pendingUpdate.status = 'pending';
    pendingUpdate.retryCount++;
    
    // Would trigger actual API call here
    // For now, just log the retry attempt
  }

  /**
   * Retry update using server order as new base
   */
  private retryUpdateWithServerBase(
    pendingUpdate: OptimisticUpdate, 
    serverOrder: VersionedOrder
  ): void {
    // Update cache with server version
    this.cache.orders.set(serverOrder.id, serverOrder);
    
    // Reapply local changes on top of server version
    const newUpdate = this.applyOptimisticUpdate(
      serverOrder.id,
      pendingUpdate.changes,
      { reason: 'conflict-resolution-retry' }
    );
    
    // Remove old pending update
    this.cache.pendingUpdates.delete(pendingUpdate.orderId);
    
    console.log('[OrderVersion] Retrying update with server base:', newUpdate);
  }

  /**
   * Revert optimistic update (fallback for failed updates)
   */
  private revertOptimisticUpdate(pendingUpdate: OptimisticUpdate): void {
    console.warn('[OrderVersion] Reverting optimistic update:', pendingUpdate.orderId);
    
    // Remove the pending update
    this.cache.pendingUpdates.delete(pendingUpdate.orderId);
    
    // Would need to restore original order state here
    // For now, just mark as failed
    pendingUpdate.status = 'failed';
  }

  /**
   * Get retry delay with exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  /**
   * Create update request with current version
   */
  createUpdateRequest(
    orderId: string, 
    changes: Partial<VersionedOrder>,
    metadata?: any
  ): OrderUpdateRequest {
    const currentOrder = this.cache.orders.get(orderId);
    if (!currentOrder) {
      throw new Error(`Order ${orderId} not found in cache`);
    }

    return {
      orderId,
      version: currentOrder.version,
      changes,
      metadata
    };
  }

  /**
   * Get pending updates for monitoring
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.cache.pendingUpdates.values());
  }

  /**
   * Check if order has pending updates
   */
  hasPendingUpdates(orderId: string): boolean {
    return this.cache.pendingUpdates.has(orderId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalOrders: this.cache.orders.size,
      pendingUpdates: this.cache.pendingUpdates.size,
      lastSync: this.cache.lastSync,
      syncVersion: this.cache.syncVersion
    };
  }

  /**
   * Clear cache (for testing or reset)
   */
  clearCache(): void {
    this.cache.orders.clear();
    this.cache.pendingUpdates.clear();
    this.cache.lastSync = new Date().toISOString();
    console.log('[OrderVersion] Cache cleared');
  }
}

// Singleton instance
export const orderVersionService = new OrderVersionService();
export default orderVersionService;