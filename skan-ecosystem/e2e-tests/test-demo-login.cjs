const axios = require('axios');

async function testDemoLogin() {
  console.log('🔐 Testing demo user login...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Test demo login
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo@skan.al',
      password: 'DemoPassword123!'
    });
    
    console.log('✅ Demo login successful!');
    console.log('User:', loginResponse.data.user);
    console.log('Venue:', loginResponse.data.venue);
    console.log('Token exists:', !!loginResponse.data.token);
    
    // Get venue menu
    const venueSlug = loginResponse.data.venue?.slug;
    if (venueSlug) {
      const menuResponse = await axios.get(`${API_BASE}/v1/venue/${venueSlug}/menu`);
      console.log('\n📋 Demo venue menu:');
      console.log('Categories:', menuResponse.data.categories.length);
      menuResponse.data.categories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.items.length} items`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
  }
}

testDemoLogin();
