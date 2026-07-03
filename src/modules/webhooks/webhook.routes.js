const express = require('express');
const { verifyWebhookSecret } = require('./webhook.middleware');
const webhookController = require('./webhook.controller');

const router = express.Router();

// Webhooks are authenticated by a shared secret, not JWT.
router.use(verifyWebhookSecret);

// POST /api/webhooks/website - leads from website forms
router.post('/website', webhookController.website);

// POST /api/webhooks/meta - leads from Meta Lead Ads (Facebook/Instagram)
router.post('/meta', webhookController.meta);

// POST /api/webhooks/google - leads from Google Lead Forms
router.post('/google', webhookController.google);

module.exports = router;
