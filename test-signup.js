const http = require('http');

// Generate random email
const email = `testuser_${Date.now()}@test.com`;

const data = JSON.stringify({
  email,
  password: 'TestPassword123',
  name: 'Test User',
  avatar: 'T'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n✅ Response Status:', res.statusCode);
    try {
      const parsed = JSON.parse(responseData);
      console.log('User Email:', parsed.email);
      console.log('User ID:', parsed.id);
      console.log('Wallet Address:', parsed.wallet_address);
    } catch (e) {
      console.log('Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

console.log('📤 Testing signup with email:', email);
req.write(data);
req.end();
