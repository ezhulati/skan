const axios = require('axios');

async function comprehensiveOrderCleanup() {
  console.log('🧹 Comprehensive Beach Bar Durrës Order Cleanup\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  // Prompt user for credentials since auto-detection didn't work
  console.log('🔑 CREDENTIAL OPTIONS:');
  console.log('1. demo.beachbar@skan.al / BeachBarDemo2024!');
  console.log('2. manager_email1@gmail.com / admin123');
  console.log('3. Custom credentials');
  console.log('\nSince you see 26 orders but my scripts found 0, you might be using different credentials.');
  console.log('Let me try a comprehensive approach...\n');
  
  // Try the main demo account first
  const credentials = { email: 'demo.beachbar@skan.al', password: 'BeachBarDemo2024!' };
  
  try {
    console.log(`📧 Attempting login with: ${credentials.email}`);
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, credentials);
    
    const token = loginResponse.data.token;
    const venue = loginResponse.data.venue;
    const user = loginResponse.data.user;
    
    console.log(`✅ Login successful!`);
    console.log(`👤 User: ${user.fullName} (${user.role})`);
    console.log(`📍 Venue: ${venue.name} (${venue.slug})`);
    
    if (venue.slug !== 'beach-bar-durres') {
      console.log(`❌ Wrong venue! Expected 'beach-bar-durres', got '${venue.slug}'`);
      return;
    }
    
    // Get ALL orders with increased limit
    console.log(`\n📋 Fetching ALL orders...`);
    const allOrdersResponse = await axios.get(`${API_BASE}/v1/venue/${venue.id}/orders?status=all&limit=200`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const allOrders = allOrdersResponse.data;
    console.log(`📊 Found ${allOrders.length} total orders`);
    
    if (allOrders.length === 0) {
      console.log('🤔 No orders found. The orders you see might be:');
      console.log('1. Cached in your browser');
      console.log('2. From a different account');
      console.log('3. Test data not accessible via API');
      console.log('\nTry refreshing your admin portal or clearing browser cache.');
      return;
    }
    
    // Analyze orders
    const now = new Date();
    const analysis = {
      total: allOrders.length,
      byStatus: {},
      oldCount: 0,
      veryOldCount: 0
    };
    
    const ordersToServe = [];
    
    allOrders.forEach(order => {
      const status = order.status;
      analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;
      
      const createdAt = new Date(order.createdAt);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursOld > 24) analysis.veryOldCount++;
      if (hoursOld > 2) analysis.oldCount++;
      
      // Mark old non-served orders for cleanup
      if (hoursOld > 1 && (status === 'new' || status === 'preparing' || status === 'ready')) {
        ordersToServe.push({ ...order, hoursOld: Math.round(hoursOld * 10) / 10 });
      }
    });
    
    console.log(`\n📈 ORDER ANALYSIS:`);
    console.log(`Total: ${analysis.total}`);
    console.log(`By status:`, analysis.byStatus);
    console.log(`Old (>2h): ${analysis.oldCount}`);
    console.log(`Very old (>24h): ${analysis.veryOldCount}`);
    console.log(`Orders to serve: ${ordersToServe.length}`);
    
    // Show what we'll clean up
    if (ordersToServe.length > 0) {
      console.log(`\n🗑️ ORDERS TO MARK AS SERVED:`);
      ordersToServe.slice(0, 10).forEach(order => {
        console.log(`  - ${order.orderNumber} (${order.status}) - ${order.hoursOld}h old - Table ${order.tableNumber}`);
      });
      if (ordersToServe.length > 10) {
        console.log(`  ... and ${ordersToServe.length - 10} more`);
      }
      
      console.log(`\n⚠️  About to mark ${ordersToServe.length} old orders as SERVED to clean up the active list.`);
      console.log('⏰ Proceeding in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`\n🚀 Starting cleanup...`);
      let successCount = 0;
      let errorCount = 0;
      
      for (const order of ordersToServe) {
        try {
          await axios.put(`${API_BASE}/v1/orders/${order.id}/status`, 
            { status: 'served' }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log(`  ✅ ${order.orderNumber} → served`);
          successCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.log(`  ❌ Failed ${order.orderNumber}: ${error.response?.data?.error || error.message}`);
          errorCount++;
        }
      }
      
      console.log(`\n🎉 CLEANUP COMPLETE!`);
      console.log(`✅ Successfully served: ${successCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      
      // Final check
      const activeOrdersResponse = await axios.get(`${API_BASE}/v1/venue/${venue.id}/orders?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`\n📊 FINAL STATE:`);
      console.log(`🔔 Active orders remaining: ${activeOrdersResponse.data.length}`);
      
      const activeCounts = {};
      activeOrdersResponse.data.forEach(order => {
        activeCounts[order.status] = (activeCounts[order.status] || 0) + 1;
      });
      console.log(`Active by status:`, activeCounts);
      
    } else {
      console.log(`\n✨ No old orders found that need cleanup!`);
    }
    
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`- Refresh your admin portal (hard refresh: Cmd+Shift+R)`);
    console.log(`- Clear browser cache if orders still appear`);
    console.log(`- Demo should now show clean, realistic order history`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Authentication failed. The orders you see might be from:');
      console.log('- A different account with different credentials');
      console.log('- Cached data in your browser');
      console.log('\nPlease check which account you\'re actually logged into in the admin portal.');
    }
  }
}

comprehensiveOrderCleanup();