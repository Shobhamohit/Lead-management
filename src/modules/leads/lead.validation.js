const { LeadStatus, LeadSource } = require('@prisma/client');
const ApiError = require('../../common/errors/api-error');

/**
 * Pure validators for the Lead module.
 *
 * Each validator returns a normalized payload or throws ApiError(400)
 * with a meaningful, aggregated message. Mirrors the style of
 * auth.validation.js.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with optional leading + and common separators; 7-20 chars.
const PHONE_REGEX = /^\+?[0-9][0-9\s\-()]{6,19}$/;

const STATUS_VALUES = Object.values(LeadStatus);
const SOURCE_VALUES = Object.values(LeadSource);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const NAME_MAX = 120;
const CAMPAIGN_MAX = 120;
const REMARKS_MAX = 1000;

const isFilled = (value) =>
  value !== undefined && value !== null && value !== '';

/**
 * Validates POST /api/leads body (the lead's own fields).
 * source/status/createdBy are NOT taken from the client — the service
 * sets those. Returns { name, phone, email, campaign }.
 */
const validateCreateLead = (body = {}) => {
  const errors = [];

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const hasEmail = isFilled(body.email);
  const email = hasEmail && typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const hasCampaign = isFilled(body.campaign);
  const campaign = hasCampaign && typeof body.campaign === 'string' ? body.campaign.trim() : '';

  if (!name) {
    errors.push('name is required');
  } else if (name.length > NAME_MAX) {
    errors.push(`name must be at most ${NAME_MAX} characters`);
  }

  if (!phone) {
    errors.push('phone is required');
  } else if (!PHONE_REGEX.test(phone)) {
    errors.push('phone must be a valid phone number');
  }

  if (hasEmail && !EMAIL_REGEX.test(email)) {
    errors.push('email must be a valid email address');
  }

  if (hasCampaign && campaign.length > CAMPAIGN_MAX) {
    errors.push(`campaign must be at most ${CAMPAIGN_MAX} characters`);
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('; '));
  }

  return {
    name,
    phone,
    email: hasEmail ? email : null,
    campaign: hasCampaign ? campaign : null
  };
};

/**
 * Validates PATCH /api/leads/:id body.
 * Only status, remarks and assignedTo are updatable. Immutable fields
 * (id, source, createdBy, ...) are ignored. Requires at least one field.
 * Passing remarks/assignedTo as null or "" clears them.
 */
const validateUpdateLead = (body = {}) => {
  const errors = [];
  const data = {};

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !STATUS_VALUES.includes(body.status)) {
      errors.push(`status must be one of: ${STATUS_VALUES.join(', ')}`);
    } else {
      data.status = body.status;
    }
  }

  if (body.remarks !== undefined) {
    if (body.remarks === null || body.remarks === '') {
      data.remarks = null;
    } else if (typeof body.remarks !== 'string') {
      errors.push('remarks must be a string');
    } else if (body.remarks.trim().length > REMARKS_MAX) {
      errors.push(`remarks must be at most ${REMARKS_MAX} characters`);
    } else {
      data.remarks = body.remarks.trim();
    }
  }

  if (body.assignedTo !== undefined) {
    if (body.assignedTo === null || body.assignedTo === '') {
      data.assignedTo = null;
    } else if (typeof body.assignedTo !== 'string') {
      errors.push('assignedTo must be a valid user id');
    } else {
      data.assignedTo = body.assignedTo.trim();
    }
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('; '));
  }

  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest('Provide at least one field to update: status, remarks or assignedTo');
  }

  return data;
};

const parsePageInt = (value, fallback) => {
  if (value === undefined || value === '') {
    return fallback;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return NaN;
  }
  return n;
};

/**
 * Validates GET /api/leads query params.
 * Returns { page, limit, search, status, source } with sane defaults
 * (page 1, limit 20 capped at 100). undefined filters mean "no filter".
 */
const validateListQuery = (query = {}) => {
  const errors = [];

  let page = parsePageInt(query.page, 1);
  if (Number.isNaN(page)) {
    errors.push('page must be a positive integer');
    page = 1;
  }

  let limit = parsePageInt(query.limit, DEFAULT_PAGE_SIZE);
  if (Number.isNaN(limit)) {
    errors.push('limit must be a positive integer');
    limit = DEFAULT_PAGE_SIZE;
  } else if (limit > MAX_PAGE_SIZE) {
    limit = MAX_PAGE_SIZE;
  }

  let status;
  if (isFilled(query.status)) {
    if (!STATUS_VALUES.includes(query.status)) {
      errors.push(`status must be one of: ${STATUS_VALUES.join(', ')}`);
    } else {
      status = query.status;
    }
  }

  let source;
  if (isFilled(query.source)) {
    if (!SOURCE_VALUES.includes(query.source)) {
      errors.push(`source must be one of: ${SOURCE_VALUES.join(', ')}`);
    } else {
      source = query.source;
    }
  }

  const search =
    typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;

  if (errors.length > 0) {
    throw ApiError.badRequest(errors.join('; '));
  }

  return { page, limit, search, status, source };
};

module.exports = {
  validateCreateLead,
  validateUpdateLead,
  validateListQuery,
  EMAIL_REGEX,
  PHONE_REGEX
};
