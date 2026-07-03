const env = require('../../core/env');
const ApiError = require('../errors/api-error');

/**
 * Maps an error to a { statusCode, message } pair, translating
 * known framework/library errors into meaningful HTTP responses.
 */
const mapError = (err) => {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  // JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token' };
  }
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token expired' };
  }

  // Prisma known request errors
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target)
      ? err.meta.target.join(', ')
      : 'field';
    return { statusCode: 409, message: `Duplicate value for ${target}` };
  }
  if (err.code === 'P2025') {
    return { statusCode: 404, message: 'Record not found' };
  }
  if (err.code === 'P2003') {
    return { statusCode: 400, message: 'Related record does not exist' };
  }

  // Malformed JSON body (express.json)
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Invalid JSON payload' };
  }

  return { statusCode: 500, message: 'Internal Server Error' };
};

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const { statusCode, message } = mapError(err);

  if (statusCode >= 500) {
    // Unexpected error: log it server-side for debugging.
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
