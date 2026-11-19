const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');

// All cart routes require active session authentication
router.use(requireAuth);

// GET /api/cart - Retrieve logged-in user's cart
router.get('/', cartController.getCart);

// POST /api/cart/items - Add a product to cart
router.post('/items', cartController.addItemToCart);

// PATCH /api/cart/items/:productId - Update quantity of a product in cart
router.patch('/items/:productId', cartController.updateCartItemQuantity);

// DELETE /api/cart/items/:productId - Remove a product from cart
router.delete('/items/:productId', cartController.removeCartItem);

// DELETE /api/cart - Clear the entire cart
router.delete('/', cartController.clearCart);

module.exports = router;
