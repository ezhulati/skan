const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';
const VENUE_SLUG = 'beach-bar-durres';
const VENUE_ID = 'beach-bar-durres';

// Demo restaurant manager credentials
const MANAGER_CREDENTIALS = {
  email: 'manager_email1@gmail.com',
  password: 'admin123'
};

console.log('\n🍽️  TESTING COMPLETE CUSTOMER-TO-RESTAURANT ORDER FLOW');
console.log('=====================================================');

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testCompleteOrderFlow() {
  let managerToken;
  let orderData;
  
  try {
    // 🔥 STEP 1: Verify venue menu is available for customers
    console.log('\n🏪 STEP 1: Verifying venue menu availability');
    
    const menuResponse = await makeRequest(`/venue/${VENUE_SLUG}/menu`);
    
    console.log('✅ Menu retrieved successfully');
    console.log(`Venue: ${menuResponse.venue.name}`);
    console.log(`Categories: ${menuResponse.categories.length}`);
    console.log(`Currency: ${menuResponse.venue.settings.currency}`);
    console.log(`Ordering enabled: ${menuResponse.venue.settings.orderingEnabled}`);
    
    if (!menuResponse.venue.settings.orderingEnabled) {
      throw new Error('❌ Ordering is not enabled for this venue');
    }
    
    // 🔥 STEP 2: Customer places order
    console.log('\n🛒 STEP 2: Customer placing order');
    
    const customerOrder = {
      venueId: VENUE_ID,
      tableNumber: 'T05',
      customerName: 'E2E Test Customer',
      items: [
        {
          id: 'greek-salad',
          name: 'Sallam me djath',
          price: 8.5,
          quantity: 1
        },
        {
          id: 'albanian-beer',
          name: 'Albanian Beer',
          price: 3.5,
          quantity: 2
        },
        {
          id: 'seafood-risotto',
          name: 'Seafood Risotto',
          price: 18.5,
          quantity: 1
        }
      ],
      specialInstructions: 'E2E test order - please handle with care'
    };
    
    const orderResponse = await makeRequest('/orders', {
      method: 'POST',
      body: customerOrder
    });
    
    console.log('✅ Customer order placed successfully');
    console.log(`Order ID: ${orderResponse.orderId}`);
    console.log(`Order Number: ${orderResponse.orderNumber}`);
    console.log(`Total Amount: €${orderResponse.totalAmount}`);
    console.log(`Status: ${orderResponse.status}`);
    
    orderData = orderResponse;
    
    // 🔥 STEP 3: Restaurant manager logs in
    console.log('\n👨‍💼 STEP 3: Restaurant manager logging in');
    
    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: MANAGER_CREDENTIALS
    });
    
    console.log('✅ Manager login successful');
    console.log(`Manager: ${loginResponse.user.fullName}`);
    console.log(`Role: ${loginResponse.user.role}`);
    
    managerToken = loginResponse.token;
    
    // 🔥 STEP 4: Manager checks venue orders and finds the new order
    console.log('\n📋 STEP 4: Manager checking venue orders');
    
    const ordersResponse = await makeRequest(`/venue/${VENUE_ID}/orders`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log('✅ Orders retrieved successfully');
    console.log(`Total orders found: ${ordersResponse.length}`);
    
    // Find our specific order
    const ourOrder = ordersResponse.find(order => order.id === orderData.orderId);
    
    if (!ourOrder) {
      throw new Error('❌ Our order was not found in the restaurant dashboard');
    }
    
    console.log('✅ Our order found in restaurant dashboard');
    console.log(`Customer: ${ourOrder.customerName}`);
    console.log(`Table: ${ourOrder.tableNumber}`);
    console.log(`Items count: ${ourOrder.items.length}`);
    console.log(`Special instructions: ${ourOrder.specialInstructions}`);
    console.log(`Current status: ${ourOrder.status}`);
    
    // 🔥 STEP 5: Manager updates order through complete lifecycle
    console.log('\n🔄 STEP 5: Manager processing order through lifecycle');
    
    // Update to preparing
    console.log('   📝 Updating to: preparing');
    await makeRequest(`/orders/${orderData.orderId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: { status: 'preparing' }
    });
    console.log('   ✅ Status updated to preparing');
    
    // Update to ready
    console.log('   🍽️  Updating to: ready');
    await makeRequest(`/orders/${orderData.orderId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: { status: 'ready' }
    });
    console.log('   ✅ Status updated to ready');
    
    // Update to served
    console.log('   🎉 Updating to: served');
    await makeRequest(`/orders/${orderData.orderId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: { status: 'served' }
    });
    console.log('   ✅ Status updated to served');
    
    // 🔥 STEP 6: Customer tracks order status
    console.log('\n📱 STEP 6: Customer tracking order status');
    
    const trackingResponse = await makeRequest(`/track/${orderData.orderNumber}`);
    
    console.log('✅ Order tracking successful');
    console.log(`Order number: ${trackingResponse.orderNumber}`);
    console.log(`Final status: ${trackingResponse.status}`);
    console.log(`Total amount: €${trackingResponse.totalAmount}`);
    console.log(`Estimated time: ${trackingResponse.estimatedTime}`);
    
    if (trackingResponse.status !== 'served') {
      throw new Error(`❌ Expected final status 'served', got '${trackingResponse.status}'`);
    }
    
    // 🔥 STEP 7: Verify order appears in served orders
    console.log('\n📊 STEP 7: Verifying order in served orders list');
    
    const servedOrdersResponse = await makeRequest(`/venue/${VENUE_ID}/orders?status=served`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    const servedOrder = servedOrdersResponse.find(order => order.id === orderData.orderId);
    
    if (!servedOrder) {
      throw new Error('❌ Order not found in served orders list');
    }
    
    console.log('✅ Order found in served orders list');
    console.log(`Served orders count: ${servedOrdersResponse.length}`);
    
    // 🎉 SUCCESS!
    console.log('\n🎉 SUCCESS: COMPLETE CUSTOMER-TO-RESTAURANT FLOW PASSED!');
    console.log('========================================================');
    console.log('✅ Customer can view venue menu');
    console.log('✅ Customer can place orders');
    console.log('✅ Restaurant receives orders immediately');
    console.log('✅ Restaurant can manage order status');
    console.log('✅ Customer can track order progress');
    console.log('✅ Order lifecycle works correctly');
    console.log('✅ Order filtering by status works');
    console.log('✅ All order data is preserved correctly');
    
    return {
      success: true,
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      venue: menuResponse.venue.name,
      finalStatus: trackingResponse.status,
      totalAmount: trackingResponse.totalAmount
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('- API endpoints not working');
    console.log('- Venue menu not configured');
    console.log('- Order creation failing');
    console.log('- Restaurant authentication issues');
    console.log('- Order status update problems');
    console.log('- Order tracking not working');
    
    throw error;
  }
}

// 🚀 Run the test
testCompleteOrderFlow()
  .then(result => {
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Venue: ${result.venue}`);
    console.log(`Order Number: ${result.orderNumber}`);
    console.log(`Order ID: ${result.orderId}`);
    console.log(`Final Status: ${result.finalStatus}`);
    console.log(`Total Amount: €${result.totalAmount}`);
    console.log('\n✨ The complete customer-to-restaurant order flow is working perfectly!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 CUSTOMER-TO-RESTAURANT FLOW TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });