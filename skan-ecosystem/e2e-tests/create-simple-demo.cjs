const axios = require('axios');

async function createSimpleDemo() {
  console.log('🚀 Creating simple demo user...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Create demo venue with simple email
    const demoData = {
      venueName: 'Demo Bistro',
      address: '456 Demo Avenue, Tirana, Albania', 
      phone: '+355691234568',
      description: 'Try our QR ordering system with this interactive demo',
      currency: 'EUR',
      ownerName: 'Demo Owner',
      ownerEmail: 'demo.owner@skan.al',
      password: 'Demo2024!',
      tableCount: 6
    };
    
    console.log('Creating demo venue with email:', demoData.ownerEmail);
    
    const response = await axios.post(`${API_BASE}/v1/register/venue`, demoData);
    
    console.log('✅ Demo venue created!');
    console.log('📧 Login Email:', demoData.ownerEmail);
    console.log('🔑 Password:', demoData.password);
    console.log('🏪 Venue Slug:', response.data.venue.slug);
    console.log('🔗 QR URL:', response.data.setup.qrCodeUrl);
    
    console.log('\n📋 Demo Credentials:');
    console.log('Email: demo.owner@skan.al');
    console.log('Password: Demo2024!');
    console.log('Admin URL: https://admin.skan.al');
    console.log('Customer URL: https://order.skan.al/' + response.data.venue.slug);
    
  } catch (error) {
    if (error.response?.data?.error?.includes('email already exists')) {
      console.log('✅ Demo user already exists!');
      console.log('📧 Email: demo.owner@skan.al');
      console.log('🔑 Password: Demo2024!');
      console.log('🌐 Try logging in at: https://admin.skan.al');
    } else {
      console.error('❌ Error:', error.response?.data?.error || error.message);
    }
  }
}

createSimpleDemo();