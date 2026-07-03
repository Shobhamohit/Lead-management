const repo = require('./user.repository');

/**
 * User service — business logic only. All User table access goes through
 * the repository.
 */

/**
 * Saves or updates the authenticated user's FCM device token.
 */
const updateFcmToken = (userId, token) => repo.updateFcmToken(userId, token);

/**
 * Returns all users that currently have an FCM token registered.
 * Used by the notification flow to build its recipient list.
 */
const getUsersWithFcmToken = () => repo.findUsersWithFcmToken();

/**
 * Lists all users (slim, non-sensitive shape) for admin lead assignment.
 */
const listUsers = () => repo.findAllForAssignment();

module.exports = {
  updateFcmToken,
  getUsersWithFcmToken,
  listUsers
};
