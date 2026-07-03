const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../core/prisma');
const env = require('../../core/env');
const ApiError = require('../../common/errors/api-error');

/**
 * Signs a JWT for an authenticated user.
 */
const signToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.JWT_SECRET,
    /** @type {import('jsonwebtoken').SignOptions} */ ({ expiresIn: env.JWT_EXPIRES_IN })
  );

/**
 * Strips sensitive fields before returning a user to clients.
 */
const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

/**
 * Authenticates a user by email + password.
 * Returns { token, user } or throws ApiError(401) on bad credentials.
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Generic message + always-run compare to avoid user enumeration
  // and timing leaks.
  if (!user) {
    await bcrypt.compare(password, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinv');
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return { token: signToken(user), user: toPublicUser(user) };
};

module.exports = {
  login,
  signToken,
  toPublicUser
};
