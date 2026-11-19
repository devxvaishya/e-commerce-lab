const db = require('../config/db');
const { cartProductsAddedTotal, cartOperationsTotal } = require('../config/metrics');
const { logger } = require('../config/logger');

/**
 * Helper to ensure a user has a cart in PostgreSQL and retrieve its cart ID.
 */
async function getOrCreateUserCartId(userId, client = null) {
  const queryExecutor = client || db;

  const res = await queryExecutor.query(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );

  if (res.rows.length > 0) {
    return res.rows[0].id;
  }

  const insertRes = await queryExecutor.query(
    'INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP RETURNING id',
    [userId]
  );

  return insertRes.rows[0].id;
}

/**
 * Helper to retrieve full cart contents and calculate totals from PostgreSQL product prices.
 */
async function fetchUserCartDetails(userId, client = null) {
  const queryExecutor = client || db;

  const cartId = await getOrCreateUserCartId(userId, queryExecutor);

  const query = `
    SELECT 
      ci.id AS item_id,
      ci.product_id,
      ci.size,
      ci.quantity,
      ci.created_at,
      p.name,
      p.slug,
      p.category,
      p.price,
      p.stock,
      p.image_url,
      p.dimensions,
      (ci.quantity * p.price) AS item_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at ASC
  `;

  const { rows } = await queryExecutor.query(query, [cartId]);

  let subtotalNum = 0;
  let totalCount = 0;

  const items = rows.map(r => {
    const unitPrice = Number(r.price);
    const itemTotal = unitPrice * r.quantity;
    subtotalNum += itemTotal;
    totalCount += r.quantity;

    return {
      itemId: r.item_id,
      productId: r.product_id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      price: unitPrice.toFixed(2),
      size: r.size,
      quantity: r.quantity,
      stock: r.stock,
      imageUrl: r.image_url,
      dimensions: r.dimensions,
      itemTotal: itemTotal.toFixed(2)
    };
  });

  return {
    cartId,
    items,
    itemCount: totalCount,
    subtotal: subtotalNum.toFixed(2),
    total: subtotalNum.toFixed(2)
  };
}

/**
 * GET /api/cart
 * Retrieve the logged-in user's cart from PostgreSQL.
 */
async function getCart(req, res, next) {
  const userId = req.session.userId;

  try {
    const cart = await fetchUserCartDetails(userId);
    cartOperationsTotal.inc({ operation: 'view', status: 'success' });

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    cartOperationsTotal.inc({ operation: 'view', status: 'error' });
    logger.error({ err, userId }, 'Failed to retrieve shopping cart');
    return next(err);
  }
}

/**
 * POST /api/cart/items
 * Add a product to the authenticated user's cart.
 * Handles duplicate additions by updating the existing quantity with stock validation.
 */
async function addItemToCart(req, res, next) {
  const userId = req.session.userId;
  const { productId, quantity = 1, size = 'M' } = req.body || {};

  // Validate positive integer productId
  const parsedProductId = Number(productId);
  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid productId. Must be a positive integer.'
    });
  }

  // Validate positive integer quantity
  const parsedQty = Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Quantity must be a positive integer.'
    });
  }

  // Validate size string
  const cleanSize = typeof size === 'string' && size.trim() ? size.trim().toUpperCase() : 'M';

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const cartId = await getOrCreateUserCartId(userId, client);

    // Verify product exists and check stock
    const prodRes = await client.query(
      'SELECT id, name, price, stock FROM products WHERE id = $1 FOR SHARE',
      [parsedProductId]
    );

    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: `Product #${parsedProductId} not found.`
      });
    }

    const product = prodRes.rows[0];

    if (product.stock <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `"${product.name}" is currently out of stock.`
      });
    }

    // Check if the item already exists in this cart with the same size
    const existingRes = await client.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3 FOR UPDATE',
      [cartId, parsedProductId, cleanSize]
    );

    let finalQuantity;
    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      finalQuantity = existing.quantity + parsedQty;

      if (finalQuantity > product.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Cannot add ${parsedQty} more. You already have ${existing.quantity} in cart, and available stock is ${product.stock}.`
        });
      }

      await client.query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [finalQuantity, existing.id]
      );
    } else {
      finalQuantity = parsedQty;

      if (finalQuantity > product.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Requested quantity (${parsedQty}) exceeds available stock (${product.stock}).`
        });
      }

      await client.query(
        'INSERT INTO cart_items (cart_id, product_id, size, quantity) VALUES ($1, $2, $3, $4)',
        [cartId, parsedProductId, cleanSize, finalQuantity]
      );
    }

    await client.query('COMMIT');

    // Record Prometheus metrics
    cartProductsAddedTotal.inc({ status: 'success' });
    cartOperationsTotal.inc({ operation: 'add', status: 'success' });

    // Fetch updated cart details
    const updatedCart = await fetchUserCartDetails(userId);

    return res.status(201).json({
      success: true,
      message: `"${product.name}" (${cleanSize}) added to your wardrobe.`,
      data: updatedCart
    });
  } catch (err) {
    await client.query('ROLLBACK');
    cartOperationsTotal.inc({ operation: 'add', status: 'error' });
    logger.error({ err, userId, productId }, 'Error adding product to cart');
    return next(err);
  } finally {
    client.release();
  }
}

/**
 * PATCH /api/cart/items/:productId
 * Update quantity for a specific product in the authenticated user's cart.
 */
async function updateCartItemQuantity(req, res, next) {
  const userId = req.session.userId;
  const { productId } = req.params;
  const { quantity, size } = req.body || {};

  const parsedProductId = Number(productId);
  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid productId. Must be a positive integer.'
    });
  }

  const parsedQty = Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Quantity must be a positive integer greater than 0.'
    });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const cartId = await getOrCreateUserCartId(userId, client);

    // Verify product stock in PostgreSQL
    const prodRes = await client.query(
      'SELECT id, name, stock FROM products WHERE id = $1 FOR SHARE',
      [parsedProductId]
    );

    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: `Product #${parsedProductId} not found.`
      });
    }

    const product = prodRes.rows[0];

    if (parsedQty > product.stock) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Requested quantity (${parsedQty}) exceeds available stock (${product.stock}).`
      });
    }

    // Locate matching item in cart
    let itemQuery = 'SELECT id, size FROM cart_items WHERE cart_id = $1 AND product_id = $2';
    const itemParams = [cartId, parsedProductId];

    if (size && typeof size === 'string' && size.trim()) {
      itemQuery += ' AND UPPER(size) = UPPER($3)';
      itemParams.push(size.trim());
    }

    itemQuery += ' LIMIT 1 FOR UPDATE';

    const itemRes = await client.query(itemQuery, itemParams);

    if (itemRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: `Item with product #${parsedProductId} is not in your cart.`
      });
    }

    const targetItem = itemRes.rows[0];

    await client.query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [parsedQty, targetItem.id]
    );

    await client.query('COMMIT');

    cartOperationsTotal.inc({ operation: 'update', status: 'success' });

    const updatedCart = await fetchUserCartDetails(userId);

    return res.status(200).json({
      success: true,
      message: `Updated quantity for "${product.name}" to ${parsedQty}.`,
      data: updatedCart
    });
  } catch (err) {
    await client.query('ROLLBACK');
    cartOperationsTotal.inc({ operation: 'update', status: 'error' });
    logger.error({ err, userId, productId }, 'Error updating cart item quantity');
    return next(err);
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/cart/items/:productId
 * Remove a product from the authenticated user's cart.
 */
async function removeCartItem(req, res, next) {
  const userId = req.session.userId;
  const { productId } = req.params;
  const size = req.query.size || req.body?.size;

  const parsedProductId = Number(productId);
  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid productId. Must be a positive integer.'
    });
  }

  try {
    const cartId = await getOrCreateUserCartId(userId);

    let deleteSql = 'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2';
    const deleteParams = [cartId, parsedProductId];

    if (size && typeof size === 'string' && size.trim()) {
      deleteSql += ' AND UPPER(size) = UPPER($3)';
      deleteParams.push(size.trim());
    }

    deleteSql += ' RETURNING id';

    const result = await db.query(deleteSql, deleteParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Product #${parsedProductId} was not found in your cart.`
      });
    }

    cartOperationsTotal.inc({ operation: 'remove', status: 'success' });

    const updatedCart = await fetchUserCartDetails(userId);

    return res.status(200).json({
      success: true,
      message: 'Product removed from wardrobe.',
      data: updatedCart
    });
  } catch (err) {
    cartOperationsTotal.inc({ operation: 'remove', status: 'error' });
    logger.error({ err, userId, productId }, 'Error removing cart item');
    return next(err);
  }
}

/**
 * DELETE /api/cart
 * Clear all items from the authenticated user's cart.
 */
async function clearCart(req, res, next) {
  const userId = req.session.userId;

  try {
    const cartId = await getOrCreateUserCartId(userId);

    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    cartOperationsTotal.inc({ operation: 'clear', status: 'success' });

    return res.status(200).json({
      success: true,
      message: 'Shopping cart cleared successfully.',
      data: {
        cartId,
        items: [],
        itemCount: 0,
        subtotal: '0.00',
        total: '0.00'
      }
    });
  } catch (err) {
    cartOperationsTotal.inc({ operation: 'clear', status: 'error' });
    logger.error({ err, userId }, 'Error clearing shopping cart');
    return next(err);
  }
}

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
