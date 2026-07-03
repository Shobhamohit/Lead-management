const admin = require('firebase-admin');
const env = require('./env');

/**
 * Firebase Admin singleton.
 *
 * Initialization is lazy and idempotent: init() runs at most once, and
 * getMessaging() initializes on first use. When credentials are absent
 * (or invalid), Firebase is disabled gracefully — nothing throws, so the
 * app boots and lead creation keeps working without FCM.
 */

// True only when every service-account credential is present.
const isConfigured = Boolean(
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY
);

let app = null;

/**
 * Initializes the Firebase Admin app once and returns it (or null when
 * unconfigured / on credential error). Safe to call repeatedly.
 */
const init = () => {
  if (app) {
    return app;
  }

  if (!isConfigured) {
    console.warn(
      '[firebase] credentials not set — skipping initialization (FCM disabled)'
    );
    return null;
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY
      })
    });
    console.log('[firebase] initialized — FCM enabled');
    return app;
  } catch (err) {
    // Malformed credentials must never crash the process; FCM just stays off.
    console.error(`[firebase] initialization failed — FCM disabled: ${err.message}`);
    return null;
  }
};

/**
 * Returns the Firebase Messaging client, or null when Firebase is
 * unavailable. Callers must handle null and skip sending.
 */
const getMessaging = () => {
  const initialized = init();
  return initialized ? admin.messaging(initialized) : null;
};

module.exports = { isConfigured, init, getMessaging };
