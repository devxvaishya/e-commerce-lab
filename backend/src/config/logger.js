const pino = require('pino');
const pinoHttp = require('pino-http');
const crypto = require('crypto');

// Configure structured logger with security redaction
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'res.headers["set-cookie"]',
      'password',
      'password_hash',
      'passwordHash',
      'token',
      'sessionId',
      'session_id',
      '*.password',
      '*.password_hash',
      '*.passwordHash',
      'body.password',
      'body.passwordHash',
      'req.body.password',
      'req.body.passwordHash'
    ],
    censor: '[REDACTED]'
  },
  formatters: {
    level(label) {
      return { level: label };
    }
  }
});

// Configure pino-http middleware for HTTP request & response logging
const httpLogger = pinoHttp({
  logger,
  genReqId: function (req) {
    // Generate or propagate request ID for end-to-end tracing
    return req.headers['x-request-id'] || crypto.randomUUID();
  },
  autoLogging: {
    ignore: (req) => {
      // Do not clutter logs with /metrics scrapes
      return req.url === '/metrics';
    }
  },
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: function (req, res) {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: function (req, res, err) {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${err.message}`;
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        remoteAddress: req.remoteAddress
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});

module.exports = {
  logger,
  httpLogger
};
