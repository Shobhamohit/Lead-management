const asyncHandler = require('../../common/utils/async-handler');
const { sendSuccess } = require('../../common/responses');
const dashboardService = require('./dashboard.service');

/**
 * GET /api/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard();
  return sendSuccess(res, data, 'Dashboard data fetched successfully');
});

module.exports = { getDashboard };
