const http = require('http');

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';
const parsedUrl = new URL(BACKEND_URL);
const hostname = parsedUrl.hostname;
const port = parsedUrl.port || 5000;

function sendReq(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        const cookie = cookies && cookies.length > 0 ? cookies[0].split(';')[0] : '';
        resolve({ status: res.statusCode, cookie, data });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function simulateTraffic() {
  console.log('================================================================');
  console.log('  GenZ Fits (VÉLORA) — Live Traffic & Telemetry Generator       ');
  console.log(`  Targeting Express Backend at http://${hostname}:${port}       `);
  console.log('================================================================\n');

  console.log('Simulating browsing traffic, cart activity, and controlled failures...');
  console.log('Open Grafana (http://localhost:3000) to watch live dashboard metrics!\n');

  for (let cycle = 1; cycle <= 15; cycle++) {
    console.log(`--- [Cycle ${cycle}/15] Generating traffic wave ---`);

    // 1. Normal catalog browsing
    await sendReq('GET', '/api/products');
    await sendReq('GET', '/api/products?category=Jackets%20%26%20Outerwear');
    await sendReq('GET', '/api/products?search=wool&sortBy=price_desc');
    await sendReq('GET', '/api/products/1');
    await sendReq('GET', '/api/products/2');
    await sendReq('GET', '/api/health');

    // 2. User registration and cart curation
    const userEmail = `shopper_${Date.now()}_${Math.floor(Math.random() * 1000)}@velora.atelier`;
    const regRes = await sendReq('POST', '/api/auth/register', {
      name: 'Milan Shopper',
      email: userEmail,
      password: 'LuxuryPassword2026!'
    });

    const userCookie = regRes.cookie;
    if (userCookie) {
      // Add items to cart
      await sendReq('POST', '/api/cart/items', { productId: 1, quantity: 1, size: 'M' }, { Cookie: userCookie });
      await sendReq('POST', '/api/cart/items', { productId: 2, quantity: 2, size: 'L' }, { Cookie: userCookie });
      await sendReq('GET', '/api/cart', null, { Cookie: userCookie });

      // Update quantity
      await sendReq('PATCH', '/api/cart/items/2', { quantity: 3, size: 'L' }, { Cookie: userCookie });

      // Remove an item
      await sendReq('DELETE', '/api/cart/items/1?size=M', null, { Cookie: userCookie });

      // Logout
      await sendReq('POST', '/api/auth/logout', null, { Cookie: userCookie });
    }

    // 3. Controlled Failures (to verify Error Rate & 4xx panels in Grafana)
    // 404 Not Found
    await sendReq('GET', '/api/products/99999');
    // 401 Unauthorized (unauthenticated cart access)
    await sendReq('GET', '/api/cart');
    // 400 Bad Request (invalid quantity)
    await sendReq('POST', '/api/cart/items', { productId: 1, quantity: -5 });
    // 401 Bad credentials
    await sendReq('POST', '/api/auth/login', { email: 'nonexistent@example.com', password: 'wrong' });

    console.log(`   ✓ Completed wave ${cycle}. Waiting 1.5s before next wave...`);
    await sleep(1500);
  }

  console.log('\n================================================================');
  console.log('  Live Traffic Simulation Finished!                             ');
  console.log('  Check Grafana at http://localhost:3000 to observe:            ');
  console.log('  1. Total HTTP request rate spike                              ');
  console.log('  2. p50 and p95 latency curves                                 ');
  console.log('  3. HTTP error rate percentage (401, 404, 400)                ');
  console.log('  4. Cart products added & lifecycle operations                 ');
  console.log('================================================================\n');
}

simulateTraffic().catch(console.error);
