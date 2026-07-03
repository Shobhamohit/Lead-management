const express = require('express');

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Lead Management API Running'
  });
});

// Module routes
router.use('/auth', require('../modules/auth'));
router.use('/leads', require('../modules/leads'));
router.use('/users', require('../modules/users'));
router.use('/webhooks', require('../modules/webhooks'));
router.use('/dashboard', require('../modules/dashboard'));

module.exports = router;
