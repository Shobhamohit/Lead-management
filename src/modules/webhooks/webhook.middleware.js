const env = require('../../core/env');
const ApiError = require('../../common/errors/api-error');

/**
 * Protects webhook endpoints with a shared secret sent in the
 * `X-Webhook-Secret` header (these endpoints have no JWT/user).
 *
 * - Missing/invalid header  -> 401
 * - Secret not configured   -> 500 (never run webhooks unprotected)
 *
 * The secret itself is never logged or echoed.
 */
const verifyWebhookSecret = (req, res, next) => {
  const configured = env.WEBHOOK_SECRET;

  if (!configured) {
    return next(new Error('WEBHOOK_SECRET is not configured'));
  }

  const provided = req.headers['x-webhook-secret'];
  if (!provided || provided !== configured) {
    return next(ApiError.unauthorized('Invalid or missing webhook secret'));
  }

  return next();
};

module.exports = { verifyWebhookSecret };
