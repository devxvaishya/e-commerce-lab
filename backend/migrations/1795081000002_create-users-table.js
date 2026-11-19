/**
 * Migration 2: Create users table
 * Stores registered users with hashed passwords, roles and timestamps.
 */
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    name: {
      type: 'varchar(120)',
      notNull: true
    },
    email: {
      type: 'varchar(180)',
      notNull: true,
      unique: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'customer'
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

  pgm.createIndex('users', 'email', {
    name: 'idx_users_email',
    ifNotExists: true
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users', { ifExists: true, cascade: true });
};
