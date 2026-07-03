const prisma = require('../../core/prisma');

/**
 * Dashboard repository — the only place Prisma is touched for the
 * dashboard. All metrics are fetched in parallel (Promise.all) to
 * minimize round-trips to the database.
 */

const RECENT_LIMIT = 5;

// Midnight (server local time) — lower bound for "today's leads".
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Fetches all dashboard metrics in one batched transaction:
 *  - lead counts grouped by status
 *  - lead counts grouped by source
 *  - number of leads created today
 *  - the latest 5 leads (newest first)
 *
 * Total leads is derived from the status groups in the service, so no
 * extra count query is needed.
 *
 * These are independent, read-only aggregates, so they run in parallel with
 * Promise.all rather than an interactive $transaction. On serverless Postgres
 * (Neon), a cold start can exceed Prisma's 2s transaction maxWait and raise
 * P2028 ("Unable to start a transaction in the given time"); Promise.all
 * avoids that while returning the same tuple the service destructures.
 */
const getDashboardMetrics = () =>
  Promise.all([
    prisma.lead.groupBy({ by: ['status'], _count: true }),
    prisma.lead.groupBy({ by: ['source'], _count: true }),
    prisma.lead.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.lead.findMany({
      take: RECENT_LIMIT,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, source: true, status: true, createdAt: true }
    })
  ]);

module.exports = { getDashboardMetrics };
