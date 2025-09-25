// Real-time WebSocket Service for Order Management
// Handles live updates for order status changes, new orders, etc.

const WebSocket = require('ws');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

class RealtimeOrderService {
    constructor() {
        this.connections = new Map(); // venueId -> Set of WebSocket connections
        this.userConnections = new Map(); // userId -> WebSocket connection
        this.updateQueue = new Map(); // venueId -> Array of pending updates
        this.db = admin.firestore();
        this.jwtSecret = process.env.JWT_SECRET || 'development-secret';
        
        // Batch updates every second for performance
        setInterval(() => this.processBatchedUpdates(), 1000);
    }
    
    // Initialize WebSocket server
    initializeWebSocketServer(server) {
        this.wss = new WebSocket.Server({ 
            server,
            path: '/api/v1/realtime'
        });
        
        this.wss.on('connection', (ws, request) => {
            this.handleConnection(ws, request);
        });
        
        console.log('Real-time WebSocket server initialized');
    }
    
    // Handle new WebSocket connection
    async handleConnection(ws, request) {
        try {
            // Extract authentication token from query params or headers
            const url = new URL(request.url, `http://${request.headers.host}`);
            const requestedVenueId = url.searchParams.get('venueId');
            const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                ws.close(1008, 'Authentication required');
                return;
            }
            
            // Verify JWT token
            const decoded = jwt.verify(token, this.jwtSecret);
            const { userId, venueId, role } = decoded;
            
            if (!venueId) {
                ws.close(1008, 'Venue ID required');
                return;
            }

            if (requestedVenueId && requestedVenueId !== venueId) {
                ws.close(1008, 'Invalid venue context');
                return;
            }
            
            // Store connection metadata
            ws.userId = userId;
            ws.venueId = venueId;
            ws.role = role;
            ws.connectedAt = new Date();
            ws.lastPing = Date.now();
            
            // Add to venue connections
            if (!this.connections.has(venueId)) {
                this.connections.set(venueId, new Set());
            }
            this.connections.get(venueId).add(ws);
            
            // Add to user connections
            this.userConnections.set(userId, ws);
            
            console.log(`User ${userId} connected to venue ${venueId} (role: ${role})`);
            
            // Send initial connection confirmation
            this.sendToConnection(ws, {
                type: 'connection_established',
                venueId,
                timestamp: new Date().toISOString(),
                activeConnections: this.connections.get(venueId).size
            });
            
            // Send any cached updates for this venue
            await this.sendCachedUpdates(ws, venueId);
            
            // Handle incoming messages
            ws.on('message', (data) => this.handleMessage(ws, data));
            
            // Handle connection close
            ws.on('close', () => this.handleDisconnection(ws));
            
            // Handle ping/pong for connection health
            ws.on('pong', () => {
                ws.lastPing = Date.now();
            });
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
            ws.close(1008, 'Authentication failed');
        }
    }
    
    // Handle incoming WebSocket messages
    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'ping':
                    this.sendToConnection(ws, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                    
                case 'subscribe_notifications':
                    ws.notificationsEnabled = message.enabled;
                    break;
                    
                case 'request_active_orders':
                    this.sendActiveOrdersUpdate(ws);
                    break;
                    
                default:
                    console.log(`Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }
    
    // Handle WebSocket disconnection
    handleDisconnection(ws) {
        const { userId, venueId } = ws;
        
        // Remove from venue connections
        if (venueId && this.connections.has(venueId)) {
            this.connections.get(venueId).delete(ws);
            if (this.connections.get(venueId).size === 0) {
                this.connections.delete(venueId);
            }
        }
        
        // Remove from user connections
        if (userId) {
            this.userConnections.delete(userId);
        }
        
        console.log(`User ${userId} disconnected from venue ${venueId}`);
    }
    
    // Send message to specific connection
    sendToConnection(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                ...message,
                timestamp: message.timestamp || new Date().toISOString()
            }));
        }
    }
    
    // Broadcast update to all connections for a venue
    broadcastToVenue(venueId, update) {
        const connections = this.connections.get(venueId);
        if (!connections || connections.size === 0) {
            // No active connections, cache the update
            this.cacheUpdate(venueId, update);
            return;
        }
        
        const message = JSON.stringify({
            ...update,
            timestamp: new Date().toISOString()
        });
        
        connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            } else {
                // Clean up dead connections
                connections.delete(ws);
            }
        });
        
        // Also cache for recently disconnected clients
        this.cacheUpdate(venueId, update);
    }
    
    // Cache updates for clients that reconnect
    cacheUpdate(venueId, update) {
        if (!this.updateQueue.has(venueId)) {
            this.updateQueue.set(venueId, []);
        }
        
        const queue = this.updateQueue.get(venueId);
        const cachedUpdate = {
            ...update,
            cachedAt: new Date().toISOString()
        };
        queue.push(cachedUpdate);
        
        // Keep only last 50 updates per venue
        if (queue.length > 50) {
            queue.splice(0, queue.length - 50);
        }
        
        // Auto-expire cached updates after 1 hour
        setTimeout(() => {
            const currentQueue = this.updateQueue.get(venueId);
            if (currentQueue) {
                const index = currentQueue.findIndex(u => u.cachedAt === cachedUpdate.cachedAt && u.type === cachedUpdate.type && u.orderId === cachedUpdate.orderId);
                if (index !== -1) {
                    currentQueue.splice(index, 1);
                }
            }
        }, 3600000); // 1 hour
    }
    
    // Send cached updates to newly connected client
    async sendCachedUpdates(ws, venueId) {
        const cachedUpdates = this.updateQueue.get(venueId);
        if (!cachedUpdates || cachedUpdates.length === 0) return;
        
        // Send last 10 cached updates
        const recentUpdates = cachedUpdates.slice(-10);
        
        this.sendToConnection(ws, {
            type: 'cached_updates',
            updates: recentUpdates,
            count: recentUpdates.length
        });
    }
    
    // Process batched updates (called every second)
    processBatchedUpdates() {
        // Health check - ping all connections
        this.connections.forEach((connections, venueId) => {
            connections.forEach(ws => {
                if (Date.now() - ws.lastPing > 60000) { // 60 seconds
                    ws.ping();
                }
                
                // Close stale connections
                if (Date.now() - ws.lastPing > 300000) { // 5 minutes
                    ws.close(1001, 'Connection timeout');
                }
            });
        });
    }
    
    // Public API methods for triggering updates
    
    // Notify when new order is created
    async notifyOrderCreated(venueId, order) {
        const update = {
            type: 'order_created',
            orderId: order.id,
            order: order,
            event: 'new_order'
        };
        
        this.broadcastToVenue(venueId, update);
        
        // Send push notification to mobile devices (if implemented)
        await this.sendPushNotification(venueId, {
            title: 'New Order!',
            body: `Order ${order.orderNumber} from Table ${order.tableNumber}`,
            data: { orderId: order.id, type: 'new_order' }
        });
    }
    
    // Notify when order status changes
    async notifyOrderStatusChanged(venueId, orderId, oldStatus, newStatus, order) {
        const update = {
            type: 'order_status_changed',
            orderId: orderId,
            order: order,
            changes: {
                status: { from: oldStatus, to: newStatus }
            },
            event: 'status_change'
        };
        
        this.broadcastToVenue(venueId, update);
    }
    
    // Notify when order is updated
    async notifyOrderUpdated(venueId, orderId, order, changes) {
        const update = {
            type: 'order_updated',
            orderId: orderId,
            order: order,
            changes: changes,
            event: 'order_update'
        };
        
        this.broadcastToVenue(venueId, update);
    }
    
    // Send active orders update to specific connection
    async sendActiveOrdersUpdate(ws) {
        try {
            const { venueId } = ws;
            
            // Fetch current active orders
            const activeQuery = this.db.collection('orders')
                .where('venueId', '==', venueId)
                .where('status', 'in', ['new', 'preparing', 'ready'])
                .orderBy('createdAt', 'desc');

            const snapshot = await activeQuery.get();
            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString()
            }));
            
            this.sendToConnection(ws, {
                type: 'active_orders_update',
                orders: orders,
                counts: {
                    new: orders.filter(o => o.status === 'new').length,
                    preparing: orders.filter(o => o.status === 'preparing').length,
                    ready: orders.filter(o => o.status === 'ready').length
                }
            });
            
        } catch (error) {
            console.error('Error sending active orders update:', error);
        }
    }
    
    // Send push notification (placeholder for mobile app integration)
    async sendPushNotification(venueId, notification) {
        // TODO: Implement push notification service
        // This would integrate with Firebase Cloud Messaging for mobile apps
        console.log(`Push notification for venue ${venueId}:`, notification);
    }
    
    // Get connection statistics
    getConnectionStats() {
        const stats = {
            totalConnections: 0,
            venueConnections: {},
            totalVenues: this.connections.size
        };
        
        this.connections.forEach((connections, venueId) => {
            stats.venueConnections[venueId] = connections.size;
            stats.totalConnections += connections.size;
        });
        
        return stats;
    }
    
    // Cleanup method
    cleanup() {
        this.connections.forEach((connections) => {
            connections.forEach(ws => {
                ws.close(1001, 'Server shutdown');
            });
        });
        
        this.connections.clear();
        this.userConnections.clear();
        this.updateQueue.clear();
    }
}

// Export singleton instance
const realtimeService = new RealtimeOrderService();
module.exports = realtimeService;
