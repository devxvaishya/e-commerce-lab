const express = require('express');
const router = express.Router();
const productRoutes = require('./productRoutes');
const authRoutes = require('./authRoutes');
const cartRoutes = require('./cartRoutes');
const { getHealth } = require('../controllers/productController');

// Health check endpoint: GET /api/health
router.get('/health', getHealth);

// Authentication & authorization routes: /api/auth
router.use('/auth', authRoutes);

// Shopping cart routes: /api/cart
router.use('/cart', cartRoutes);

// Product catalog routes: /api/products
router.use('/products', productRoutes);

module.exports = router;
