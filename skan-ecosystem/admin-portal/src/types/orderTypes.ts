/**
 * Order versioning and conflict resolution types for KDS system
 * Ensures data consistency and prevents duplicate updates
 */

export interface OrderVersion {
  version: number;
  timestamp: string;
  updatedBy?: string;
  changeReason?: string;
}

export interface OrderAudit {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  statusHistory: OrderStatusChange[];
  versionHistory: OrderVersionChange[];
}

export interface OrderStatusChange {
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  updatedBy?: string;
  reason?: string;
}

export interface OrderVersionChange {
  version: number;
  timestamp: string;
  changes: Record<string, { from: any; to: any }>;
  updatedBy?: string;
}

export interface VersionedOrder {
  id: string;
  venueId: string;
  tableNumber: string;
  orderNumber: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
  specialInstructions?: string;
  
  // Versioning fields
  version: number;
  clientVersion?: number; // For optimistic updates
  lastModified: string;
  
  // Audit trail
  audit: OrderAudit;
  
  // Metadata
  metadata?: {
    source?: 'customer' | 'admin' | 'api';
    deviceId?: string;
    sessionId?: string;
  };
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifications?: string[];
  notes?: string;
}

export interface OrderUpdateRequest {
  orderId: string;
  version: number; // Expected version for conflict detection
  changes: Partial<VersionedOrder>;
  metadata?: {
    updatedBy?: string;
    reason?: string;
    source?: string;
  };
}

export interface OrderUpdateResponse {
  success: boolean;
  order?: VersionedOrder;
  conflict?: {
    currentVersion: number;
    expectedVersion: number;
    conflictingChanges: string[];
    serverOrder: VersionedOrder;
  };
  error?: string;
}

export interface ConflictResolution {
  strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  resolvedOrder: VersionedOrder;
  mergeRules?: {
    field: string;
    resolution: 'server' | 'client' | 'newer' | 'custom';
  }[];
}

export interface OptimisticUpdate {
  id: string;
  orderId: string;
  localVersion: number;
  serverVersion?: number;
  changes: Partial<VersionedOrder>;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'conflict' | 'failed';
  retryCount: number;
  maxRetries: number;
}

export interface OrderCache {
  orders: Map<string, VersionedOrder>;
  pendingUpdates: Map<string, OptimisticUpdate>;
  lastSync: string;
  syncVersion: number;
}

export interface SyncResponse {
  orders: VersionedOrder[];
  deletedOrderIds: string[];
  syncVersion: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Utility types for order management
export type OrderStatus = VersionedOrder['status'];
export type OrderField = keyof VersionedOrder;
export type OrderChange = { field: OrderField; from: any; to: any };

// Event types for real-time updates
export interface OrderVersionEvent {
  type: 'order.version.conflict' | 'order.version.resolved' | 'order.version.updated';
  orderId: string;
  version: number;
  conflict?: OrderUpdateResponse['conflict'];
  resolution?: ConflictResolution;
  timestamp: string;
}