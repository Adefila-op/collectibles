import http from 'http';

console.log('Testing API endpoints...\n');

// Test 1: Health check
console.log('Test 1: Health Check');
const healthReq = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    const json = JSON.parse(body);
    console.log(`Database: ${json.database}\n`);
  });
});
healthReq.on('error', e => console.error('Error:', e.message));
healthReq.end();

// Test 2: Create user
setTimeout(() => {
  console.log('Test 2: Create User');
  const email = `testuser${Date.now()}@example.com`;
  const userData = JSON.stringify({
    name: 'Test Artist',
    email: email,
    password: 'TestPassword123'
  });
  
  const userReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': userData.length
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode === 201 || res.statusCode === 200) {
        try {
          const data = JSON.parse(body);
          console.log(`✅ User created: ${email}`);
          console.log(`✅ JWT Token exists: ${!!data.token}`);
          if (data.token) {
            console.log(`Token preview: ${data.token.substring(0, 30)}...\n`);
          }
        } catch (e) {
          console.log(`Body: ${body.substring(0, 100)}\n`);
        }
      } else {
        console.log(`Status code: ${res.statusCode}`);
        console.log(`Error response: ${body}\n`);
      }
    });
  });
  userReq.on('error', e => console.error('Error:', e.message));
  userReq.write(userData);
  userReq.end();
}, 1000);

// Test 3: Check authentication headers
setTimeout(() => {
  console.log('Test 3: OpenSea Endpoint Security');
  const testReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/opensea/fulfillment-data',
    method: 'GET'
  }, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log('✅ Endpoint is protected (requires auth)\n');
    } else {
      console.log('⚠️ Endpoint might not be protected\n');
    }
  });
  testReq.on('error', e => console.error('Error:', e.message));
  testReq.end();
}, 2000);

setTimeout(() => process.exit(0), 4000);
