const express = require('express');
const { authenticate } = require('../../common/middleware/auth.middleware');
const authController = require('./auth.controller');

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
