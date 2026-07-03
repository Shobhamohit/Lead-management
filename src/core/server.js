const app = require('./app');
const env = require('./env');
const firebase = require('./firebase');

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  // Initialize Firebase once at boot. No-op/warn when FCM is unconfigured.
  firebase.init();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
