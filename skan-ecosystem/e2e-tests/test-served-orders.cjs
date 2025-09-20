const axios = require('axios');

// Test script to verify served orders functionality
async function testServedOrdersFlow() {
  console.log('🧪 Testing served orders functionality...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtYW5hZ2VyX2VtYWlsMS5jb20iLCJlbWFpbCI6Im1hbmFnZXJfZW1haWwxQGdtYWlsLmNvbSIsInJvbGUiOiJtYW5hZ2VyIiwidmVudWVJZCI6ImJlYWNoLWJhci1kdXJyZXMiLCJpYXQiOjE3MjY4NDY3MDV9.123'; // Demo token
  
  try {
    // Step 1: Get current orders
    console.log('1️⃣ Fetching current orders...');
    const ordersResponse = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/orders?status=all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const allOrders = ordersResponse.data;
    console.log(`   Found ${allOrders.length} total orders`);
    
    // Step 2: Check served orders specifically
    const servedOrders = allOrders.filter(order => order.status === 'served');
    console.log(`   Found ${servedOrders.length} served orders`);
    
    if (servedOrders.length > 0) {
      console.log('   ✅ Served orders exist in the system:');
      servedOrders.forEach(order => {
        console.log(`      - Order ${order.orderNumber}: ${order.status} (${order.createdAt})`);
      });
    } else {
      console.log('   ⚠️  No served orders found, let\'s create and serve one...');
      
      // Create a test order
      console.log('2️⃣ Creating a test order...');
      const newOrder = await axios.post(`${API_BASE}/v1/orders`, {
        venueId: 'beach-bar-durres',
        tableNumber: 'T99',
        customerName: 'Test Customer - Served Orders',
        items: [
          {
            id: 'test-item',
            name: 'Albanian Beer',
            price: 3.50,
            quantity: 1
          }
        ],
        specialInstructions: 'Test order for served functionality'
      });
      
      const orderId = newOrder.data.orderId;
      console.log(`   ✅ Created order: ${orderId}`);
      
      // Progress the order to served
      console.log('3️⃣ Progressing order through statuses...');
      
      // new -> preparing
      await axios.put(`${API_BASE}/v1/orders/${orderId}/status`, {
        status: 'preparing'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   ✅ Status: new → preparing');
      
      // preparing -> ready
      await axios.put(`${API_BASE}/v1/orders/${orderId}/status`, {
        status: 'ready'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   ✅ Status: preparing → ready');
      
      // ready -> served
      await axios.put(`${API_BASE}/v1/orders/${orderId}/status`, {
        status: 'served'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   ✅ Status: ready → served');
    }
    
    // Step 3: Verify served orders filtering
    console.log('4️⃣ Testing served orders filtering...');
    const servedResponse = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/orders?status=served`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const filteredServedOrders = servedResponse.data;
    console.log(`   API returns ${filteredServedOrders.length} orders when filtering by 'served' status`);
    
    if (filteredServedOrders.length > 0) {
      console.log('   ✅ Served orders filtering works correctly!');
      filteredServedOrders.forEach(order => {
        console.log(`      - ${order.orderNumber}: ${order.status}`);
      });
    } else {
      console.log('   ❌ No served orders returned by API filter');
    }
    
    // Step 4: Check dashboard logic
    console.log('5️⃣ Testing dashboard filtering logic...');
    const allOrdersForDashboard = ordersResponse.data;
    
    // Simulate the dashboard filtering logic
    const dashboardServedOrders = allOrdersForDashboard.filter(order => {
      const selectedStatus = 'served';
      if (selectedStatus === 'all') return true;
      if (selectedStatus === 'active') return ['new', 'preparing', 'ready'].includes(order.status);
      return order.status === selectedStatus;
    });
    
    console.log(`   Dashboard logic would show ${dashboardServedOrders.length} served orders`);
    
    if (dashboardServedOrders.length > 0) {
      console.log('   ✅ Dashboard filtering logic works correctly!');
    } else {
      console.log('   ❌ Dashboard filtering logic has an issue');
    }
    
    console.log('\n🎉 Served orders functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testServedOrdersFlow();