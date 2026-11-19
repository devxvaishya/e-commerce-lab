const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const apiRoutes = require('./routes/apiRoutes');
const { pool, testConnection } = require('./config/db');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { logger, httpLogger } = require('./config/logger');
const { register, metricsMiddleware } = require('./config/metrics');

const app = express();
const PORT = process.env.PORT || 5000;

// Structured HTTP logging via pino-http
app.use(httpLogger);

// Prometheus HTTP metrics tracking
app.use(metricsMiddleware);

// Configure CORS for credentials & cross-origin frontend requests
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Permissive in local development
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON payloads
app.use(express.json());

// Persistent PostgreSQL Session Store via connect-pg-simple
const sessionStore = new pgSession({
  pool: pool,
  tableName: 'session',
  createTableIfMissing: false
});

sessionStore.on('error', (err) => {
  console.warn('[Session Store Warning]', err.message);
});

// Configure session handling with secure cookie defaults
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'velora_development_session_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Prometheus metrics exposition endpoint
app.get('/metrics', async (req, res, next) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (err) {
    next(err);
  }
});

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'GenZ Fits API',
    collection: 'VÉLORA Editorial Fashion Catalogue',
    description: 'College E-Commerce Lab Assignment REST Backend',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      metrics: '/metrics',
      products: '/api/products',
      productById: '/api/products/:id',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        currentUser: 'GET /api/auth/me'
      },
      cart: {
        getCart: 'GET /api/cart',
        addItem: 'POST /api/cart/items',
        updateQuantity: 'PATCH /api/cart/items/:productId',
        removeItem: 'DELETE /api/cart/items/:productId',
        clearCart: 'DELETE /api/cart'
      }
    }
  });
});

// Mount API routes under /api
app.use('/api', apiRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling
app.use(globalErrorHandler);

// Start server and check database connection if executed directly
let server;
if (require.main === module) {
  server = app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`  GenZ Fits (VÉLORA) Backend Server Running          `);
    console.log(`  Local URL: http://localhost:${PORT}              `);
    console.log(`  API Health: http://localhost:${PORT}/api/health   `);
    console.log(`  Products:   http://localhost:${PORT}/api/products `);
    console.log('====================================================');

    await testConnection();
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down server...');
    server.close(() => {
      console.log('Backend server terminated.');
      process.exit(0);
    });
  });
}

module.exports = app;
