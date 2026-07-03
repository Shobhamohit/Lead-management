/**
 * Wraps an async route handler so rejected promises are forwarded
 * to Express's error middleware instead of crashing the process.
 */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
