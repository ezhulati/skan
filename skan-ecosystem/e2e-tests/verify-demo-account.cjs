const axios = require('axios');

async function verifyDemoAccount() {
  console.log('🔍 Verifying Beach Bar Durrës demo account access...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  const testCredentials = [
    { email: 'demo.beachbar@skan.al', password: 'BeachBarDemo2024!', name: 'New Demo Account' },
    { email: 'manager_email1@gmail.com', password: 'admin123', name: 'Original Manager Account' },
    { email: 'arditxhanaj@gmail.com', password: 'admin123', name: 'Ardit Account' }
  ];
  
  for (const creds of testCredentials) {
    try {
      console.log(`🔑 Testing ${creds.name}: ${creds.email}`);
      
      const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
        email: creds.email,
        password: creds.password
      });
      
      const user = loginResponse.data.user;
      const venue = loginResponse.data.venue;
      const token = loginResponse.data.token;
      
      console.log(`  ✅ Login successful!`);
      console.log(`  👤 User: ${user.fullName} (${user.role})`);
      console.log(`  📍 Venue: ${venue.name} (${venue.slug})`);
      
      // Check orders for this account
      const ordersResponse = await axios.get(`${API_BASE}/v1/venue/${venue.id}/orders?status=all&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const orders = ordersResponse.data;
      console.log(`  📋 Orders found: ${orders.length}`);
      
      if (orders.length > 0) {
        // Show recent orders
        const recentOrders = orders.slice(0, 5);
        console.log(`  🔔 Recent orders:`);
        recentOrders.forEach(order => {
          const createdAt = new Date(order.createdAt);
          const hoursAgo = Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60) * 10) / 10;
          console.log(`    - ${order.orderNumber} (${order.status}) - ${hoursAgo}h ago - Table ${order.tableNumber}`);
        });
        
        // Count by status
        const statusCounts = {};
        orders.forEach(order => {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });
        console.log(`  📊 By status:`, statusCounts);
        
        // If this is the account with orders, offer to clean it
        if (venue.slug === 'beach-bar-durres' && orders.length > 10) {
          console.log(`\n  🧹 THIS ACCOUNT HAS ${orders.length} ORDERS - NEEDS CLEANUP`);
          return { 
            needsCleanup: true, 
            credentials: creds, 
            venue: venue, 
            token: token,
            orderCount: orders.length,
            orders: orders
          };
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ Login failed: ${error.response?.data?.error || error.message}\n`);
    }
  }
  
  return { needsCleanup: false };
}

verifyDemoAccount().then(result => {
  if (result.needsCleanup) {
    console.log('🎯 Found the account with orders! Run cleanup on this account.');
  } else {
    console.log('✨ No accounts found with excessive orders.');
  }
});