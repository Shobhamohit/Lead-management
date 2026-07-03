const { LeadSource } = require('@prisma/client');

/**
 * Meta Lead Ads provider adapter (Facebook & Instagram).
 *
 * Real Meta lead webhooks deliver answers in a `field_data` array
 * ([{ name, values: [...] }]); simulated/Postman payloads may send the
 * same fields flat. Both shapes are supported. The `platform` field
 * selects the lead source (FACEBOOK vs INSTAGRAM), defaulting to
 * FACEBOOK. Output is the common Lead DTO.
 */

// Coerce a present value to string; absent/null -> undefined.
const toStr = (v) => (v === undefined || v === null ? undefined : String(v));

// Pull a single value out of Meta's field_data array by field name.
const fromFieldData = (fieldData, key) => {
  if (!Array.isArray(fieldData)) {
    return undefined;
  }
  const entry = fieldData.find((f) => f && f.name === key);
  return entry && Array.isArray(entry.values) ? entry.values[0] : undefined;
};

const normalize = (payload = {}) => {
  const fd = payload.field_data;
  const platform = String(payload.platform || '').toLowerCase();
  const source = platform === 'instagram' ? LeadSource.INSTAGRAM : LeadSource.FACEBOOK;

  const phone = payload.phone_number ?? payload.phone ?? fromFieldData(fd, 'phone_number');

  return {
    name: payload.full_name ?? payload.name ?? fromFieldData(fd, 'full_name'),
    phone: toStr(phone),
    email: payload.email ?? fromFieldData(fd, 'email'),
    campaign: payload.campaign_name ?? payload.campaign ?? null,
    source
  };
};

module.exports = { normalize };
