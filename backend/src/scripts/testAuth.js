const http = require('http');
const db = require('../config/db');
const app = require('../server');

let server;
let port = 5002;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  GenZ Fits - Part 2 Authentication Test Suite      ');
  console.log('====================================================\n');

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Dev Tester';
  let sessionCookie = '';

  try {
    // 1. Test Input Validation on Registration
    console.log('1. Testing registration input validation...');
    const shortPassRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Dev', email: 'invalid-email', password: '123' });
    console.log(`   Short pass / invalid email status: ${shortPassRes.status} (Expected: 400)`);
    if (shortPassRes.status !== 400) throw new Error('Input validation failed to reject invalid payload');

    // 2. Test Successful Registration
    console.log('\n2. Testing successful user registration...');
    const regRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: testName, email: testEmail, password: testPassword });
    console.log(`   Registration status: ${regRes.status} (Expected: 201)`);
    console.log('   Registered user:', regRes.body.data?.user);
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    if (regRes.body.data?.user?.password_hash) throw new Error('CRITICAL: Password hash was returned in API response!');

    // Capture session cookie
    const cookies = regRes.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      sessionCookie = cookies[0].split(';')[0];
      console.log('   Session cookie received:', sessionCookie);
    }

    // 3. Verify Cart Row Created Automatically for User
    console.log('\n3. Verifying cart provisioned for user...');
    const cartRes = await db.query('SELECT * FROM carts WHERE user_id = $1', [regRes.body.data.user.id]);
    console.log(`   Cart exists in DB: ${cartRes.rows.length === 1 ? 'YES' : 'NO'}`);
    if (cartRes.rows.length !== 1) throw new Error('Cart was not provisioned for new user');

    // 4. Test Duplicate Email Registration (409)
    console.log('\n4. Testing duplicate email registration rejection...');
    const dupRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Another Name', email: testEmail, password: 'AnotherPassword123' });
    console.log(`   Duplicate email status: ${dupRes.status} (Expected: 409)`);
    if (dupRes.status !== 409) throw new Error('Duplicate email was not rejected with 409');

    // 5. Test Access to Protected Route with Session
    console.log('\n5. Testing protected route WITH active session cookie...');
    const protRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/test-protected',
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    console.log(`   Protected route status: ${protRes.status} (Expected: 200)`);
    if (protRes.status !== 200) throw new Error('Protected route rejected valid session');

    // 6. Test Access to Protected Route WITHOUT Session
    console.log('\n6. Testing protected route WITHOUT session cookie...');
    const unauthRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/test-protected',
      method: 'GET'
    });
    console.log(`   Unauthenticated access status: ${unauthRes.status} (Expected: 401)`);
    if (unauthRes.status !== 401) throw new Error('Protected route did not return 401 for unauthenticated request');

    // 7. Test Logout and Session Destruction
    console.log('\n7. Testing logout...');
    const logoutRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Cookie': sessionCookie }
    });
    console.log(`   Logout status: ${logoutRes.status} (Expected: 200)`);

    // 8. Test Protected Route AFTER Logout
    console.log('\n8. Testing protected route AFTER logout...');
    const afterLogoutRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/test-protected',
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    console.log(`   Status after logout: ${afterLogoutRes.status} (Expected: 401)`);
    if (afterLogoutRes.status !== 401) throw new Error('Session was not destroyed upon logout');

    // 9. Test Login with Invalid Password
    console.log('\n9. Testing login with invalid password...');
    const badLoginRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: testEmail, password: 'WrongPassword' });
    console.log(`   Bad password login status: ${badLoginRes.status} (Expected: 401)`);
    if (badLoginRes.status !== 401) throw new Error('Login accepted wrong password');

    // 10. Test Login with Valid Credentials
    console.log('\n10. Testing login with valid credentials...');
    const goodLoginRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: testEmail, password: testPassword });
    console.log(`   Valid login status: ${goodLoginRes.status} (Expected: 200)`);
    if (goodLoginRes.status !== 200) throw new Error('Login failed with valid credentials');
    if (goodLoginRes.body.data?.user?.password_hash) throw new Error('CRITICAL: Password hash returned on login!');

    // 11. Verify Products Catalog Integrity (Part 1 Functionality)
    console.log('\n11. Verifying Part 1 Products Catalog integrity...');
    const prodRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/products',
      method: 'GET'
    });
    console.log(`   GET /api/products status: ${prodRes.status}`);
    console.log(`   Product count: ${prodRes.body.count} (Expected: 12)`);
    if (prodRes.status !== 200 || prodRes.body.count !== 12) {
      throw new Error(`Products catalog corrupted! Count: ${prodRes.body.count}`);
    }

    console.log('\n====================================================');
    console.log('  ALL PART 2 AUTH & MIGRATION TESTS PASSED (11/11)! ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n[TEST FAILURE]', err);
    process.exit(1);
  } finally {
    await db.pool.end();
    process.exit(0);
  }
}

// Start server on test port and run
server = app.listen(port, async () => {
  console.log(`Auth test server running on port ${port}...`);
  await runTests();
});
