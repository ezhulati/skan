const axios = require('axios');

async function createFreshDemo() {
  console.log('🚀 Creating fresh demo user and venue...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Create demo venue with unique timestamp
    const timestamp = Date.now();
    const demoData = {
      venueName: 'Demo Restaurant',
      address: '123 Demo Street, Tirana, Albania',
      phone: '+355691234567',
      description: 'Experience the future of restaurant ordering with our demo venue',
      currency: 'EUR',
      ownerName: 'Demo Manager',
      ownerEmail: `demo${timestamp}@skan.al`,
      password: 'DemoPassword123!',
      tableCount: 8
    };
    
    console.log('Creating demo venue with email:', demoData.ownerEmail);
    
    const response = await axios.post(`${API_BASE}/v1/register/venue`, demoData);
    
    console.log('✅ Demo venue created successfully!');
    console.log('Venue ID:', response.data.venueId);
    console.log('Venue Slug:', response.data.venue.slug);
    console.log('Owner Email:', response.data.user.email);
    console.log('Tables Created:', response.data.setup.tablesCreated);
    console.log('QR URL:', response.data.setup.qrCodeUrl);
    
    // Test login immediately
    console.log('\n🔐 Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: demoData.ownerEmail,
      password: demoData.password
    });
    
    console.log('✅ Login successful!');
    console.log('Token length:', loginResponse.data.token.length);
    
    // Save demo credentials to file
    const credentials = {
      email: demoData.ownerEmail,
      password: demoData.password,
      venueSlug: response.data.venue.slug,
      venueId: response.data.venueId,
      qrUrl: response.data.setup.qrCodeUrl,
      createdAt: new Date().toISOString()
    };
    
    require('fs').writeFileSync('./demo-credentials.json', JSON.stringify(credentials, null, 2));
    console.log('\n📋 Demo credentials saved to demo-credentials.json');
    
    return credentials;
    
  } catch (error) {
    console.error('❌ Error creating demo:', error.response?.data?.error || error.message);
    return null;
  }
}

createFreshDemo();