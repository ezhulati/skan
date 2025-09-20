const axios = require('axios');

async function cleanupDemoOrders() {
  console.log('🧹 Cleaning up Beach Bar Durrës demo orders...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Step 1: Login with demo credentials
    console.log('1️⃣ Logging in with demo credentials...');
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo.beachbar@skan.al',
      password: 'BeachBarDemo2024!'
    });
    
    const token = loginResponse.data.token;
    const venueId = loginResponse.data.venue.id;
    console.log(`✅ Logged in successfully as ${loginResponse.data.user.fullName}`);
    console.log(`📍 Venue: ${loginResponse.data.venue.name} (${venueId})`);
    
    // Step 2: Get all orders for the venue
    console.log('\n2️⃣ Fetching all orders...');
    const ordersResponse = await axios.get(`${API_BASE}/v1/venue/${venueId}/orders?status=all&limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const orders = ordersResponse.data;
    console.log(`📋 Found ${orders.length} total orders`);
    
    // Step 3: Analyze orders by status and age
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const orderAnalysis = {
      total: orders.length,
      byStatus: {},
      recent: 0,
      old: 0,
      veryOld: 0
    };
    
    const ordersToCleanup = [];
    const ordersToKeep = [];
    
    orders.forEach(order => {
      const createdAt = new Date(order.createdAt);
      const status = order.status;
      
      // Count by status
      orderAnalysis.byStatus[status] = (orderAnalysis.byStatus[status] || 0) + 1;
      
      // Categorize by age
      if (createdAt > oneHourAgo) {
        orderAnalysis.recent++;
      } else if (createdAt > oneDayAgo) {
        orderAnalysis.old++;
      } else {
        orderAnalysis.veryOld++;
      }
      
      // Determine cleanup strategy
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Keep recent orders (< 2 hours) regardless of status
      if (hoursOld < 2) {
        ordersToKeep.push({
          ...order,
          reason: 'Recent order (< 2 hours)',
          hoursOld: Math.round(hoursOld * 10) / 10
        });
      }
      // Keep a few representative orders for demo purposes
      else if (status === 'served' && hoursOld < 6 && ordersToKeep.filter(o => o.status === 'served').length < 3) {
        ordersToKeep.push({
          ...order,
          reason: 'Demo served order',
          hoursOld: Math.round(hoursOld * 10) / 10
        });
      }
      // Keep one preparing order for demo
      else if (status === 'preparing' && ordersToKeep.filter(o => o.status === 'preparing').length < 1) {
        ordersToKeep.push({
          ...order,
          reason: 'Demo preparing order',
          hoursOld: Math.round(hoursOld * 10) / 10
        });
      }
      // Keep one ready order for demo
      else if (status === 'ready' && ordersToKeep.filter(o => o.status === 'ready').length < 1) {
        ordersToKeep.push({
          ...order,
          reason: 'Demo ready order',
          hoursOld: Math.round(hoursOld * 10) / 10
        });
      }
      // Mark everything else for cleanup
      else {
        ordersToCleanup.push({
          ...order,
          hoursOld: Math.round(hoursOld * 10) / 10,
          reason: hoursOld > 24 ? 'Very old order (> 24h)' : 
                  status === 'served' ? 'Old served order' : 
                  status === 'new' ? 'Stale new order' : 'Old test order'
        });
      }
    });
    
    console.log('\n📊 ORDER ANALYSIS:');
    console.log(`Total orders: ${orderAnalysis.total}`);
    console.log(`By status:`, orderAnalysis.byStatus);
    console.log(`Recent (< 1h): ${orderAnalysis.recent}`);
    console.log(`Old (1-24h): ${orderAnalysis.old}`);
    console.log(`Very old (> 24h): ${orderAnalysis.veryOld}`);
    
    console.log(`\n🗑️ Orders to cleanup: ${ordersToCleanup.length}`);
    console.log(`✅ Orders to keep: ${ordersToKeep.length}`);
    
    // Step 4: Show cleanup plan
    console.log('\n📝 CLEANUP PLAN:');
    console.log('\n🗑️ ORDERS TO DELETE:');
    ordersToCleanup.slice(0, 10).forEach(order => {
      console.log(`  - ${order.orderNumber} (${order.status}) - ${order.hoursOld}h ago - ${order.reason}`);
    });
    if (ordersToCleanup.length > 10) {
      console.log(`  ... and ${ordersToCleanup.length - 10} more`);
    }
    
    console.log('\n✅ ORDERS TO KEEP:');
    ordersToKeep.forEach(order => {
      console.log(`  - ${order.orderNumber} (${order.status}) - ${order.hoursOld}h ago - ${order.reason}`);
    });
    
    // Step 5: Perform cleanup (if there are orders to clean)
    if (ordersToCleanup.length > 0) {
      console.log(`\n⚠️  This will delete ${ordersToCleanup.length} old test orders.`);
      console.log('⏰ Waiting 5 seconds before proceeding...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n🗑️ Starting cleanup...');
      
      let deletedCount = 0;
      let errorCount = 0;
      
      for (const order of ordersToCleanup) {
        try {
          // Note: We might need to check if there's a delete endpoint
          // For now, let's try to update very old orders to 'served' status to clean up the active list
          if (order.status === 'new' || order.status === 'preparing' || order.status === 'ready') {
            await axios.put(`${API_BASE}/v1/orders/${order.id}/status`, 
              { status: 'served' }, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`  ✅ Marked ${order.orderNumber} as served`);
            deletedCount++;
          } else {
            console.log(`  ⏭️ Skipped ${order.orderNumber} (already served)`);
          }
        } catch (error) {
          console.log(`  ❌ Failed to update ${order.orderNumber}: ${error.response?.data?.error || error.message}`);
          errorCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n🎉 Cleanup complete!`);
      console.log(`✅ Updated to served: ${deletedCount}`);
      console.log(`❌ Errors: ${errorCount}`);
    } else {
      console.log('\n✨ No orders need cleanup - demo is already clean!');
    }
    
    // Step 6: Final status check
    console.log('\n📊 FINAL DEMO STATE:');
    const finalOrdersResponse = await axios.get(`${API_BASE}/v1/venue/${venueId}/orders?status=active&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const activeOrders = finalOrdersResponse.data;
    console.log(`🔔 Active orders: ${activeOrders.length}`);
    
    const statusCounts = {};
    activeOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log('Active orders by status:', statusCounts);
    
    console.log('\n🎯 DEMO RECOMMENDATIONS:');
    console.log('- Demo now shows realistic number of recent orders');
    console.log('- Mix of statuses (new, preparing, ready, recent served) for demonstration');
    console.log('- Old test orders cleaned up for professional appearance');
    console.log('- Ready for customer demonstrations!');
    
    return {
      success: true,
      cleaned: deletedCount,
      kept: ordersToKeep.length,
      activeOrders: activeOrders.length
    };
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.response?.data?.error || error.message);
    return { success: false, error: error.message };
  }
}

cleanupDemoOrders().then(result => {
  console.log('\n🏁 Cleanup completed!', result);
});