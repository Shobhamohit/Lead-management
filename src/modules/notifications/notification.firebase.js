const { getMessaging } = require('../../core/firebase');
const userRepository = require('../users/user.repository');

// FCM error codes that mean the token is dead and should be purged.
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
]);

/**
 * Firebase transport.
 *
 * A thin wrapper around firebase-admin messaging. Pure delivery — no
 * business logic and no Prisma. Every method degrades gracefully: when
 * Firebase is unavailable or a send fails, it logs and returns a result
 * summary instead of throwing, so callers are never broken by FCM.
 */

const DISABLED_RESULT = { successCount: 0, failureCount: 0, skipped: true };

/**
 * Removes dead device tokens from the database via the user repository
 * (never touches Prisma directly). Best-effort: a cleanup failure is
 * logged and never propagated to the send result.
 * @param {string[]} tokens
 */
const clearInvalidTokens = async (tokens) => {
  if (tokens.length === 0) {
    return;
  }
  try {
    const { count } = await userRepository.clearFcmTokens(tokens);
    console.log(`[firebase] cleared ${count} invalid FCM token(s)`);
  } catch (err) {
    console.error(`[firebase] failed to clear invalid tokens: ${err.message}`);
  }
};

/**
 * Sends a notification to a single device token.
 * @param {string} token
 * @param {{ notification?: object, data?: object }} [payload]
 */
const send = async (token, { notification, data, android } = {}) => {
  const messaging = getMessaging();
  if (!messaging) {
    console.warn('[firebase] messaging unavailable — skipping push (FCM disabled)');
    return DISABLED_RESULT;
  }

  try {
    const messageId = await messaging.send({ token, notification, data, android });
    return { successCount: 1, failureCount: 0, messageId };
  } catch (err) {
    console.error(`[firebase] send failed: ${err.message}`);
    return { successCount: 0, failureCount: 1, error: err };
  }
};

/**
 * Sends the same notification to many device tokens.
 * @param {string[]} tokens
 * @param {{ notification?: object, data?: object }} [payload]
 */
const sendMulticast = async (tokens, { notification, data, android } = {}) => {
  const messaging = getMessaging();
  if (!messaging) {
    console.warn('[firebase] messaging unavailable — skipping push (FCM disabled)');
    return DISABLED_RESULT;
  }

  if (!Array.isArray(tokens) || tokens.length === 0) {
    return DISABLED_RESULT;
  }

  try {
    const response = await messaging.sendEachForMulticast({ tokens, notification, data, android });

    // Surface per-token failures (e.g. stale/unregistered tokens) without
    // failing the whole send, and collect dead tokens for cleanup.
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((res, i) => {
        if (!res.success) {
          console.warn(`[firebase] multicast token#${i} failed: ${res.error?.message}`);
          if (res.error && INVALID_TOKEN_CODES.has(res.error.code)) {
            invalidTokens.push(tokens[i]);
          }
        }
      });
      await clearInvalidTokens(invalidTokens);
    }

    return response;
  } catch (err) {
    console.error(`[firebase] sendMulticast failed: ${err.message}`);
    return { successCount: 0, failureCount: tokens.length, error: err };
  }
};

module.exports = {
  send,
  sendMulticast
};
