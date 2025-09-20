// Enterprise Order Management API
// Designed for high-volume restaurants (1000+ orders/day)

const express = require('express');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const router = express.Router();

// Initialize Firestore
const db = admin.firestore();

// Constants for performance optimization
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const CACHE_TTL = 300; // 5 minutes for analytics
const REALTIME_UPDATE_DELAY = 1000; // 1 second batching

// Utility functions
const paginate = (page = 1, limit = DEFAULT_PAGE_SIZE) => ({
    page: Math.max(1, parseInt(page)),
    limit: Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit)))
});

const buildOrderQuery = (venueId, filters = {}) => {
    let query = db.collection('venues').doc(venueId).collection('orders');
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
        if (filters.status === 'active') {
            query = query.where('status', 'in', ['new', 'preparing', 'ready']);
        } else {
            query = query.where('status', '==', filters.status);
        }
    }
    
    if (filters.dateFrom) {
        query = query.where('createdAt', '>=', new Date(filters.dateFrom));
    }
    
    if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999); // End of day
        query = query.where('createdAt', '<=', dateTo);
    }
    
    if (filters.tableNumber) {
        query = query.where('tableNumber', '==', filters.tableNumber);
    }
    
    return query;
};

const formatOrderResponse = (order) => {
    const data = order.data();
    return {
        id: order.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        preparedAt: data.preparedAt?.toDate?.()?.toISOString() || data.preparedAt,
        readyAt: data.readyAt?.toDate?.()?.toISOString() || data.readyAt,
        servedAt: data.servedAt?.toDate?.()?.toISOString() || data.servedAt
    };
};

// 1. GET ACTIVE ORDERS (Real-time critical)
router.get('/venues/:venueId/orders/active', async (req, res) => {
    try {
        const { venueId } = req.params;
        
        // Get only active orders (new, preparing, ready)
        const activeQuery = db.collection('venues')
            .doc(venueId)
            .collection('orders')
            .where('status', 'in', ['new', 'preparing', 'ready'])
            .orderBy('createdAt', 'desc');
        
        const snapshot = await activeQuery.get();
        const orders = snapshot.docs.map(formatOrderResponse);
        
        // Group by status for efficient frontend rendering
        const groupedOrders = {
            new: orders.filter(o => o.status === 'new'),
            preparing: orders.filter(o => o.status === 'preparing'),
            ready: orders.filter(o => o.status === 'ready')
        };
        
        res.json({
            data: orders,
            grouped: groupedOrders,
            counts: {
                new: groupedOrders.new.length,
                preparing: groupedOrders.preparing.length,
                ready: groupedOrders.ready.length,
                total: orders.length
            },
            metadata: {
                cached: false,
                queryTime: Date.now(),
                lastUpdated: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error fetching active orders:', error);
        res.status(500).json({ error: 'Failed to fetch active orders' });
    }
});

// 2. GET RECENT SERVED ORDERS (Last 24 hours)
router.get('/venues/:venueId/orders/recent', async (req, res) => {
    try {
        const { venueId } = req.params;
        const { page = 1, limit = DEFAULT_PAGE_SIZE } = req.query;
        const { page: pageNum, limit: limitNum } = paginate(page, limit);
        
        // Get served orders from last 24 hours
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        const recentQuery = db.collection('venues')
            .doc(venueId)
            .collection('orders')
            .where('status', '==', 'served')
            .where('servedAt', '>=', yesterday)
            .orderBy('servedAt', 'desc')
            .limit(limitNum)
            .offset((pageNum - 1) * limitNum);
        
        const snapshot = await recentQuery.get();
        const orders = snapshot.docs.map(formatOrderResponse);
        
        // Calculate daily totals
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        
        res.json({
            data: orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: snapshot.size,
                hasNext: snapshot.size === limitNum,
                hasPrev: pageNum > 1
            },
            analytics: {
                totalOrders: orders.length,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                timeRange: '24h'
            },
            metadata: {
                queryTime: Date.now(),
                lastUpdated: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
});

// 3. GET HISTORICAL ORDERS (Paginated, searchable)
router.get('/venues/:venueId/orders/history', async (req, res) => {
    try {
        const { venueId } = req.params;
        const { 
            page = 1, 
            limit = DEFAULT_PAGE_SIZE,
            dateFrom,
            dateTo,
            status,
            search
        } = req.query;
        
        const { page: pageNum, limit: limitNum } = paginate(page, limit);
        
        let query = db.collection('venues')
            .doc(venueId)
            .collection('orders');
        
        // Apply date filters
        if (dateFrom) {
            query = query.where('createdAt', '>=', new Date(dateFrom));
        } else {
            // Default to orders older than 24 hours
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);
            query = query.where('createdAt', '<=', yesterday);
        }
        
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            query = query.where('createdAt', '<=', endDate);
        }
        
        if (status && status !== 'all') {
            query = query.where('status', '==', status);
        }
        
        query = query.orderBy('createdAt', 'desc')
                    .limit(limitNum)
                    .offset((pageNum - 1) * limitNum);
        
        const snapshot = await query.get();
        let orders = snapshot.docs.map(formatOrderResponse);
        
        // Apply text search client-side (for order number or customer name)
        if (search) {
            const searchLower = search.toLowerCase();
            orders = orders.filter(order => 
                order.orderNumber?.toLowerCase().includes(searchLower) ||
                order.customerName?.toLowerCase().includes(searchLower)
            );
        }
        
        res.json({
            data: orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: snapshot.size,
                hasNext: snapshot.size === limitNum,
                hasPrev: pageNum > 1
            },
            filters: {
                dateFrom,
                dateTo,
                status,
                search
            },
            metadata: {
                queryTime: Date.now(),
                searchApplied: !!search
            }
        });
        
    } catch (error) {
        console.error('Error fetching historical orders:', error);
        res.status(500).json({ error: 'Failed to fetch historical orders' });
    }
});

// 4. SEARCH ORDERS (Advanced search)
router.get('/venues/:venueId/orders/search', async (req, res) => {
    try {
        const { venueId } = req.params;
        const { 
            q: searchQuery,
            page = 1,
            limit = DEFAULT_PAGE_SIZE,
            dateRange = '30d' // 1d, 7d, 30d, 90d, all
        } = req.query;
        
        if (!searchQuery || searchQuery.length < 2) {
            return res.status(400).json({ 
                error: 'Search query must be at least 2 characters' 
            });
        }
        
        const { page: pageNum, limit: limitNum } = paginate(page, limit);
        
        // Set date range
        let query = db.collection('venues').doc(venueId).collection('orders');
        
        if (dateRange !== 'all') {
            const days = parseInt(dateRange.replace('d', ''));
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            query = query.where('createdAt', '>=', startDate);
        }
        
        // Execute query
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        
        // Search across multiple fields
        const searchLower = searchQuery.toLowerCase();
        const matchingOrders = snapshot.docs
            .map(formatOrderResponse)
            .filter(order => {
                return (
                    order.orderNumber?.toLowerCase().includes(searchLower) ||
                    order.customerName?.toLowerCase().includes(searchLower) ||
                    order.tableNumber?.toLowerCase().includes(searchLower) ||
                    order.items?.some(item => 
                        item.name?.toLowerCase().includes(searchLower) ||
                        item.nameAlbanian?.toLowerCase().includes(searchLower)
                    )
                );
            });
        
        // Paginate results
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedOrders = matchingOrders.slice(startIndex, endIndex);
        
        res.json({
            data: paginatedOrders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: matchingOrders.length,
                totalPages: Math.ceil(matchingOrders.length / limitNum),
                hasNext: endIndex < matchingOrders.length,
                hasPrev: pageNum > 1
            },
            search: {
                query: searchQuery,
                dateRange,
                resultsFound: matchingOrders.length
            },
            metadata: {
                queryTime: Date.now(),
                searchExecuted: true
            }
        });
        
    } catch (error) {
        console.error('Error searching orders:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// 5. UPDATE ORDER STATUS (With history tracking)
router.put('/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const userId = req.user?.email || 'system';
        
        if (!['new', 'preparing', 'ready', 'served'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        // Find the order across all venues (for efficiency in high-volume scenarios)
        const orderQuery = await db.collectionGroup('orders')
            .where(admin.firestore.FieldPath.documentId(), '==', orderId)
            .limit(1)
            .get();
        
        if (orderQuery.empty) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const orderDoc = orderQuery.docs[0];
        const orderData = orderDoc.data();
        const previousStatus = orderData.status;
        
        // Prepare update data with timestamps
        const updateData = {
            status,
            updatedAt: FieldValue.serverTimestamp()
        };
        
        // Add status-specific timestamps
        if (status === 'preparing' && previousStatus === 'new') {
            updateData.preparedAt = FieldValue.serverTimestamp();
        } else if (status === 'ready' && previousStatus === 'preparing') {
            updateData.readyAt = FieldValue.serverTimestamp();
        } else if (status === 'served' && previousStatus === 'ready') {
            updateData.servedAt = FieldValue.serverTimestamp();
        }
        
        // Update order in transaction
        await db.runTransaction(async (transaction) => {
            // Update order status
            transaction.update(orderDoc.ref, updateData);
            
            // Add to status history
            const historyRef = orderDoc.ref.collection('statusHistory').doc();
            transaction.set(historyRef, {
                previousStatus,
                newStatus: status,
                changedBy: userId,
                changedAt: FieldValue.serverTimestamp(),
                orderId: orderId
            });
        });
        
        // Get updated order for response
        const updatedOrder = await orderDoc.ref.get();
        const formattedOrder = formatOrderResponse(updatedOrder);
        
        res.json({
            message: 'Order status updated successfully',
            orderId,
            status,
            order: formattedOrder,
            metadata: {
                previousStatus,
                changedBy: userId,
                timestamp: new Date().toISOString()
            }
        });
        
        // TODO: Trigger real-time update to connected clients
        // await broadcastOrderUpdate(orderData.venueId, {
        //     type: 'status_changed',
        //     orderId,
        //     order: formattedOrder,
        //     changes: [{ field: 'status', oldValue: previousStatus, newValue: status }]
        // });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// 6. GET DAILY ANALYTICS
router.get('/venues/:venueId/analytics/daily', async (req, res) => {
    try {
        const { venueId } = req.params;
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        
        const targetDate = new Date(date);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const ordersQuery = db.collection('venues')
            .doc(venueId)
            .collection('orders')
            .where('createdAt', '>=', targetDate)
            .where('createdAt', '<', nextDate);
        
        const snapshot = await ordersQuery.get();
        const orders = snapshot.docs.map(doc => doc.data());
        
        // Calculate analytics
        const analytics = {
            date,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
            avgOrderValue: 0,
            ordersByStatus: {
                new: orders.filter(o => o.status === 'new').length,
                preparing: orders.filter(o => o.status === 'preparing').length,
                ready: orders.filter(o => o.status === 'ready').length,
                served: orders.filter(o => o.status === 'served').length
            },
            ordersByHour: {},
            popularItems: {},
            peakHour: { hour: 0, count: 0 }
        };
        
        analytics.avgOrderValue = analytics.totalOrders > 0 
            ? analytics.totalRevenue / analytics.totalOrders 
            : 0;
        
        // Calculate hourly distribution
        orders.forEach(order => {
            const hour = new Date(order.createdAt.toDate()).getHours();
            analytics.ordersByHour[hour] = (analytics.ordersByHour[hour] || 0) + 1;
            
            // Track popular items
            order.items?.forEach(item => {
                analytics.popularItems[item.name] = (analytics.popularItems[item.name] || 0) + item.quantity;
            });
        });
        
        // Find peak hour
        let maxOrders = 0;
        Object.entries(analytics.ordersByHour).forEach(([hour, count]) => {
            if (count > maxOrders) {
                maxOrders = count;
                analytics.peakHour = { hour: parseInt(hour), count };
            }
        });
        
        res.json(analytics);
        
    } catch (error) {
        console.error('Error fetching daily analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// 7. BULK OPERATIONS (For efficient management)
router.post('/venues/:venueId/orders/bulk-update', async (req, res) => {
    try {
        const { venueId } = req.params;
        const { orderIds, action, data } = req.body;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ error: 'Order IDs required' });
        }
        
        if (orderIds.length > 50) {
            return res.status(400).json({ error: 'Maximum 50 orders per bulk operation' });
        }
        
        const results = [];
        const batch = db.batch();
        
        for (const orderId of orderIds) {
            const orderRef = db.collection('venues').doc(venueId).collection('orders').doc(orderId);
            
            if (action === 'updateStatus' && data.status) {
                batch.update(orderRef, {
                    status: data.status,
                    updatedAt: FieldValue.serverTimestamp()
                });
                results.push({ orderId, action: 'updated' });
            }
        }
        
        await batch.commit();
        
        res.json({
            message: `Bulk ${action} completed`,
            processed: results.length,
            results
        });
        
    } catch (error) {
        console.error('Error in bulk operation:', error);
        res.status(500).json({ error: 'Bulk operation failed' });
    }
});

module.exports = router;