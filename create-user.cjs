// Simple user creation via API
const https = require('https');

const userData = {
  email: 'test@skan.al',
  password: 'TestPassword123!',
  fullName: 'Test User',
  role: 'manager'
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

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n✅ SUCCESS! New login credentials:');
      console.log('📧 Email: test@skan.al');
      console.log('🔑 Password: TestPassword123!');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();