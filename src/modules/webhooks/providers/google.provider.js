const { LeadSource } = require('@prisma/client');

/**
 * Google Lead Form Ads provider adapter.
 *
 * Real Google lead webhooks deliver a `user_column_data` array
 * ([{ column_id, string_value }]); simulated/Postman payloads may send
 * the same fields flat. Both shapes are supported. Output is the common
 * Lead DTO.
 */

// Coerce a present value to string; absent/null -> undefined.
const toStr = (v) => (v === undefined || v === null ? undefined : String(v));

// Pull a value out of Google's user_column_data array by column id.
const fromColumns = (columns, columnId) => {
  if (!Array.isArray(columns)) {
    return undefined;
  }
  const col = columns.find((c) => c && c.column_id === columnId);
  return col ? col.string_value : undefined;
};

const normalize = (payload = {}) => {
  const cols = payload.user_column_data;
  const phone = payload.phone ?? payload.phone_number ?? fromColumns(cols, 'PHONE_NUMBER');

  return {
    name: payload.name ?? payload.full_name ?? fromColumns(cols, 'FULL_NAME'),
    phone: toStr(phone),
    email: payload.email ?? fromColumns(cols, 'EMAIL'),
    campaign: payload.campaign ?? payload.campaign_name ?? payload.campaign_id ?? null,
    source: LeadSource.GOOGLE
  };
};

module.exports = { normalize };
