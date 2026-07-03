const ApiError = require('../../common/errors/api-error');

/**
 * Validates the POST /users/me/fcm-token body.
 * Returns a normalized { token } or throws ApiError(400).
 */
const validateFcmToken = (body = {}) => {
  const token = typeof body.token === 'string' ? body.token.trim() : '';

  if (!token) {
    throw ApiError.badRequest('token is required');
  }

  return { token };
};

module.exports = {
  validateFcmToken
};
