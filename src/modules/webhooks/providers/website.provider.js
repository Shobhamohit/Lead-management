const { LeadSource } = require('@prisma/client');

// Coerce a present value to string; absent/null -> undefined.
const toStr = (v) => (v === undefined || v === null ? undefined : String(v));

/**
 * Website form provider adapter.
 *
 * Converts a website contact/inquiry form payload into the common
 * internal Lead DTO: { name, phone, email, campaign, source }.
 * Accepts a few common field aliases so the rest of the app never
 * needs to know the website's exact form shape.
 */
const normalize = (payload = {}) => {
  const phone = payload.phone ?? payload.mobile ?? payload.contact;

  return {
    name: payload.name ?? payload.full_name,
    phone: toStr(phone),
    email: payload.email,
    campaign: payload.campaign ?? payload.utm_campaign ?? payload.service ?? null,
    source: LeadSource.WEBSITE
  };
};

module.exports = { normalize };
