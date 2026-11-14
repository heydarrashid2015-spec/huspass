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
  if (consent.action !== 'request_quote' || consent.granted !== true || consent.revoked !== false)
    return reject('consent_not_active');
  if (typeof consent.id !== 'string' || !consent.id.trim() ||
      typeof consent.grantedAt !== 'string' || typeof consent.expiresAt !== 'string')
    return reject('consent_not_auditable');
  if (typeof now !== 'string') return reject('consent_expired_or_invalid');
  // Require explicit UTC timestamps; Date.parse accepts ambiguous local dates and rollover values.
  const parseUtc = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return NaN;
    const epoch = Date.parse(value);
    if (!Number.isFinite(epoch)) return NaN;
    const canonical = new Date(epoch).toISOString();
    const supplied = value.includes('.') ? value.replace(/\.(\d{1,3})Z$/, (_, digits) => '.' + digits.padEnd(3, '0') + 'Z') : value.replace('Z', '.000Z');
    return canonical === supplied ? epoch : NaN;
  };
  const current = parseUtc(now);
  const granted = parseUtc(consent.grantedAt);
  const expiry = parseUtc(consent.expiresAt);
  if (![current, granted, expiry].every(Number.isFinite) || granted > current ||
      expiry <= current || expiry <= granted) return reject('consent_expired_or_invalid');
  if (contractor.cvrVerified !== true || typeof contractor.cvr !== 'string' || !/^\d{8}$/.test(contractor.cvr))
    return reject('contractor_not_verified');
  // Consent must bind the verified legal entity, not merely a mutable contractor row ID.
  if (typeof consent.approvedCvr !== 'string' || consent.approvedCvr !== contractor.cvr)
    return reject('contractor_identity_changed');
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
