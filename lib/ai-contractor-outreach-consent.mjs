// Fail-closed, side-effect-free authorization gate for contractor quote outreach.
// The caller MUST authenticate on the server and re-check ownership in Supabase.
// This module never sends email, SMS or network requests.
const plain = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) &&
    Object.values(Object.getOwnPropertyDescriptors(value)).every(d => Object.hasOwn(d, 'value'));
};
const reject = reason => ({ allowed: false, reason });
export function authorizeContractorOutreach({ consent, project, contractor, authenticatedOwnerId, now } = {}) {
  if (![consent, project, contractor].every(plain)) return reject('invalid_record');
  if (typeof authenticatedOwnerId !== 'string' || !authenticatedOwnerId.trim()) return reject('unauthenticated');
  if (project.ownerId !== authenticatedOwnerId || consent.ownerId !== authenticatedOwnerId ||
      consent.projectId !== project.id || consent.contractorId !== contractor.id) return reject('scope_mismatch');
  if (consent.action !== 'request_quote' || consent.granted !== true || consent.revoked === true)
    return reject('consent_not_active');
  if (typeof consent.id !== 'string' || !consent.id.trim() ||
      typeof consent.grantedAt !== 'string' || typeof consent.expiresAt !== 'string')
    return reject('consent_not_auditable');
  if (typeof now !== 'string') return reject('consent_expired_or_invalid');
  const current = Date.parse(now);
  const granted = Date.parse(consent.grantedAt);
  const expiry = Date.parse(consent.expiresAt);
  if (![current, granted, expiry].every(Number.isFinite) || granted > current ||
      expiry <= current || expiry <= granted) return reject('consent_expired_or_invalid');
  if (contractor.cvrVerified !== true || typeof contractor.cvr !== 'string' || !/^\d{8}$/.test(contractor.cvr))
    return reject('contractor_not_verified');
  if (typeof project.description !== 'string' || !project.description.trim())
    return reject('missing_customer_description');
  if (typeof consent.approvedDescription !== 'string' ||
      consent.approvedDescription !== project.description)
    return reject('description_not_approved');
  if (consent.channel !== 'email' || typeof contractor.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractor.email))
    return reject('unsupported_contact_channel');
  return { allowed: true, consentId: consent.id, contractorId: contractor.id, projectId: project.id };
}
