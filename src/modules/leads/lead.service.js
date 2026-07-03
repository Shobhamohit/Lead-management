const { LeadSource, LeadStatus } = require('@prisma/client');
const repo = require('./lead.repository');
const ApiError = require('../../common/errors/api-error');
const notificationService = require('../notifications/notification.service');

/**
 * Lead service — business logic only. The single source of truth for
 * lead creation: the manual API and (later) the Website/Meta/Google
 * webhooks all funnel through createLead(), so creation rules live in
 * exactly one place.
 */

/**
 * Creates a lead. Callers supply the trusted fields (source, createdBy);
 * status defaults to NEW. Used by manual creation and webhook ingestion.
 *
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.phone
 * @param {string|null} [input.email]
 * @param {string|null} [input.campaign]
 * @param {string} input.source     - LeadSource (WEBSITE, FACEBOOK, ...)
 * @param {string} input.createdBy  - id of the creating user
 * @param {string} [input.status]   - LeadStatus, defaults to NEW
 * @param {string|null} [input.assignedTo]
 */
const createLead = async (input) => {
  const lead = await repo.createLead({
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    campaign: input.campaign ?? null,
    source: input.source,
    status: input.status ?? LeadStatus.NEW,
    createdBy: input.createdBy,
    assignedTo: input.assignedTo ?? null
  });

  // Fire a push notification to all registered devices. Best-effort:
  // notifyNewLead never throws, and we don't await it so a slow/failed
  // push can never delay or break lead creation. Covers manual creation
  // and every webhook, since they all funnel through here.
  notificationService.notifyNewLead(lead);

  return lead;
};

/**
 * Manual lead creation via POST /api/leads.
 * Forces source = MANUAL and createdBy = the authenticated user, then
 * delegates to the shared createLead() — no duplicated creation logic.
 */
const createManualLead = (data, userId) =>
  createLead({ ...data, source: LeadSource.MANUAL, createdBy: userId });

/**
 * Fetches a single lead or throws 404.
 */
const getLeadById = async (id) => {
  const lead = await repo.getLead(id);
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
};

/**
 * Lists leads with pagination metadata.
 */
const listLeads = async ({ page, limit, search, status, source }) => {
  const { items, total } = await repo.listLeads({ page, limit, search, status, source });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Updates an existing lead's mutable fields. 404 if it does not exist.
 */
const updateLead = async (id, data) => {
  await getLeadById(id);
  return repo.updateLead(id, data);
};

/**
 * Deletes a lead. 404 if it does not exist.
 * (Schema has no soft-delete column, so this is a hard delete.)
 */
const deleteLead = async (id) => {
  await getLeadById(id);
  await repo.deleteLead(id);
};

module.exports = {
  createLead,
  createManualLead,
  getLeadById,
  listLeads,
  updateLead,
  deleteLead
};
