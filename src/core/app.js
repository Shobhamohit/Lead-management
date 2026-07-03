const express = require('express');
const cors = require('cors');
const env = require('./env');
const router = require('./router');
const errorMiddleware = require('../common/middleware/error.middleware');

const app = express();

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', router);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use(errorMiddleware);

module.exports = app;
