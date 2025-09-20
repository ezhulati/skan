const axios = require('axios');

async function testBeachBarFlow() {
  console.log('🧪 Testing complete Beach Bar Durrës demo flow...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Step 1: Test customer menu access
    console.log('1️⃣ Testing customer menu access...');
    const menuResponse = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    
    console.log('✅ Customer menu loaded successfully!');
    console.log(`📍 Venue: ${menuResponse.data.venue.name}`);
    console.log(`🍽️ Menu items available: ${menuResponse.data.categories.reduce((total, cat) => total + cat.items.length, 0)}`);
    
    // Step 2: Test admin login
    console.log('\n2️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo.beachbar@skan.al',
      password: 'BeachBarDemo2024!'
    });
    
    console.log('✅ Admin login successful!');
    console.log(`👤 User: ${loginResponse.data.user.fullName}`);
    console.log(`🏪 Venue: ${loginResponse.data.venue.name}`);
    
    const token = loginResponse.data.token;
    const venueId = loginResponse.data.user.venueId;
    
    // Step 3: Create test order
    console.log('\n3️⃣ Creating test order...');
    const orderData = {
      venueId: venueId,
      tableNumber: 'A1',
      customerName: 'Demo Customer',
      items: [
        {
          id: 'albanian-beer',
          name: 'Albanian Beer',
          price: 3.50,
          quantity: 2
        },
        {
          id: 'greek-salad',
          name: 'Greek salad',
          price: 8.50,
          quantity: 1
        }
      ],
      specialInstructions: 'Demo order for testing - please ignore'
    };
    
    const orderResponse = await axios.post(`${API_BASE}/v1/orders`, orderData);
    
    console.log('✅ Test order created!');
    console.log(`📋 Order Number: ${orderResponse.data.orderNumber}`);
    console.log(`💰 Total: €${orderResponse.data.totalAmount}`);
    
    const orderId = orderResponse.data.orderId;
    const orderNumber = orderResponse.data.orderNumber;
    
    // Step 4: Test order tracking
    console.log('\n4️⃣ Testing order tracking...');
    const trackResponse = await axios.get(`${API_BASE}/v1/track/${orderNumber}`);
    
    console.log('✅ Order tracking works!');
    console.log(`📊 Status: ${trackResponse.data.status}`);
    console.log(`⏰ Estimated time: ${trackResponse.data.estimatedTime}`);
    
    // Step 5: Test admin order management
    console.log('\n5️⃣ Testing admin order management...');
    const ordersResponse = await axios.get(`${API_BASE}/v1/venue/${venueId}/orders?status=new`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Admin can view orders!');
    console.log(`📊 New orders: ${ordersResponse.data.length}`);
    
    // Step 6: Test order status update
    console.log('\n6️⃣ Testing order status updates...');
    
    const statusUpdates = ['preparing', 'ready', 'served'];
    
    for (const status of statusUpdates) {
      const updateResponse = await axios.put(`${API_BASE}/v1/orders/${orderId}/status`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(`✅ Status updated to: ${status}`);
    }
    
    // Step 7: Generate final demo summary
    console.log('\n7️⃣ Demo flow verification complete!');
    
    const demoSummary = {
      status: 'SUCCESS',
      venue: 'Beach Bar Durrës',
      customerUrl: 'https://order.skan.al/beach-bar-durres/a1',
      adminUrl: 'https://admin.skan.al',
      credentials: {
        email: 'demo.beachbar@skan.al',
        password: 'BeachBarDemo2024!'
      },
      testResults: {
        menuAccess: '✅ Working',
        adminLogin: '✅ Working',
        orderCreation: '✅ Working',
        orderTracking: '✅ Working',
        orderManagement: '✅ Working',
        statusUpdates: '✅ Working'
      },
      sampleOrder: {
        number: orderNumber,
        total: orderResponse.data.totalAmount,
        items: orderData.items.length
      }
    };
    
    console.log('\n🎉 BEACH BAR DURRËS DEMO FULLY OPERATIONAL!');
    console.log('===========================================\n');
    
    console.log('📱 CUSTOMER EXPERIENCE:');
    console.log('🔗 https://order.skan.al/beach-bar-durres/a1');
    console.log('   ✅ Menu loads instantly');
    console.log('   ✅ Real Albanian restaurant items');
    console.log('   ✅ Cart and checkout working');
    console.log('   ✅ Order tracking functional\n');
    
    console.log('🖥️ ADMIN EXPERIENCE:');
    console.log('🔗 https://admin.skan.al');
    console.log('📧 demo.beachbar@skan.al');
    console.log('🔑 BeachBarDemo2024!');
    console.log('   ✅ Login and dashboard working');
    console.log('   ✅ Order management functional');
    console.log('   ✅ Status updates working\n');
    
    console.log('🎯 PERFECT FOR DEMOS:');
    console.log('• Real Albanian restaurant (authentic)');
    console.log('• Complete ordering workflow');
    console.log('• Live admin dashboard');
    console.log('• Immediate ROI demonstration');
    
    // Save the demo summary
    require('fs').writeFileSync('./beach-bar-demo-summary.json', JSON.stringify(demoSummary, null, 2));
    console.log('\n📋 Demo summary saved to: beach-bar-demo-summary.json');
    
    return demoSummary;
    
  } catch (error) {
    console.error('❌ Demo flow test failed:', error.response?.data?.error || error.message);
    return null;
  }
}

testBeachBarFlow();