const asyncHandler = require('../../common/utils/async-handler');
const { sendSuccess } = require('../../common/responses');
const authService = require('./auth.service');
const { validateLogin } = require('./auth.validation');

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const credentials = validateLogin(req.body);
  const result = await authService.login(credentials);
  return sendSuccess(res, result, 'Login successful');
});

/**
 * POST /api/auth/logout
 * Stateless JWT: the client discards the token. Endpoint exists for a
 * clean client contract and to log the action of an authenticated user.
 */
const logout = asyncHandler(async (req, res) => sendSuccess(res, null, 'Logout successful'));

module.exports = {
  login,
  logout
};
