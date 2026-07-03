const asyncHandler = require('../../common/utils/async-handler');
const { sendSuccess } = require('../../common/responses');
const leadService = require('./lead.service');
const {
  validateCreateLead,
  validateUpdateLead,
  validateListQuery
} = require('./lead.validation');

/**
 * Lead controllers — receive the request, delegate to the service,
 * return the response. No business logic here.
 */

/**
 * GET /api/leads
 */
const list = asyncHandler(async (req, res) => {
  const query = validateListQuery(req.query);
  const result = await leadService.listLeads(query);
  return sendSuccess(res, result, 'Leads fetched successfully');
});

/**
 * GET /api/leads/:id
 */
const getById = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
});

/**
 * POST /api/leads
 */
const create = asyncHandler(async (req, res) => {
  const data = validateCreateLead(req.body);
  const lead = await leadService.createManualLead(data, req.user.id);
  return sendSuccess(res, lead, 'Lead created successfully', 201);
});

/**
 * PATCH /api/leads/:id
 */
const update = asyncHandler(async (req, res) => {
  const data = validateUpdateLead(req.body);
  const lead = await leadService.updateLead(req.params.id, data);
  return sendSuccess(res, lead, 'Lead updated successfully');
});

/**
 * DELETE /api/leads/:id
 */
const remove = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.params.id);
  return sendSuccess(res, null, 'Lead deleted successfully');
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
