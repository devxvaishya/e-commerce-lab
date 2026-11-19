// Centralized error handling middleware
const { logger } = require('../config/logger');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

function globalErrorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';

  // Log unexpected exception with request ID
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    reqId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode
  }, 'Unhandled application exception');

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
