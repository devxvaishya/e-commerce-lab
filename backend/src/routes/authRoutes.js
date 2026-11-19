const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validator');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/register - Register new account
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login - Log into account
router.post('/login', validateLogin, authController.login);

// POST /api/auth/logout - Destroy session
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current session user
router.get('/me', authController.getCurrentUser);

// GET /api/auth/test-protected - Verify requireAuth middleware
router.get('/test-protected', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to protected resource.',
    data: {
      userId: req.session.userId,
      userEmail: req.session.userEmail,
      userRole: req.session.userRole
    }
  });
});

module.exports = router;
