/**
 * Migration 3: Create carts and cart_items tables
 * Each registered user owns a unique cart.
 * Cart items reference existing products from Part 1 with size and positive quantity.
 */
exports.up = (pgm) => {
  // Carts table: 1-to-1 relationship with users
  pgm.createTable('carts', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      unique: true,
      references: '"users"',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  }, {
    ifNotExists: true
  });

  pgm.createIndex('carts', 'user_id', {
    name: 'idx_carts_user_id',
    ifNotExists: true
  });

  // Cart items table: references carts and existing products table
  pgm.createTable('cart_items', {
    id: 'id',
    cart_id: {
      type: 'integer',
      notNull: true,
      references: '"carts"',
      onDelete: 'CASCADE'
    },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"',
      onDelete: 'CASCADE'
    },
    size: {
      type: 'varchar(20)',
      notNull: true,
      default: 'M'
    },
    quantity: {
      type: 'integer',
      notNull: true,
      default: 1,
      check: 'quantity > 0'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  }, {
    ifNotExists: true,
    constraints: {
      unique: ['cart_id', 'product_id', 'size']
    }
  });

  pgm.createIndex('cart_items', 'cart_id', {
    name: 'idx_cart_items_cart_id',
    ifNotExists: true
  });

  pgm.createIndex('cart_items', 'product_id', {
    name: 'idx_cart_items_product_id',
    ifNotExists: true
  });
};

exports.down = (pgm) => {
  pgm.dropTable('cart_items', { ifExists: true, cascade: true });
  pgm.dropTable('carts', { ifExists: true, cascade: true });
};
