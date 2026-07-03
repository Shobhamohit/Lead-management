const ApiError = require('../../common/errors/api-error');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the POST /auth/login body.
 * Returns a normalized { email, password } or throws ApiError(400).
 */
const validateLogin = (body = {}) => {
  const errors = [];
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email) {
    errors.push('email is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('email must be a valid email address');
  }

  if (!password) {
    errors.push('password is required');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('; '));
  }

  return { email, password };
};

module.exports = {
  validateLogin,
  EMAIL_REGEX
};
