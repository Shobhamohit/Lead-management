const asyncHandler = require('../../common/utils/async-handler');
const { sendSuccess } = require('../../common/responses');
const userService = require('./user.service');
const { validateFcmToken } = require('./user.validation');

/**
 * User controllers — receive the request, delegate to the service,
 * return the response. No business logic here.
 */

/**
 * GET /api/users
 * Lists users for admin lead assignment (ADMIN only — gated at route).
 */
const list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  return sendSuccess(res, users, 'Users fetched successfully');
});

/**
 * POST /api/users/me/fcm-token
 * Saves or updates the authenticated user's FCM device token.
 */
const updateFcmToken = asyncHandler(async (req, res) => {
  const { token } = validateFcmToken(req.body);
  await userService.updateFcmToken(req.user.id, token);
  return sendSuccess(res, null, 'FCM token updated successfully');
});

module.exports = {
  list,
  updateFcmToken
};
