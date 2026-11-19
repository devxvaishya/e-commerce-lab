const client = require('prom-client');

// Initialize Prometheus Register
const register = new client.Registry();

// Enable standard process and runtime metrics with prefix
client.collectDefaultMetrics({
  register,
  prefix: 'genz_fits_'
});

// 1. Total HTTP requests counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by GenZ Fits API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 2. HTTP request errors counter (status >= 400)
const httpRequestErrorsTotal = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of failed HTTP requests (status >= 400)',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 3. HTTP request duration histogram in seconds
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request execution latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// 4. Application-specific counter for products added to carts
const cartProductsAddedTotal = new client.Counter({
  name: 'cart_products_added_total',
  help: 'Total number of individual product items added to shopping carts',
  labelNames: ['status'],
  registers: [register]
});

// 5. Application-specific counter for cart operations
const cartOperationsTotal = new client.Counter({
  name: 'cart_operations_total',
  help: 'Total count of shopping cart lifecycle operations',
  labelNames: ['operation', 'status'],
  registers: [register]
});

/**
 * Normalizes request paths to prevent high-cardinality labels.
 * E.g., /api/products/12 -> /api/products/:id
 * E.g., /api/cart/items/5 -> /api/cart/items/:productId
 */
function normalizeRoute(path) {
  if (!path) return 'unknown';
  // Strip query string
  const cleanPath = path.split('?')[0];

  return cleanPath
    .replace(/\/products\/\d+/g, '/products/:id')
    .replace(/\/cart\/items\/\d+/g, '/cart/items/:productId')
    .replace(/\/orders\/\w+/g, '/orders/:orderNumber')
    || '/';
}

/**
 * Middleware to record Prometheus HTTP metrics on each request.
 * Excludes the /metrics scrape endpoint itself to avoid self-counting.
 */
function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const route = normalizeRoute(req.baseUrl ? `${req.baseUrl}${req.path}` : req.path);
    const method = req.method;
    const statusCode = res.statusCode.toString();

    const labels = {
      method,
      route,
      status_code: statusCode
    };

    // Increment request count and record latency
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);

    // Record error metric if status >= 400
    if (res.statusCode >= 400) {
      httpRequestErrorsTotal.inc(labels);
    }
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  cartProductsAddedTotal,
  cartOperationsTotal
};
