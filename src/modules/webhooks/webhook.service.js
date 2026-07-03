const env = require('../../core/env');
const ApiError = require('../../common/errors/api-error');
const leadService = require('../leads/lead.service');
const { validateCreateLead } = require('../leads/lead.validation');

const websiteProvider = require('./providers/website.provider');
const metaProvider = require('./providers/meta.provider');
const googleProvider = require('./providers/google.provider');

/**
 * Webhook service.
 *
 * Orchestrates provider lead ingestion:
 *   1. select the provider adapter
 *   2. normalize the provider payload -> common Lead DTO
 *   3. validate the DTO (reuses the Lead module's validator)
 *   4. delegate creation to LeadService.createLead() — the single
 *      source of truth. No lead-creation or DB logic lives here.
 */

const PROVIDERS = {
  website: websiteProvider,
  meta: metaProvider,
  google: googleProvider
};

const ingestLead = async (providerKey, payload) => {
  const provider = PROVIDERS[providerKey];
  if (!provider) {
    throw ApiError.badRequest(`Unknown webhook provider: ${providerKey}`);
  }

  // Webhook leads are owned by a configured "system" user, since there
  // is no authenticated user on these requests.
  const createdBy = env.WEBHOOK_SYSTEM_USER_ID;
  if (!createdBy) {
    throw new Error('WEBHOOK_SYSTEM_USER_ID is not configured');
  }

  // 1 + 2. provider adapter -> common internal DTO
  const dto = provider.normalize(payload || {});

  // 3. validate the normalized payload (meaningful 400s, no duplication)
  const validated = validateCreateLead(dto);

  // 4. delegate to the single lead-creation path
  const lead = await leadService.createLead({
    ...validated,
    source: dto.source,
    createdBy
  });

  // Log accepted webhook (no secrets / sensitive data).
  console.log(
    `[webhook] provider=${providerKey} time=${new Date().toISOString()} ` +
      `lead="${lead.name}" status=${lead.status} leadId=${lead.id}`
  );

  return lead;
};

module.exports = { ingestLead };
