const axios = require('axios');

async function checkExistingDemo() {
  console.log('🔍 Checking existing demo accounts...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  const testCredentials = [
    { email: 'demo@skan.al', password: 'Demo123!' },
    { email: 'demo@skan.al', password: 'DemoPassword123!' },
    { email: 'demo@skan.al', password: 'demo123' },
    { email: 'manager_email1@gmail.com', password: 'admin123' },
    { email: 'test@skan.al', password: 'TestPassword123!' }
  ];
  
  for (const creds of testCredentials) {
    try {
      console.log(`Testing ${creds.email}...`);
      const response = await axios.post(`${API_BASE}/v1/auth/login`, creds);
      console.log(`✅ SUCCESS: ${creds.email}`);
      console.log('User:', response.data.user);
      console.log('Venue:', response.data.venue);
      console.log('---');
      return; // Found working demo
    } catch (error) {
      console.log(`❌ Failed: ${creds.email}`);
    }
  }
  
  console.log('\n🔄 No existing demo found. Creating new demo user...');
}

checkExistingDemo();