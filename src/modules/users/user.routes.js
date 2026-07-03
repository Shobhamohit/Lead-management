const express = require('express');
const { authenticate, requireAdmin } = require('../../common/middleware/auth.middleware');
const userController = require('./user.controller');

const router = express.Router();

// All user endpoints require a valid JWT.
router.use(authenticate);

// GET /api/users — list users for admin lead assignment (admin only)
router.get('/', requireAdmin, userController.list);

// POST /api/users/me/fcm-token — register/update this user's FCM token
router.post('/me/fcm-token', userController.updateFcmToken);

module.exports = router;
