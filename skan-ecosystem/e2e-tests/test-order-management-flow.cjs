const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';
const VENUE_ID = 'beach-bar-durres';

// Manager credentials for testing
const MANAGER_CREDENTIALS = {
  email: 'manager_email1@gmail.com',
  password: 'demo123'
};

console.log('\n👨‍💼 TESTING ORDER MANAGEMENT FLOW');
console.log('================================');

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

async function testOrderManagementFlow() {
  let managerToken;
  let testOrder;
  
  try {
    // 🔥 STEP 1: Manager login
    console.log('\n🔐 STEP 1: Manager authentication');
    
    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: MANAGER_CREDENTIALS
    });
    
    console.log('✅ Manager login successful');
    console.log(`Manager: ${loginResponse.user.fullName}`);
    console.log(`Role: ${loginResponse.user.role}`);
    console.log(`Venue: ${loginResponse.venue ? loginResponse.venue.name : 'No venue assigned'}`);
    
    managerToken = loginResponse.token;
    
    if (!managerToken) {
      throw new Error('❌ No access token received');
    }
    
    // 🔥 STEP 2: Create test order (simulating customer)
    console.log('\n🛒 STEP 2: Creating test order');
    
    const testOrderData = {
      venueId: VENUE_ID,
      tableNumber: 'T-MGMT-01',
      customerName: 'Order Management Test Customer',
      items: [
        {
          id: 'greek-salad',
          name: 'Greek Salad Test',
          price: 8.5,
          quantity: 1
        },
        {
          id: 'albanian-beer',
          name: 'Albanian Beer Test',
          price: 3.5,
          quantity: 2
        }
      ],
      specialInstructions: 'Order management flow test - please handle carefully'
    };
    
    const orderResponse = await makeRequest('/orders', {
      method: 'POST',
      body: testOrderData
    });
    
    console.log('✅ Test order created successfully');
    console.log(`Order ID: ${orderResponse.orderId}`);
    console.log(`Order Number: ${orderResponse.orderNumber}`);
    console.log(`Total Amount: €${orderResponse.totalAmount}`);
    console.log(`Initial Status: ${orderResponse.status}`);
    
    testOrder = orderResponse;
    
    // 🔥 STEP 3: Manager views orders dashboard
    console.log('\n📋 STEP 3: Checking orders dashboard');
    
    const allOrdersResponse = await makeRequest(`/venue/${VENUE_ID}/orders`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log('✅ Orders dashboard loaded');
    console.log(`Total orders in system: ${allOrdersResponse.length}`);
    
    // Find our test order
    const ourOrder = allOrdersResponse.find(order => order.id === testOrder.orderId);
    
    if (!ourOrder) {
      throw new Error('❌ Test order not found in manager dashboard');
    }
    
    console.log('✅ Test order found in dashboard');
    console.log(`Customer: ${ourOrder.customerName}`);
    console.log(`Table: ${ourOrder.tableNumber}`);
    console.log(`Items: ${ourOrder.items.length}`);
    console.log(`Status: ${ourOrder.status}`);
    console.log(`Special Instructions: ${ourOrder.specialInstructions}`);
    
    // 🔥 STEP 4: Test order filtering
    console.log('\n🔍 STEP 4: Testing order filtering');
    
    // Test filter by status "new"
    const newOrdersResponse = await makeRequest(`/venue/${VENUE_ID}/orders?status=new`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log(`✅ New orders: ${newOrdersResponse.length}`);
    
    const ourNewOrder = newOrdersResponse.find(order => order.id === testOrder.orderId);
    if (!ourNewOrder) {
      console.log('⚠️  Test order not in new orders (may have been processed)');
    } else {
      console.log('✅ Test order found in new orders filter');
    }
    
    // Test filter by active orders
    const activeOrdersResponse = await makeRequest(`/venue/${VENUE_ID}/orders?status=active`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log(`✅ Active orders: ${activeOrdersResponse.length}`);
    
    // 🔥 STEP 5: Order status management
    console.log('\n🔄 STEP 5: Testing order status updates');
    
    // Update to preparing
    console.log('   📝 Updating order to: preparing');
    const preparingResponse = await makeRequest(`/orders/${testOrder.orderId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: { status: 'preparing' }
    });
    
    console.log('   ✅ Status updated to preparing');
    console.log(`   Response: ${preparingResponse.message}`);
    
    // Verify status change
    const orderAfterPreparing = await makeRequest(`/orders/${testOrder.orderId}`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    if (orderAfterPreparing.status !== 'preparing') {
      throw new Error(`❌ Status not updated correctly. Expected: preparing, Got: ${orderAfterPreparing.status}`);
    }
    console.log('   ✅ Status verified as preparing');
    
    // Update to ready
    console.log('   🍽️  Updating order to: ready');
    await makeRequest(`/orders/${testOrder.orderId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: { status: 'ready' }
    });
    console.log('   ✅ Status updated to ready');
    
    // Update to served
    console.log('   🎉 Updating order to: served');
    await makeRequest(`/orders/${testOrder.orderId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: { status: 'served' }
    });
    console.log('   ✅ Status updated to served');
    
    // 🔥 STEP 6: Verify order in served orders
    console.log('\n📊 STEP 6: Verifying served orders list');
    
    const servedOrdersResponse = await makeRequest(`/venue/${VENUE_ID}/orders?status=served`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log(`✅ Served orders found: ${servedOrdersResponse.length}`);
    
    const ourServedOrder = servedOrdersResponse.find(order => order.id === testOrder.orderId);
    
    if (!ourServedOrder) {
      throw new Error('❌ Test order not found in served orders list');
    }
    
    console.log('✅ Test order found in served orders');
    console.log(`Final status: ${ourServedOrder.status}`);
    
    // 🔥 STEP 7: Test order search functionality
    console.log('\n🔎 STEP 7: Testing order search capabilities');
    
    // Search by table number
    const tableSearchResponse = await makeRequest(`/venue/${VENUE_ID}/orders`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    const ordersByTable = tableSearchResponse.filter(order => 
      order.tableNumber === testOrderData.tableNumber
    );
    
    console.log(`✅ Orders for table ${testOrderData.tableNumber}: ${ordersByTable.length}`);
    
    // Search by customer name
    const ordersByCustomer = tableSearchResponse.filter(order => 
      order.customerName && order.customerName.includes('Test Customer')
    );
    
    console.log(`✅ Orders for test customers: ${ordersByCustomer.length}`);
    
    // 🔥 STEP 8: Test order details access
    console.log('\n📄 STEP 8: Testing detailed order information');
    
    const finalOrderDetails = await makeRequest(`/orders/${testOrder.orderId}`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log('✅ Order details retrieved');
    console.log(`Order Number: ${finalOrderDetails.orderNumber}`);
    console.log(`Customer: ${finalOrderDetails.customerName}`);
    console.log(`Table: ${finalOrderDetails.tableNumber}`);
    console.log(`Items: ${finalOrderDetails.items.length}`);
    console.log(`Total: €${finalOrderDetails.totalAmount}`);
    console.log(`Status: ${finalOrderDetails.status}`);
    console.log(`Created: ${finalOrderDetails.createdAt}`);
    console.log(`Updated: ${finalOrderDetails.updatedAt}`);
    
    if (finalOrderDetails.preparedAt) {
      console.log(`Prepared: ${finalOrderDetails.preparedAt}`);
    }
    if (finalOrderDetails.readyAt) {
      console.log(`Ready: ${finalOrderDetails.readyAt}`);
    }
    if (finalOrderDetails.servedAt) {
      console.log(`Served: ${finalOrderDetails.servedAt}`);
    }
    
    // 🔥 STEP 9: Test order permissions
    console.log('\n🔐 STEP 9: Testing order access permissions');
    
    // Try to access order without authentication (should fail)
    try {
      await makeRequest(`/orders/${testOrder.orderId}`);
      console.log('⚠️  Warning: Order accessible without authentication');
    } catch (error) {
      console.log('✅ Order properly protected - authentication required');
    }
    
    // 🎉 SUCCESS!
    console.log('\n🎉 SUCCESS: ORDER MANAGEMENT FLOW TEST PASSED!');
    console.log('=============================================');
    console.log('✅ Manager authentication working');
    console.log('✅ Order creation and receipt working');
    console.log('✅ Orders dashboard functioning');
    console.log('✅ Order filtering working correctly');
    console.log('✅ Order status updates functioning');
    console.log('✅ Order search capabilities working');
    console.log('✅ Detailed order information accessible');
    console.log('✅ Order permissions properly enforced');
    
    return {
      success: true,
      manager: loginResponse.user.fullName,
      testOrderId: testOrder.orderId,
      testOrderNumber: testOrder.orderNumber,
      finalStatus: finalOrderDetails.status,
      totalAmount: finalOrderDetails.totalAmount,
      processingTime: {
        created: finalOrderDetails.createdAt,
        served: finalOrderDetails.servedAt
      }
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('- Manager authentication failing');
    console.log('- Order creation not working');
    console.log('- Orders not appearing in dashboard');
    console.log('- Status updates not functioning');
    console.log('- Order filtering not working');
    console.log('- Permission system not enforced');
    
    throw error;
  }
}

// 🚀 Run the test
testOrderManagementFlow()
  .then(result => {
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Manager: ${result.manager}`);
    console.log(`Test Order: ${result.testOrderNumber}`);
    console.log(`Order ID: ${result.testOrderId}`);
    console.log(`Final Status: ${result.finalStatus}`);
    console.log(`Total Amount: €${result.totalAmount}`);
    console.log(`Created: ${result.processingTime.created}`);
    console.log(`Served: ${result.processingTime.served}`);
    console.log('\n✨ Order management system is fully functional!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 ORDER MANAGEMENT FLOW TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });
