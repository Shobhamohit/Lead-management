const prisma = require('../../core/prisma');

/**
 * Lead repository.
 *
 * The single place where Prisma is touched for leads. Services and
 * controllers must go through these methods rather than querying the
 * database directly, so query shape and includes stay consistent.
 */

// Shape returned to clients: lead fields plus a slim creator/assignee.
const leadInclude = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } }
};

/**
 * Builds the Prisma `where` filter for listing leads.
 * Search matches name/phone/email (case-insensitive for text fields).
 */
const buildWhere = ({ search, status, source }) => {
  /** @type {import('@prisma/client').Prisma.LeadWhereInput} */
  const where = {};

  if (status) {
    where.status = status;
  }
  if (source) {
    where.source = source;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  return where;
};

const createLead = (data) =>
  prisma.lead.create({ data, include: leadInclude });

const getLead = (id) =>
  prisma.lead.findUnique({ where: { id }, include: leadInclude });

/**
 * Lists leads (newest first) with pagination and optional filters.
 * Returns the page of items and the total count of matching rows.
 */
const listLeads = async ({ page, limit, search, status, source }) => {
  const where = buildWhere({ search, status, source });
  const skip = (page - 1) * limit;

  // Independent reads run in parallel. Avoids Prisma's interactive-transaction
  // maxWait timeout (P2028) on serverless Postgres cold starts; the page and
  // total are read close enough together that pagination stays correct.
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: leadInclude
    }),
    prisma.lead.count({ where })
  ]);

  return { items, total };
};

const updateLead = (id, data) =>
  prisma.lead.update({ where: { id }, data, include: leadInclude });

const deleteLead = (id) =>
  prisma.lead.delete({ where: { id } });

module.exports = {
  createLead,
  getLead,
  listLeads,
  updateLead,
  deleteLead
};
