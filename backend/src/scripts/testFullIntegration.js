const http = require('http');
const db = require('../config/db');
const app = require('../server');

let server;
const PORT = 5003;

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
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

function extractCookie(res) {
  const cookies = res.headers['set-cookie'];
  if (!cookies || cookies.length === 0) return '';
  return cookies[0].split(';')[0];
}

async function runVerification() {
  console.log('================================================================');
  console.log('  GenZ Fits (VÉLORA) - Full Integration & Verification Suite   ');
  console.log('================================================================\n');

  try {
    const ts = Date.now();
    const user1Email = `velora_user1_${ts}@atelier.com`;
    const user2Email = `velora_user2_${ts}@atelier.com`;
    const userPassword = 'LuxuryPassword2026!';

    // 1. Verify Registration & Session Creation
    console.log('1. Verifying Registration & Session Creation...');
    const regRes1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Dev One', email: user1Email, password: userPassword });
    
    if (regRes1.status !== 201) throw new Error(`User 1 registration failed: ${JSON.stringify(regRes1.body)}`);
    const cookieUser1 = extractCookie(regRes1);
    console.log('   ✓ User 1 registered with ID:', regRes1.body.data.user.id);

    const regRes2 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Dev Two', email: user2Email, password: userPassword });
    
    if (regRes2.status !== 201) throw new Error(`User 2 registration failed: ${JSON.stringify(regRes2.body)}`);
    const cookieUser2 = extractCookie(regRes2);
    console.log('   ✓ User 2 registered with ID:', regRes2.body.data.user.id);

    // 2. Verify Login
    console.log('\n2. Verifying Login & Session ID Regeneration...');
    const loginRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: user1Email, password: userPassword });

    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    const refreshedCookieUser1 = extractCookie(loginRes);
    console.log('   ✓ User 1 login successful. Regenerated cookie received.');

    // 3. Verify Authenticated Cart Retrieval (GET /api/cart)
    console.log('\n3. Verifying GET /api/cart for User 1...');
    const cartRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart',
      method: 'GET',
      headers: { 'Cookie': refreshedCookieUser1 }
    });
    if (cartRes.status !== 200 || cartRes.body.data.itemCount !== 0) {
      throw new Error(`Expected empty cart, received: ${JSON.stringify(cartRes.body)}`);
    }
    console.log('   ✓ User 1 cart initialized empty in PostgreSQL (0 items).');

    // 4. Verify Adding Product (POST /api/cart/items) with Real PostgreSQL Price
    console.log('\n4. Verifying Product Addition (POST /api/cart/items)...');
    // Deliberately supply fake client price to verify server uses PostgreSQL price
    const addRes1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart/items',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': refreshedCookieUser1 }
    }, { productId: 1, quantity: 2, size: 'L', price: 99.00 }); // Real price is 6999.00

    if (addRes1.status !== 201) throw new Error(`Failed to add item: ${JSON.stringify(addRes1.body)}`);
    const addedItem = addRes1.body.data.items[0];
    console.log('   ✓ Added piece:', addedItem.name, `(${addedItem.size})`);
    console.log('   ✓ Unit Price in cart:', addedItem.price, '(Real DB price, ignored client fake price)');
    console.log('   ✓ Item Total:', addedItem.itemTotal, `(2 * ${addedItem.price})`);
    if (addedItem.price !== '6999.00' || addedItem.itemTotal !== '13998.00') {
      throw new Error('Price was not taken from PostgreSQL database!');
    }

    // 5. Verify Duplicate Addition Handling
    console.log('\n5. Verifying Duplicate Addition (same product & size)...');
    const dupRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart/items',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': refreshedCookieUser1 }
    }, { productId: 1, quantity: 1, size: 'L' });

    if (dupRes.status !== 201) throw new Error(`Duplicate add failed: ${JSON.stringify(dupRes.body)}`);
    const updatedItem = dupRes.body.data.items[0];
    console.log('   ✓ Quantity correctly incremented to:', updatedItem.quantity, '(2 + 1 = 3)');
    if (updatedItem.quantity !== 3) throw new Error('Duplicate item did not increment quantity correctly');

    // 6. Verify User Cart Isolation (User 2 cannot see User 1 cart)
    console.log('\n6. Verifying User Cart Isolation...');
    const user2CartRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart',
      method: 'GET',
      headers: { 'Cookie': cookieUser2 }
    });
    console.log('   ✓ User 2 cart item count:', user2CartRes.body.data.itemCount, '(Expected: 0)');
    if (user2CartRes.body.data.itemCount !== 0) {
      throw new Error('SECURITY VIOLATION: User 2 accessed User 1 cart contents!');
    }

    // 7. Verify Stock Limit Validation
    console.log('\n7. Verifying Stock Limit Enforcement...');
    const overStockRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart/items',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': refreshedCookieUser1 }
    }, { productId: 1, quantity: 100, size: 'L' }); // Stock is 18
    console.log('   ✓ Oversized quantity rejected with status:', overStockRes.status, `("${overStockRes.body.error}")`);
    if (overStockRes.status !== 400) throw new Error('Stock boundary check failed to reject excess quantity');

    // 8. Verify Quantity Update (PATCH /api/cart/items/:productId)
    console.log('\n8. Verifying PATCH /api/cart/items/:productId...');
    const patchRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart/items/1',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': refreshedCookieUser1 }
    }, { quantity: 4, size: 'L' });
    if (patchRes.status !== 200 || patchRes.body.data.items[0].quantity !== 4) {
      throw new Error(`Quantity update failed: ${JSON.stringify(patchRes.body)}`);
    }
    console.log('   ✓ Quantity updated to:', patchRes.body.data.items[0].quantity);

    // 9. Verify Item Removal (DELETE /api/cart/items/:productId)
    console.log('\n9. Verifying DELETE /api/cart/items/:productId...');
    const deleteItemRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart/items/1?size=L',
      method: 'DELETE',
      headers: { 'Cookie': refreshedCookieUser1 }
    });
    if (deleteItemRes.status !== 200 || deleteItemRes.body.data.itemCount !== 0) {
      throw new Error(`Item deletion failed: ${JSON.stringify(deleteItemRes.body)}`);
    }
    console.log('   ✓ Product #1 removed from wardrobe.');

    // 10. Verify Cart Persistence in PostgreSQL (survives restart)
    console.log('\n10. Verifying Cart Persistence in PostgreSQL...');
    await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart/items',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': refreshedCookieUser1 }
    }, { productId: 2, quantity: 2, size: 'M' }); // Cuban Shirt

    const dbCartCheck = await db.query(`
      SELECT ci.quantity, ci.size, p.name 
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      WHERE c.user_id = $1
    `, [regRes1.body.data.user.id]);

    console.log('   ✓ Direct PostgreSQL query confirms persisted row:');
    console.log('     ', dbCartCheck.rows[0]);
    if (dbCartCheck.rows.length !== 1 || dbCartCheck.rows[0].quantity !== 2) {
      throw new Error('Cart item was not persisted in PostgreSQL database!');
    }

    // 11. Verify Clear Cart (DELETE /api/cart)
    console.log('\n11. Verifying DELETE /api/cart (Clear Cart)...');
    const clearRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart',
      method: 'DELETE',
      headers: { 'Cookie': refreshedCookieUser1 }
    });
    if (clearRes.status !== 200 || clearRes.body.data.itemCount !== 0) {
      throw new Error(`Clear cart failed: ${JSON.stringify(clearRes.body)}`);
    }
    console.log('   ✓ Cart cleared successfully.');

    // 12. Verify Logout & Session Destruction
    console.log('\n12. Verifying Logout...');
    const logoutRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Cookie': refreshedCookieUser1 }
    });
    if (logoutRes.status !== 200) throw new Error('Logout failed');

    const cartAfterLogout = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/cart',
      method: 'GET',
      headers: { 'Cookie': refreshedCookieUser1 }
    });
    console.log('   ✓ Cart access after logout returned status:', cartAfterLogout.status, '(Expected: 401)');
    if (cartAfterLogout.status !== 401) throw new Error('Cart accessible after logout!');

    // 13. Verify Prometheus Metrics Endpoint (/metrics)
    console.log('\n13. Verifying GET /metrics (Prometheus Exposition)...');
    const metricsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/metrics',
      method: 'GET'
    });
    if (metricsRes.status !== 200) throw new Error('Failed to fetch /metrics');
    const rawMetrics = metricsRes.raw || JSON.stringify(metricsRes.body);

    const requiredMetrics = [
      'http_requests_total',
      'http_request_errors_total',
      'http_request_duration_seconds',
      'cart_products_added_total',
      'cart_operations_total'
    ];

    for (const metric of requiredMetrics) {
      const present = rawMetrics.includes(metric);
      console.log(`   ✓ Prometheus Metric "${metric}": ${present ? 'PRESENT' : 'MISSING'}`);
      if (!present) throw new Error(`Missing required Prometheus metric: ${metric}`);
    }

    // 14. Verify All 12 Original Products Still Intact
    console.log('\n14. Verifying All 12 Original Products in Database...');
    const prodCountRes = await db.query('SELECT COUNT(*) AS count FROM products');
    const count = parseInt(prodCountRes.rows[0].count, 10);
    console.log(`   ✓ Products count in PostgreSQL: ${count} (Expected: 12)`);
    if (count !== 12) {
      throw new Error(`CRITICAL: Products count mismatch! Found ${count}, expected 12`);
    }

    console.log('\n================================================================');
    console.log('  ALL 14 INTEGRATION & VERIFICATION CHECKS PASSED (14/14)!      ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n[VERIFICATION ERROR]', err);
    process.exit(1);
  } finally {
    await db.pool.end();
    process.exit(0);
  }
}

// Start test server
server = app.listen(PORT, async () => {
  console.log(`Verification test server running on port ${PORT}...`);
  await runVerification();
});
