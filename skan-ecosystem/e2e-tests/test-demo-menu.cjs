const axios = require('axios');

async function testDemoMenu() {
  console.log('🧪 Testing demo menu without authentication...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Test the public menu endpoint
    console.log('📋 Fetching demo menu...');
    const menuResponse = await axios.get(`${API_BASE}/v1/venue/demo-bistro/menu`);
    
    console.log('✅ Demo menu loaded successfully!');
    console.log(`📍 Venue: ${menuResponse.data.venue.name}`);
    console.log(`📋 Categories: ${menuResponse.data.categories.length}`);
    
    let totalItems = 0;
    menuResponse.data.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.items.length} items`);
      totalItems += cat.items.length;
    });
    
    console.log(`🍽️ Total menu items: ${totalItems}`);
    
    if (totalItems === 0) {
      console.log('\n📝 Categories exist but no items. We need to add menu items.');
      console.log('Categories found:');
      menuResponse.data.categories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id})`);
      });
    } else {
      console.log('\n🎉 Demo menu is working!');
    }
    
    console.log('\n🔗 Demo URLs:');
    console.log('Customer: https://order.skan.al/demo-bistro/table-1/menu');
    console.log('Admin: https://admin.skan.al (login: demo.owner@skan.al / Demo2024!)');
    
    return menuResponse.data;
    
  } catch (error) {
    console.error('❌ Error testing menu:', error.response?.data?.error || error.message);
    return null;
  }
}

testDemoMenu();