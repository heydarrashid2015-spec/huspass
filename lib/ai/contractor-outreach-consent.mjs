// Fail-closed preparation only. This function never sends messages or authorizes access to documents.
// Server must authenticate actor, verify project ownership and persist consent with audit trail.
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(value);
const cvr = value => typeof value === 'string' && /^\d{8}$/.test(value);
export function prepareContractorOutreach({ actorId, ownerId, projectId, consent, contractors, now } = {}) {
  if (!id(actorId) || actorId !== ownerId || !id(projectId)) return { status: 'denied', reason: 'ownership_not_established', requests: [] };
  if (!Number.isSafeInteger(now) || now <= 0) return { status: 'denied', reason: 'invalid_clock', requests: [] };
  if (!consent || consent.granted !== true || consent.revoked === true ||
      consent.actorId !== actorId || consent.projectId !== projectId ||
      consent.purpose !== 'contractor_quote_request' ||
      !Number.isSafeInteger(consent.grantedAt) || consent.grantedAt > now ||
      !Number.isSafeInteger(consent.expiresAt) || consent.expiresAt <= now ||
      !Array.isArray(consent.approvedCvrs)) {
    return { status: 'denied', reason: 'explicit_consent_required', requests: [] };
  }
  if (!Array.isArray(contractors) || contractors.length === 0 || contractors.length > 3 ||
      contractors.some(x => !x || !cvr(x.cvr) || x.verified !== true || typeof x.contactEmail !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.contactEmail) || /[\r\n]/.test(x.contactEmail))) {
    return { status: 'denied', reason: 'invalid_recipients', requests: [] };
  }
  const approved = new Set(consent.approvedCvrs);
  const cvrs = contractors.map(x => x.cvr);
  if (new Set(cvrs).size !== cvrs.length || approved.size !== consent.approvedCvrs.length ||
      cvrs.some(x => !approved.has(x))) {
    return { status: 'denied', reason: 'recipient_not_approved', requests: [] };
  }
  return { status: 'ready_for_server_review', requests: contractors.map(x => ({
    projectId, cvr: x.cvr, contactEmail: x.contactEmail
  })) };
}
