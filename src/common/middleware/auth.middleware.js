const jwt = require('jsonwebtoken');
const env = require('../../core/env');
const ApiError = require('../errors/api-error');

/**
 * Verifies the Bearer JWT and attaches { id, role, email } to req.user.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Authorization token required'));
  }

  try {
    const payload = /** @type {import('jsonwebtoken').JwtPayload} */ (
      jwt.verify(token, env.JWT_SECRET)
    );
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    // JsonWebTokenError / TokenExpiredError handled by error middleware.
    return next(err);
  }
};

/**
 * Restricts a route to the given roles. Must run after authenticate.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('Insufficient permissions'));
  }
  return next();
};

const requireAdmin = requireRole('ADMIN');

module.exports = {
  authenticate,
  requireRole,
  requireAdmin
};
