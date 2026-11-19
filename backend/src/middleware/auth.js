/**
 * Authentication & Authorization Middleware
 * Protects endpoints and enforces role-based permissions.
 */

// Reusable middleware to require an active session
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Authentication required. Please log in to proceed.'
  });
}

// Reusable middleware to require specific role(s)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to proceed.'
      });
    }

    const userRole = req.session.userRole || 'customer';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to access this resource.'
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
