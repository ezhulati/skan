# Enterprise Order Management System Architecture

## System Overview

This document outlines the complete architecture for an enterprise-grade order management system capable of handling 1000+ orders per restaurant per day across 100+ restaurants.

## Core Requirements

### Performance Requirements
- Handle 100,000+ orders/day system-wide
- Sub-second response times for active orders
- Real-time updates for order status changes
- Mobile-first responsive design
- Offline capabilities for critical operations

### Scalability Requirements
- Horizontal scaling for peak loads
- Database partitioning by time and venue
- Efficient data archival and retrieval
- CDN-optimized static assets
- Progressive loading for large datasets

### Business Requirements
- Real-time order visibility for active orders
- Historical data retention for compliance
- Advanced search and filtering
- Analytics and reporting dashboard
- Multi-language support (Albanian/English)
- Role-based access control

## Database Schema Design

### 1. Core Tables

```sql
-- Orders table with partitioning
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- SKN-YYYYMMDD-###
    venue_id VARCHAR(100) NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    status order_status_enum NOT NULL DEFAULT 'new',
    total_amount DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prepared_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    -- Partitioning key
    order_date DATE GENERATED ALWAYS AS (created_at::DATE) STORED
) PARTITION BY RANGE (order_date);

-- Partition by month for performance
CREATE TABLE orders_2025_01 PARTITION OF orders 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_albanian VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history for audit trail
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status_enum,
    new_status order_status_enum NOT NULL,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Daily order summaries for analytics
CREATE TABLE daily_order_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id VARCHAR(100) NOT NULL,
    summary_date DATE NOT NULL,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    orders_by_status JSONB NOT NULL DEFAULT '{}',
    peak_hour_start INTEGER, -- 0-23
    peak_hour_orders INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(venue_id, summary_date)
);
```

### 2. Indexes for Performance

```sql
-- Active orders (most frequent query)
CREATE INDEX idx_orders_active ON orders (venue_id, status, created_at DESC) 
WHERE status IN ('new', 'preparing', 'ready');

-- Recent served orders (last 24 hours)
CREATE INDEX idx_orders_recent_served ON orders (venue_id, served_at DESC) 
WHERE status = 'served' AND served_at > NOW() - INTERVAL '24 hours';

-- Historical search
CREATE INDEX idx_orders_historical ON orders (venue_id, order_date DESC);
CREATE INDEX idx_orders_search ON orders (order_number, customer_name);

-- Order items for reports
CREATE INDEX idx_order_items_lookup ON order_items (order_id, menu_item_id);

-- Status history for audit
CREATE INDEX idx_status_history ON order_status_history (order_id, changed_at DESC);
```

### 3. Database Functions

```sql
-- Function to automatically archive old orders
CREATE OR REPLACE FUNCTION archive_old_orders()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE orders 
    SET archived_at = NOW()
    WHERE status = 'served' 
    AND served_at < NOW() - INTERVAL '30 days'
    AND archived_at IS NULL;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily summaries
CREATE OR REPLACE FUNCTION generate_daily_summary(target_date DATE, target_venue_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_order_summaries (
        venue_id, summary_date, total_orders, total_revenue, avg_order_value,
        orders_by_status, peak_hour_start, peak_hour_orders
    )
    SELECT 
        venue_id,
        target_date,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        JSON_OBJECT_AGG(status, status_count) as orders_by_status,
        peak_hour.hour as peak_hour_start,
        peak_hour.order_count as peak_hour_orders
    FROM (
        SELECT *, 
               COUNT(*) OVER (PARTITION BY status) as status_count
        FROM orders 
        WHERE venue_id = target_venue_id 
        AND order_date = target_date
    ) o
    CROSS JOIN LATERAL (
        SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as order_count
        FROM orders 
        WHERE venue_id = target_venue_id 
        AND order_date = target_date
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY order_count DESC
        LIMIT 1
    ) peak_hour
    GROUP BY venue_id
    ON CONFLICT (venue_id, summary_date) 
    DO UPDATE SET 
        total_orders = EXCLUDED.total_orders,
        total_revenue = EXCLUDED.total_revenue,
        avg_order_value = EXCLUDED.avg_order_value,
        orders_by_status = EXCLUDED.orders_by_status,
        peak_hour_start = EXCLUDED.peak_hour_start,
        peak_hour_orders = EXCLUDED.peak_hour_orders;
END;
$$ LANGUAGE plpgsql;
```

## API Architecture

### 1. Endpoint Design

```typescript
// Active Operations (Real-time)
GET /api/v1/venues/:venueId/orders/active
GET /api/v1/venues/:venueId/orders/recent  // Last 24h served
PUT /api/v1/orders/:orderId/status
POST /api/v1/orders

// Historical Operations (Paginated)
GET /api/v1/venues/:venueId/orders/history?page=1&limit=50&date=2025-01-20
GET /api/v1/venues/:venueId/orders/search?q=SKN-20250120&page=1

// Analytics
GET /api/v1/venues/:venueId/analytics/daily?date=2025-01-20
GET /api/v1/venues/:venueId/analytics/summary?from=2025-01-01&to=2025-01-31

// Real-time WebSocket
WS /api/v1/venues/:venueId/orders/live
```

### 2. Response Formats

```typescript
interface OrderListResponse {
    data: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    metadata: {
        cached: boolean;
        queryTime: number;
        lastUpdated: string;
    };
}

interface RealtimeOrderUpdate {
    type: 'order_created' | 'status_changed' | 'order_updated';
    orderId: string;
    order: Order;
    changes?: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    timestamp: string;
}
```

## Frontend Architecture

### 1. Component Hierarchy

```
OrderManagementDashboard/
├── OrderStatusTabs/
│   ├── ActiveOrdersTab/
│   │   ├── NewOrdersList/
│   │   ├── PreparingOrdersList/
│   │   └── ReadyOrdersList/
│   ├── RecentServedTab/
│   └── HistoricalOrdersTab/
├── OrderDetailsModal/
├── BulkActionsPanel/
├── SearchAndFilters/
├── Analytics/
│   ├── DailyStatsCard/
│   ├── RevenueChart/
│   └── PopularItemsChart/
└── NotificationCenter/
```

### 2. State Management

```typescript
interface OrderManagementState {
    activeOrders: Order[];
    recentServed: Order[];
    historicalOrders: PaginatedOrders;
    selectedOrder: Order | null;
    filters: {
        status: OrderStatus[];
        dateRange: [Date, Date];
        tableNumber: string;
        customerName: string;
    };
    realtime: {
        connected: boolean;
        lastUpdate: Date;
        notifications: Notification[];
    };
    analytics: {
        dailyStats: DailyStats;
        trends: TrendData[];
    };
}
```

### 3. Performance Optimizations

```typescript
// Virtual scrolling for large lists
const VirtualizedOrderList = React.memo(({ orders }: { orders: Order[] }) => {
    const [visibleOrders, setVisibleOrders] = useState<Order[]>([]);
    const [scrollTop, setScrollTop] = useState(0);
    
    // Implement virtual scrolling logic
    useEffect(() => {
        const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
        const endIndex = Math.min(startIndex + VISIBLE_COUNT, orders.length);
        setVisibleOrders(orders.slice(startIndex, endIndex));
    }, [scrollTop, orders]);
    
    return (
        <div className="virtual-list" onScroll={handleScroll}>
            {visibleOrders.map(order => (
                <OrderCard key={order.id} order={order} />
            ))}
        </div>
    );
});

// Optimistic updates for better UX
const useOptimisticOrderUpdate = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    
    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        // Optimistic update
        setOrders(prev => prev.map(order => 
            order.id === orderId 
                ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
                : order
        ));
        
        try {
            await api.updateOrderStatus(orderId, newStatus);
        } catch (error) {
            // Rollback on error
            setOrders(prev => prev.map(order => 
                order.id === orderId 
                    ? { ...order, status: order.status } // Revert
                    : order
            ));
            throw error;
        }
    };
    
    return { orders, updateOrderStatus };
};
```

## Background Services

### 1. Data Archival Service

```typescript
class OrderArchivalService {
    async runDailyArchival() {
        try {
            // Archive orders older than 30 days
            const archivedCount = await this.archiveOldOrders();
            
            // Generate daily summaries for yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            await this.generateDailySummaries(yesterday);
            
            // Cleanup old notifications
            await this.cleanupOldNotifications();
            
            logger.info(`Daily archival completed: ${archivedCount} orders archived`);
        } catch (error) {
            logger.error('Daily archival failed:', error);
            await this.notifyAdmins('Daily archival failed', error);
        }
    }
    
    async archiveOldOrders(): Promise<number> {
        return await db.query('SELECT archive_old_orders()');
    }
    
    async generateDailySummaries(date: Date) {
        const venues = await db.venues.findMany({ where: { isActive: true } });
        
        for (const venue of venues) {
            await db.query('SELECT generate_daily_summary($1, $2)', [
                date.toISOString().split('T')[0],
                venue.id
            ]);
        }
    }
}
```

### 2. Real-time Update Service

```typescript
class RealtimeUpdateService {
    private connections: Map<string, WebSocket[]> = new Map();
    
    subscribeToVenue(venueId: string, ws: WebSocket) {
        if (!this.connections.has(venueId)) {
            this.connections.set(venueId, []);
        }
        this.connections.get(venueId)!.push(ws);
    }
    
    async broadcastOrderUpdate(venueId: string, update: RealtimeOrderUpdate) {
        const connections = this.connections.get(venueId) || [];
        
        const message = JSON.stringify(update);
        connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
        
        // Also cache for recently disconnected clients
        await this.cacheUpdate(venueId, update);
    }
    
    private async cacheUpdate(venueId: string, update: RealtimeOrderUpdate) {
        const key = `updates:${venueId}`;
        await redis.lpush(key, JSON.stringify(update));
        await redis.ltrim(key, 0, 100); // Keep last 100 updates
        await redis.expire(key, 3600); // Expire after 1 hour
    }
}
```

This is just the architectural foundation. Next, I'll implement the complete system with all components.