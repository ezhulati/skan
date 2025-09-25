// Background Data Archival Service
// Handles automatic archiving of old orders and data cleanup for enterprise scalability

const admin = require('firebase-admin');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');

class DataArchivalService {
    constructor() {
        this.db = admin.firestore();
        this.isRunning = false;
        this.archivalConfig = {
            // Archive orders older than 30 days
            orderArchivalDays: 30,
            // Keep active orders indefinitely (until served)
            keepActiveOrders: true,
            // Batch size for processing orders
            batchSize: 100,
            // Generate daily summaries for analytics
            generateDailySummaries: true,
            // Keep detailed logs for debugging
            enableLogging: true
        };
        
        // Schedule daily archival at 2 AM
        this.scheduleArchival();
    }

    // Schedule automatic archival process
    scheduleArchival() {
        const now = new Date();
        const tomorrow2AM = new Date(now);
        tomorrow2AM.setDate(now.getDate() + 1);
        tomorrow2AM.setHours(2, 0, 0, 0);
        
        const msUntil2AM = tomorrow2AM.getTime() - now.getTime();
        
        setTimeout(() => {
            this.runDailyArchival();
            
            // Then run every 24 hours
            setInterval(() => {
                this.runDailyArchival();
            }, 24 * 60 * 60 * 1000);
        }, msUntil2AM);
        
        this.log('Archival service scheduled to run daily at 2:00 AM');
    }

    // Main daily archival process
    async runDailyArchival() {
        if (this.isRunning) {
            this.log('Archival process already running, skipping');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();
        
        try {
            this.log('Starting daily archival process');
            
            const results = {
                ordersArchived: 0,
                summariesGenerated: 0,
                notificationsCleared: 0,
                errors: []
            };

            // 1. Archive old orders
            try {
                results.ordersArchived = await this.archiveOldOrders();
            } catch (error) {
                results.errors.push(`Order archival failed: ${error.message}`);
                this.log(`Error archiving orders: ${error.message}`, 'error');
            }

            // 2. Generate daily summaries
            if (this.archivalConfig.generateDailySummaries) {
                try {
                    results.summariesGenerated = await this.generateDailySummaries();
                } catch (error) {
                    results.errors.push(`Summary generation failed: ${error.message}`);
                    this.log(`Error generating summaries: ${error.message}`, 'error');
                }
            }

            // 3. Clean up old notifications
            try {
                results.notificationsCleared = await this.cleanupOldNotifications();
            } catch (error) {
                results.errors.push(`Notification cleanup failed: ${error.message}`);
                this.log(`Error cleaning notifications: ${error.message}`, 'error');
            }

            // 4. Optimize indexes (if needed)
            try {
                await this.optimizeIndexes();
            } catch (error) {
                results.errors.push(`Index optimization failed: ${error.message}`);
                this.log(`Error optimizing indexes: ${error.message}`, 'error');
            }

            const duration = Date.now() - startTime;
            this.log(`Daily archival completed in ${duration}ms: ${JSON.stringify(results)}`);

            // Send admin notification if there were errors
            if (results.errors.length > 0) {
                await this.notifyAdmins('Daily archival completed with errors', results);
            }

        } catch (error) {
            this.log(`Daily archival failed: ${error.message}`, 'error');
            await this.notifyAdmins('Daily archival failed', { error: error.message });
        } finally {
            this.isRunning = false;
        }
    }

    // Archive orders older than the configured number of days
    async archiveOldOrders() {
        const cutoffDate = subDays(new Date(), this.archivalConfig.orderArchivalDays);
        let archivedCount = 0;
        let lastDoc = null;

        this.log(`Archiving orders older than ${format(cutoffDate, 'yyyy-MM-dd')}`);

        do {
            // Get batch of old served orders
            let query = this.db.collectionGroup('orders')
                .where('status', '==', 'served')
                .where('servedAt', '<', cutoffDate)
                .where('archivedAt', '==', null)
                .limit(this.archivalConfig.batchSize)
                .orderBy('servedAt');

            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();
            
            if (snapshot.empty) {
                break;
            }

            const batch = this.db.batch();
            const archiveTimestamp = new Date();

            snapshot.docs.forEach(doc => {
                // Update order with archive timestamp
                batch.update(doc.ref, {
                    archivedAt: archiveTimestamp,
                    updatedAt: archiveTimestamp
                });

                // Optionally move to archive collection for better performance
                // const archiveRef = this.db.collection('archived_orders').doc(doc.id);
                // batch.set(archiveRef, { ...doc.data(), archivedAt: archiveTimestamp });
            });

            await batch.commit();
            archivedCount += snapshot.docs.length;
            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            this.log(`Archived batch of ${snapshot.docs.length} orders (total: ${archivedCount})`);

        } while (lastDoc);

        this.log(`Archival complete: ${archivedCount} orders archived`);
        return archivedCount;
    }

    // Generate daily analytics summaries for each venue
    async generateDailySummaries() {
        const yesterday = subDays(new Date(), 1);
        const dayStart = startOfDay(yesterday);
        const dayEnd = endOfDay(yesterday);
        
        this.log(`Generating daily summaries for ${format(yesterday, 'yyyy-MM-dd')}`);

        // Get all active venues
        const venuesSnapshot = await this.db.collection('venue').where('isActive', '==', true).get();
        let summariesGenerated = 0;

        for (const venueDoc of venuesSnapshot.docs) {
            try {
                const venueId = venueDoc.id;
                const summary = await this.generateVenueDailySummary(venueId, dayStart, dayEnd);
                
                if (summary.totalOrders > 0) {
                    // Save summary to analytics collection
                    const summaryRef = this.db.collection('daily_summaries').doc(`${venueId}_${format(yesterday, 'yyyy-MM-dd')}`);
                    await summaryRef.set({
                        venueId,
                        date: yesterday,
                        ...summary,
                        generatedAt: new Date()
                    });
                    
                    summariesGenerated++;
                    this.log(`Generated summary for venue ${venueId}: ${summary.totalOrders} orders, €${summary.totalRevenue.toFixed(2)} revenue`);
                }
            } catch (error) {
                this.log(`Failed to generate summary for venue ${venueDoc.id}: ${error.message}`, 'error');
            }
        }

        this.log(`Generated ${summariesGenerated} daily summaries`);
        return summariesGenerated;
    }

    // Generate daily summary for a specific venue
    async generateVenueDailySummary(venueId, dayStart, dayEnd) {
        // Query orders for the specific day
        const ordersSnapshot = await this.db.collection('orders')
            .where('venueId', '==', venueId)
            .where('createdAt', '>=', dayStart)
            .where('createdAt', '<=', dayEnd)
            .get();

        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (orders.length === 0) {
            return {
                totalOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                ordersByStatus: {},
                peakHour: null,
                topItems: []
            };
        }

        // Calculate basic metrics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const averageOrderValue = totalRevenue / totalOrders;

        // Orders by status
        const ordersByStatus = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        // Peak hour analysis
        const hourCounts = {};
        orders.forEach(order => {
            const hour = new Date(order.createdAt.toDate()).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourCounts).reduce((peak, [hour, count]) => 
            count > peak.count ? { hour: parseInt(hour), count } : peak, 
            { hour: 0, count: 0 }
        );

        // Top selling items
        const itemCounts = {};
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (!itemCounts[item.name]) {
                        itemCounts[item.name] = { quantity: 0, revenue: 0 };
                    }
                    itemCounts[item.name].quantity += item.quantity || 1;
                    itemCounts[item.name].revenue += (item.price || 0) * (item.quantity || 1);
                });
            }
        });

        const topItems = Object.entries(itemCounts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            ordersByStatus,
            peakHour: peakHour.count > 0 ? `${peakHour.hour.toString().padStart(2, '0')}:00` : null,
            topItems
        };
    }

    // Clean up old notification logs and cache entries
    async cleanupOldNotifications() {
        const cutoffDate = subDays(new Date(), 7); // Keep notifications for 7 days
        let clearedCount = 0;

        try {
            // Clean up notification logs (if implemented)
            const notificationsSnapshot = await this.db.collection('notification_logs')
                .where('createdAt', '<', cutoffDate)
                .limit(this.archivalConfig.batchSize)
                .get();

            if (!notificationsSnapshot.empty) {
                const batch = this.db.batch();
                notificationsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                clearedCount = notificationsSnapshot.docs.length;
            }

            this.log(`Cleaned up ${clearedCount} old notifications`);
            return clearedCount;
        } catch (error) {
            this.log(`Error cleaning notifications: ${error.message}`, 'error');
            return 0;
        }
    }

    // Optimize database indexes and cleanup (placeholder for future implementation)
    async optimizeIndexes() {
        // This would typically involve:
        // 1. Analyzing query patterns
        // 2. Identifying missing indexes
        // 3. Cleaning up unused indexes
        // 4. Optimizing composite indexes
        
        this.log('Index optimization completed (placeholder)');
    }

    // Send notifications to system administrators
    async notifyAdmins(subject, data) {
        try {
            // In a real implementation, this would send emails or push notifications
            // For now, we'll log to the admin notification collection
            await this.db.collection('admin_notifications').add({
                subject,
                data,
                severity: data.errors && data.errors.length > 0 ? 'error' : 'info',
                createdAt: new Date(),
                read: false
            });

            this.log(`Admin notification sent: ${subject}`);
        } catch (error) {
            this.log(`Failed to send admin notification: ${error.message}`, 'error');
        }
    }

    // Manual archival trigger (for testing or emergency cleanup)
    async manualArchival(options = {}) {
        const config = { ...this.archivalConfig, ...options };
        this.log('Manual archival triggered', 'info', config);
        
        if (config.archiveOnly) {
            return await this.archiveOldOrders();
        }
        
        if (config.summaryOnly) {
            return await this.generateDailySummaries();
        }
        
        return await this.runDailyArchival();
    }

    // Get archival statistics
    async getArchivalStats() {
        try {
            // Count total orders
            const totalOrdersSnapshot = await this.db.collectionGroup('orders').count().get();
            const totalOrders = totalOrdersSnapshot.data().count;

            // Count archived orders
            const archivedOrdersSnapshot = await this.db.collectionGroup('orders')
                .where('archivedAt', '!=', null)
                .count()
                .get();
            const archivedOrders = archivedOrdersSnapshot.data().count;

            // Count active orders
            const activeOrdersSnapshot = await this.db.collectionGroup('orders')
                .where('status', 'in', ['new', 'preparing', 'ready'])
                .count()
                .get();
            const activeOrders = activeOrdersSnapshot.data().count;

            // Get recent summaries count
            const recentSummariesSnapshot = await this.db.collection('daily_summaries')
                .where('generatedAt', '>=', subDays(new Date(), 7))
                .count()
                .get();
            const recentSummaries = recentSummariesSnapshot.data().count;

            return {
                totalOrders,
                archivedOrders,
                activeOrders,
                servedOrders: totalOrders - archivedOrders - activeOrders,
                recentSummaries,
                archivalPercentage: totalOrders > 0 ? ((archivedOrders / totalOrders) * 100).toFixed(1) : 0,
                lastRun: this.lastRunTime,
                isRunning: this.isRunning
            };
        } catch (error) {
            this.log(`Error getting archival stats: ${error.message}`, 'error');
            return { error: error.message };
        }
    }

    // Logging utility
    log(message, level = 'info', data = null) {
        if (!this.archivalConfig.enableLogging && level !== 'error') {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            service: 'DataArchivalService',
            ...(data && { data })
        };

        // Console logging
        console.log(`[${timestamp}] [${level.toUpperCase()}] DataArchivalService: ${message}`, data || '');

        // Optionally store in database for monitoring
        if (level === 'error') {
            this.db.collection('service_logs').add(logEntry).catch(err => {
                console.error('Failed to log to database:', err);
            });
        }
    }

    // Graceful shutdown
    async shutdown() {
        this.log('Shutting down archival service');
        // Wait for current process to complete
        while (this.isRunning) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.log('Archival service shutdown complete');
    }
}

// Export singleton instance
const dataArchivalService = new DataArchivalService();

// HTTP endpoints for manual control (to be added to main API)
const archivalRoutes = {
    // GET /api/v1/admin/archival/stats
    getStats: async (req, res) => {
        try {
            const stats = await dataArchivalService.getArchivalStats();
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // POST /api/v1/admin/archival/manual
    manualArchival: async (req, res) => {
        try {
            const options = req.body;
            const result = await dataArchivalService.manualArchival(options);
            res.json({ success: true, result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // GET /api/v1/admin/archival/config
    getConfig: async (req, res) => {
        res.json({ success: true, config: dataArchivalService.archivalConfig });
    },

    // PUT /api/v1/admin/archival/config
    updateConfig: async (req, res) => {
        try {
            const newConfig = req.body;
            dataArchivalService.archivalConfig = { ...dataArchivalService.archivalConfig, ...newConfig };
            res.json({ success: true, config: dataArchivalService.archivalConfig });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = {
    dataArchivalService,
    archivalRoutes
};
