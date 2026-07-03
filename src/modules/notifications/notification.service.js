const userService = require('../users/user.service');
const firebaseService = require('./notification.firebase');

/**
 * Notification service — business logic for outbound push notifications.
 *
 * Owns *what* to send and *to whom*; delegates the actual delivery to the
 * Firebase transport. Touches Prisma only through user.service. Every
 * method is best-effort and never throws: a notification failure must
 * never break the action that triggered it (e.g. lead creation).
 */

// Per-source emoji so the notification reads at a glance which channel a
// lead came from. Falls back to a generic marker for unknown sources.
const SOURCE_EMOJI = {
  WEBSITE: '🌐',
  FACEBOOK: '📘',
  INSTAGRAM: '📸',
  GOOGLE: '🔍',
  MANUAL: '✍️'
};

// Title-case a source enum (FOLLOW_UP -> Follow Up, WEBSITE -> Website).
const prettySource = (source) =>
  String(source)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Builds the FCM payload for a new lead. FCM `data` values must be strings.
 */
const buildNewLeadPayload = (lead) => {
  const emoji = SOURCE_EMOJI[lead.source] || '📩';
  return {
    notification: {
      title: '🎯 New Lead Received',
      body: `👤 ${lead.name}  •  ${emoji} ${prettySource(lead.source)}`
    },
    data: {
      leadId: String(lead.id),
      source: String(lead.source),
      status: String(lead.status)
    },
    // Android delivery + styling hints: high priority + sound on the
    // high-importance "leads_high" channel (created natively), the branded
    // small icon, and the brand accent color that tints the icon + title —
    // so the notification is loud AND colorful instead of silent + white.
    android: {
      priority: 'high',
      notification: {
        channelId: 'leads_high',
        sound: 'default',
        defaultSound: true,
        defaultVibrateTimings: true,
        icon: 'ic_notification',
        color: '#3D5AFE',
        notificationPriority: 'PRIORITY_MAX'
      }
    }
  };
};

/**
 * Notifies every device with a registered FCM token about a new lead.
 * Best-effort: all errors are swallowed and logged.
 * @param {Object} lead - the created lead (id, name, source, status)
 */
const notifyNewLead = async (lead) => {
  try {
    const users = await userService.getUsersWithFcmToken();
    const tokens = users.map((user) => user.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return;
    }

    const result = await firebaseService.sendMulticast(tokens, buildNewLeadPayload(lead));
    console.log(
      `[notifications] new-lead push leadId=${lead.id} ` +
        `recipients=${tokens.length} success=${result.successCount} failure=${result.failureCount}`
    );
  } catch (err) {
    // Never let a notification failure propagate to the caller.
    console.error(`[notifications] notifyNewLead failed: ${err.message}`);
  }
};

module.exports = {
  notifyNewLead
};
