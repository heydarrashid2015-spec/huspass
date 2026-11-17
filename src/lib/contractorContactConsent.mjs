// Explicit, scoped customer consent is mandatory before contractor outreach.
// This is a pure authorization gate; it never sends messages or exposes customer data.
export function canContactContractor({ consent, customerId, homeId, contractorCvr, now = Date.now() } = {}) {
  if (!consent || typeof consent !== 'object' || Array.isArray(consent)) return false;
  // Authorization must come from a plain persisted record, never a class instance.
  const prototype = Object.getPrototypeOf(consent);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (typeof customerId !== 'string' || !customerId || typeof homeId !== 'string' || !homeId) return false;
  if (!/^\d{8}$/.test(String(contractorCvr || ''))) return false;
  if (consent.revoked === true || consent.approved !== true) return false;
  if (consent.customerId !== customerId || consent.homeId !== homeId) return false;
  if (consent.contractorCvr !== String(contractorCvr)) return false;
  if (consent.purpose !== 'request_quote') return false;
  if (typeof consent.approvedAt !== 'string' || !Number.isFinite(Date.parse(consent.approvedAt))) return false;
  const approvedAt = Date.parse(consent.approvedAt);
  if (!Number.isFinite(now) || approvedAt > now) return false;
  if (typeof consent.expiresAt !== 'string' || !Number.isFinite(Date.parse(consent.expiresAt))) return false;
  const expiresAt = Date.parse(consent.expiresAt);
  // An inverted or zero-length validity window cannot authorize outreach.
  return expiresAt > approvedAt && now < expiresAt;
}
