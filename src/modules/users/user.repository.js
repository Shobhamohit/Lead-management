const prisma = require('../../core/prisma');

/**
 * User repository.
 *
 * The single place where Prisma is touched for users (outside auth's
 * login lookup). Services go through these methods rather than querying
 * the database directly.
 */

/**
 * Stores/updates a user's FCM device token. Selects a slim shape so the
 * password hash never leaves the repository.
 */
const updateFcmToken = (userId, fcmToken) =>
  prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
    select: { id: true, fcmToken: true }
  });

/**
 * Returns every user that has a registered FCM token. Slim shape — only
 * what the notification flow needs.
 */
const findUsersWithFcmToken = () =>
  prisma.user.findMany({
    where: { fcmToken: { not: null } },
    select: { id: true, fcmToken: true }
  });

/**
 * Returns all users with a slim, non-sensitive shape for admin lead
 * assignment (no password / fcmToken). Ordered by name.
 */
const findAllForAssignment = () =>
  prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  });

/**
 * Clears the stored FCM token for any user whose token is in the given
 * list (e.g. tokens Firebase reported as unregistered/invalid). Matching
 * by token value leaves every other user's token untouched.
 * @param {string[]} tokens
 */
const clearFcmTokens = (tokens) => {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return Promise.resolve({ count: 0 });
  }
  return prisma.user.updateMany({
    where: { fcmToken: { in: tokens } },
    data: { fcmToken: null }
  });
};

module.exports = {
  updateFcmToken,
  findUsersWithFcmToken,
  findAllForAssignment,
  clearFcmTokens
};
