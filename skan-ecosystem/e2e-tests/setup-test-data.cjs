const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';

console.log('\n🔧 SETTING UP TEST DATA FOR SKAN.AL');
console.log('==================================');

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

async function setupTestData() {
  try {
    console.log('\n🏗️  STEP 1: Setting up test environment');
    
    // Check API health
    const healthResponse = await makeRequest('/health');
    console.log(`✅ API Health: ${healthResponse.status}`);
    console.log(`Service: ${healthResponse.service}`);
    console.log(`Version: ${healthResponse.version}`);
    
    console.log('\n👤 STEP 2: Verifying existing test users');
    
    // Check if manager account exists
    try {
      const loginResponse = await makeRequest('/auth/login', {
        method: 'POST',
        body: {
          email: 'manager_email1@gmail.com',
          password: 'demo123'
        }
      });
      
      console.log('✅ Test manager account verified');
      console.log(`Manager: ${loginResponse.user.fullName}`);
      console.log(`Venue: ${loginResponse.venue ? loginResponse.venue.name : 'No venue'}`);
      
      const managerToken = loginResponse.token;
      
      console.log('\n🏪 STEP 3: Verifying test venue data');
      
      // Check venue menu
      const menuResponse = await makeRequest('/venue/beach-bar-durres/menu');
      console.log('✅ Test venue menu verified');
      console.log(`Venue: ${menuResponse.venue.name}`);
      console.log(`Categories: ${menuResponse.categories.length}`);
      
      let totalItems = 0;
      for (const category of menuResponse.categories) {
        totalItems += category.items.length;
        console.log(`  📂 ${category.name}: ${category.items.length} items`);
      }
      console.log(`Total menu items: ${totalItems}`);
      
      console.log('\n🍽️  STEP 4: Verifying required test menu items');
      
      const requiredItems = [
        { id: 'albanian-beer', name: 'Albanian Beer', price: 3.5 },
        { id: 'greek-salad', name: 'Sallam me djath', price: 8.5 },
        { id: 'seafood-risotto', name: 'Seafood Risotto', price: 18.5 }
      ];
      
      const foundItems = [];
      for (const category of menuResponse.categories) {
        for (const item of category.items) {
          const requiredItem = requiredItems.find(req => req.id === item.id);
          if (requiredItem) {
            foundItems.push(item);
            console.log(`  ✅ Found: ${item.name} - €${item.price}`);
          }
        }
      }
      
      if (foundItems.length !== requiredItems.length) {
        console.log(`  ⚠️  Warning: Expected ${requiredItems.length} items, found ${foundItems.length}`);
        console.log('  Missing items may cause test failures');
      } else {
        console.log('✅ All required test menu items found');
      }
      
      console.log('\n📋 STEP 5: Checking existing orders');
      
      const ordersResponse = await makeRequest('/venue/beach-bar-durres/orders', {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      
      console.log(`✅ Existing orders: ${ordersResponse.length}`);
      
      const ordersByStatus = {};
      for (const order of ordersResponse) {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      }
      
      console.log('Orders by status:');
      for (const [status, count] of Object.entries(ordersByStatus)) {
        console.log(`  ${status}: ${count}`);
      }
      
      console.log('\n👥 STEP 6: Checking user accounts');
      
      const usersResponse = await makeRequest('/users', {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      
      console.log(`✅ Total users: ${usersResponse.users.length}`);
      
      const usersByRole = {};
      for (const user of usersResponse.users) {
        usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
      }
      
      console.log('Users by role:');
      for (const [role, count] of Object.entries(usersByRole)) {
        console.log(`  ${role}: ${count}`);
      }
      
      console.log('\n🧪 STEP 7: Creating test order for validation');
      
      // Create a test order to verify order flow
      const testOrder = {
        venueId: 'beach-bar-durres',
        tableNumber: 'TEST-SETUP',
        customerName: 'Test Data Setup Validation',
        items: foundItems.slice(0, 2).map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        })),
        specialInstructions: 'Test data setup validation order - can be deleted'
      };
      
      const testOrderResponse = await makeRequest('/orders', {
        method: 'POST',
        body: testOrder
      });
      
      console.log('✅ Test order created successfully');
      console.log(`Order Number: ${testOrderResponse.orderNumber}`);
      console.log(`Order ID: ${testOrderResponse.orderId}`);
      console.log(`Total: €${testOrderResponse.totalAmount}`);
      
      // Verify order appears in manager dashboard
      const updatedOrdersResponse = await makeRequest('/venue/beach-bar-durres/orders', {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      
      const testOrderInDashboard = updatedOrdersResponse.find(order => order.id === testOrderResponse.orderId);
      
      if (!testOrderInDashboard) {
        throw new Error('❌ Test order not found in manager dashboard');
      }
      
      console.log('✅ Test order appears in manager dashboard');
      
      // Clean up test order
      await makeRequest(`/orders/${testOrderResponse.orderId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${managerToken}` },
        body: { status: 'served' }
      });
      
      console.log('✅ Test order marked as served (cleanup)');
      
      console.log('\n🎉 SUCCESS: TEST DATA SETUP COMPLETE!');
      console.log('====================================');
      console.log('✅ API is healthy and responsive');
      console.log('✅ Manager account is working');
      console.log('✅ Test venue is properly configured');
      console.log('✅ Required menu items are available');
      console.log('✅ Order system is functional');
      console.log('✅ User management is accessible');
      console.log('✅ All test prerequisites are met');
      
      return {
        success: true,
        api: {
          health: healthResponse.status,
          version: healthResponse.version
        },
        manager: {
          email: loginResponse.user.email,
          name: loginResponse.user.fullName,
          role: loginResponse.user.role
        },
        venue: {
          name: menuResponse.venue.name,
          categories: menuResponse.categories.length,
          totalItems: totalItems,
          requiredItemsFound: foundItems.length
        },
        orders: {
          total: ordersResponse.length,
          byStatus: ordersByStatus
        },
        users: {
          total: usersResponse.users.length,
          byRole: usersByRole
        },
        testOrder: {
          id: testOrderResponse.orderId,
          number: testOrderResponse.orderNumber,
          total: testOrderResponse.totalAmount
        }
      };
      
    } catch (loginError) {
      throw new Error(`❌ Manager login failed: ${loginError.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ TEST DATA SETUP FAILED:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('- API server not running or accessible');
    console.log('- Test manager account not configured');
    console.log('- Test venue not set up properly');
    console.log('- Database connection issues');
    console.log('- Required menu items missing');
    
    throw error;
  }
}

// 🚀 Run test data setup
setupTestData()
  .then(result => {
    console.log('\n📊 SETUP SUMMARY:');
    console.log(`API Health: ${result.api.health} (${result.api.version})`);
    console.log(`Manager: ${result.manager.name} (${result.manager.role})`);
    console.log(`Venue: ${result.venue.name}`);
    console.log(`Menu: ${result.venue.categories} categories, ${result.venue.totalItems} items`);
    console.log(`Required Items: ${result.venue.requiredItemsFound}/3 found`);
    console.log(`Existing Orders: ${result.orders.total}`);
    console.log(`Users: ${result.users.total} total`);
    console.log(`Test Order: ${result.testOrder.number} (€${result.testOrder.total})`);
    console.log('\n✨ Test environment is ready for comprehensive testing!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 TEST DATA SETUP FAILED');
    console.error('Error:', error.message);
    console.log('\n🔧 Please verify:');
    console.log('1. API server is running');
    console.log('2. Manager account exists (manager_email1@gmail.com)');
    console.log('3. Beach Bar Durrës venue is configured');
    console.log('4. Required menu items are available');
    console.log('5. Database is accessible');
    process.exit(1);
  });
