const express = require('express');
const { authenticate } = require('../../common/middleware/auth.middleware');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

// Dashboard requires a valid JWT.
router.use(authenticate);

// GET /api/dashboard — summary, source counts and recent leads
router.get('/', dashboardController.getDashboard);

module.exports = router;
