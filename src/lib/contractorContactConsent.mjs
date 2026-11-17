// Explicit, scoped customer consent is mandatory before contractor outreach.
// This is a pure authorization gate; it never sends messages or exposes customer data.
// Require an unambiguous RFC 3339 timestamp with an explicit UTC offset.
// Date.parse alone accepts local dates and normalizes invalid calendar dates.
function parseConsentTimestamp(value) {
  if (typeof value !== 'string') return NaN;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, year, month, day, hour, minute, second, zone] = match;
  const offsetHour = zone === 'Z' ? 0 : Number(zone.slice(1, 3));
  const offsetMinute = zone === 'Z' ? 0 : Number(zone.slice(4, 6));
  if (+month < 1 || +month > 12 || +day < 1 || +hour > 23 || +minute > 59 || +second > 59 || offsetHour > 14 || (offsetHour === 14 && offsetMinute !== 0) || offsetMinute > 59) return NaN;
  const calendar = new Date(Date.UTC(+year, +month - 1, +day));
  if (calendar.getUTCFullYear() !== +year || calendar.getUTCMonth() !== +month - 1 || calendar.getUTCDate() !== +day) return NaN;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : NaN;
}

export function canContactContractor({ consent, customerId, homeId, contractorCvr, now = Date.now() } = {}) {
  if (!consent || typeof consent !== 'object' || Array.isArray(consent)) return false;
  // Authorization must come from a plain persisted record, never a class instance.
  const prototype = Object.getPrototypeOf(consent);
  if (prototype !== Object.prototype && prototype !== null) return false;
  // Reject prototype-inherited authorization fields, including polluted Object.prototype.
  for (const field of ['approved', 'customerId', 'homeId', 'contractorCvr', 'purpose', 'approvedAt', 'expiresAt']) {
    if (!Object.hasOwn(consent, field)) return false;
  }
  if (Object.hasOwn(consent, 'revoked') && consent.revoked !== false) return false;
  if (typeof customerId !== 'string' || !customerId || typeof homeId !== 'string' || !homeId) return false;
  if (!/^\d{8}$/.test(String(contractorCvr || ''))) return false;
  if ((consent.revoked !== undefined && consent.revoked !== false) || consent.approved !== true) return false;
  if (consent.customerId !== customerId || consent.homeId !== homeId) return false;
  if (consent.contractorCvr !== String(contractorCvr)) return false;
  if (consent.purpose !== 'request_quote') return false;
  const approvedAt = parseConsentTimestamp(consent.approvedAt);
  if (!Number.isFinite(approvedAt)) return false;
  if (!Number.isFinite(now) || approvedAt > now) return false;
  const expiresAt = parseConsentTimestamp(consent.expiresAt);
  if (!Number.isFinite(expiresAt)) return false;
  // An inverted or zero-length validity window cannot authorize outreach.
  return expiresAt > approvedAt && now < expiresAt;
}
