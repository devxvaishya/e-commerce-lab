
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { logger } = require('../config/logger');

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Helper to ensure a registered user has a corresponding cart row.
 */
async function ensureUserCart(userId, client = null) {
  const queryExecutor = client || db;
  await queryExecutor.query(
    'INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  );
}

/**
 * POST /api/auth/register
 * Registers a new user, hashes password, provisions cart, and establishes session.
 */
async function register(req, res, next) {
  const { name, email, password } = req.validatedRegister;

  try {
    // Check if email already registered
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // Hash password securely with bcryptjs
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user record
    const insertRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, 'customer']
    );

    const newUser = insertRes.rows[0];

    // Automatically create a unique cart for the new user
    await ensureUserCart(newUser.id);

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('[Session Error]', err);
        return next(err);
      }

      req.session.userId = newUser.id;
      req.session.userName = newUser.name;
      req.session.userEmail = newUser.email;
      req.session.userRole = newUser.role;

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.created_at
          }
        }
      });
    });
  } catch (err) {
    // Handle unique violation if race condition occurred
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }
    return next(err);
  }
}

/**
 * POST /api/auth/login
 * Validates credentials, regenerates session ID, and stores session data.
 */
async function login(req, res, next) {
  const { email, password } = req.validatedLogin;

  try {
    // Fetch user by lowercase email
    const result = await db.query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn({ event: 'login_failed', reason: 'user_not_found', reqId: req.id }, 'Failed login attempt');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn({ event: 'login_failed', reason: 'invalid_password', userId: user.id, reqId: req.id }, 'Failed login attempt');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Ensure user has a cart
    await ensureUserCart(user.id);

    // Regenerate session ID to mitigate session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        logger.error({ err, reqId: req.id }, 'Session regeneration error during login');
        return next(err);
      }

      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;

      logger.info({ event: 'login_success', userId: user.id, reqId: req.id }, 'User authenticated successfully');

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.created_at
          }
        }
      });
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/logout
 * Destroys session and clears cookie.
 */
function logout(req, res, next) {
  if (!req.session) {
    return res.status(200).json({
      success: true,
      message: 'Already logged out.'
    });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('[Logout Session Error]', err);
      return next(err);
    }

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
}

/**
 * GET /api/auth/me
 * Returns current authenticated user state.
 */
async function getCurrentUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(200).json({
      success: true,
      data: {
        authenticated: false,
        user: null
      }
    });
  }

  try {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      // Session exists for user that was removed from DB
      return req.session.destroy(() => {
        res.status(200).json({
          success: true,
          data: {
            authenticated: false,
            user: null
          }
        });
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        }
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
