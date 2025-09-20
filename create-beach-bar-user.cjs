// Create Beach Bar demo user via API
const https = require('https');

const userData = {
  email: 'demo.beachbar@skan.al',
  password: 'BeachBarDemo2024!',
  fullName: 'Beach Bar Demo Manager',
  role: 'manager',
  venueId: 'beach-bar-durres'
};

const postData = JSON.stringify(userData);

const options = {
  hostname: 'api-mkazmlu7ta-ew.a.run.app',
  port: 443,
  path: '/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🏖️ Creating Beach Bar Durrës demo user...');
console.log('📧 Email: demo.beachbar@skan.al');
console.log('🔑 Password: BeachBarDemo2024!');
console.log('🏢 Venue: beach-bar-durres');
console.log('');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Beach Bar demo user created!');
      console.log('📧 Email: demo.beachbar@skan.al');
      console.log('🔑 Password: BeachBarDemo2024!');
      console.log('🏢 Venue: Beach Bar Durrës');
      console.log('\nNow testing login...');
      
      // Test the new credentials
      testLogin();
    } else if (res.statusCode === 409) {
      console.log('\n⚠️  User already exists. Testing login...');
      testLogin();
    } else {
      console.log('\n❌ Failed to create user');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

function testLogin() {
  console.log('\n🔍 Testing Beach Bar demo login...');
  
  const loginData = JSON.stringify({
    email: 'demo.beachbar@skan.al',
    password: 'BeachBarDemo2024!'
  });

  const loginOptions = {
    hostname: 'api-mkazmlu7ta-ew.a.run.app',
    port: 443,
    path: '/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginReq = https.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('👤 User:', result.user.fullName);
        console.log('🏢 Venue:', result.venue ? result.venue.name : 'No venue access');
        console.log('🆔 Venue ID:', result.user.venueId);
        console.log('🎯 CREDENTIALS READY FOR ADMIN PORTAL');
      } else {
        console.log('❌ Login failed:', data);
      }
    });
  });

  loginReq.on('error', (e) => {
    console.error(`Login test error: ${e.message}`);
  });

  loginReq.write(loginData);
  loginReq.end();
}