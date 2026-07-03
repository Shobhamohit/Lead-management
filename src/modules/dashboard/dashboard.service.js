const { LeadStatus, LeadSource } = require('@prisma/client');
const repo = require('./dashboard.repository');

/**
 * Dashboard service — combines the repository's raw metrics into a
 * single, mobile-friendly response. No Prisma access here.
 */

// Turn a groupBy result ([{ <field>, _count }]) into a { value: count } map.
const toCountMap = (rows, field) => {
  /** @type {Record<string, number>} */
  const map = {};
  for (const row of rows) {
    map[row[field]] = row._count;
  }
  return map;
};

const getDashboard = async () => {
  const [statusCounts, sourceCounts, todayCount, recentLeads] = await repo.getDashboardMetrics();

  const statusMap = toCountMap(statusCounts, 'status');
  const sourceMap = toCountMap(sourceCounts, 'source');

  // Total derived from status groups — avoids an extra count query.
  const totalLeads = statusCounts.reduce((sum, row) => sum + row._count, 0);

  const summary = {
    totalLeads,
    todayLeads: todayCount,
    new: statusMap[LeadStatus.NEW] || 0,
    contacted: statusMap[LeadStatus.CONTACTED] || 0,
    followUp: statusMap[LeadStatus.FOLLOW_UP] || 0,
    converted: statusMap[LeadStatus.CONVERTED] || 0,
    rejected: statusMap[LeadStatus.REJECTED] || 0
  };

  // Always return every source key, defaulting missing ones to 0.
  /** @type {Record<string, number>} */
  const sources = {};
  for (const source of Object.values(LeadSource)) {
    sources[source] = sourceMap[source] || 0;
  }

  return { summary, sources, recentLeads };
};

module.exports = { getDashboard };
