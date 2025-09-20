const axios = require('axios');

async function checkAPIEndpoints() {
  console.log('🔍 Checking available API endpoints...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo.owner@skan.al', 
      password: 'Demo2024!'
    });
    
    const token = loginResponse.data.token;
    const venueId = loginResponse.data.user.venueId;
    
    console.log('✅ Logged in successfully');
    console.log('Venue ID:', venueId);
    
    // Test various menu-related endpoints
    const endpoints = [
      `GET /v1/venues/${venueId}`,
      `GET /v1/venues/${venueId}/menu`,
      `POST /v1/venues/${venueId}/menu`,
      `GET /v1/venues/${venueId}/categories`,
      `POST /v1/venues/${venueId}/categories`,
      `GET /v1/venues/${venueId}/items`,
      `POST /v1/venues/${venueId}/items`
    ];
    
    console.log('\n📋 Testing endpoints:');
    
    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(' ');
      try {
        const config = {
          method: method.toLowerCase(),
          url: `${API_BASE}${path}`,
          headers: { Authorization: `Bearer ${token}` }
        };
        
        if (method === 'POST') {
          config.data = { test: true };
        }
        
        const response = await axios(config);
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        const status = error.response?.status || 'ERR';
        const message = error.response?.data?.error || error.message;
        console.log(`❌ ${endpoint} - ${status}: ${message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);
  }
}

checkAPIEndpoints();