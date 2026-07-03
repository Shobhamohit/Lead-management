const asyncHandler = require('../../common/utils/async-handler');
const { sendSuccess } = require('../../common/responses');
const webhookService = require('./webhook.service');

/**
 * Webhook controllers — receive the request, delegate to the service,
 * return the response. No business logic here.
 *
 * Builds one thin handler per provider; the provider key selects the
 * adapter inside the service.
 */
const handle = (providerKey) =>
  asyncHandler(async (req, res) => {
    const lead = await webhookService.ingestLead(providerKey, req.body);
    return sendSuccess(res, { leadId: lead.id }, 'Lead received successfully', 201);
  });

module.exports = {
  website: handle('website'),
  meta: handle('meta'),
  google: handle('google')
};
