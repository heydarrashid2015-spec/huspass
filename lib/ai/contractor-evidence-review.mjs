// Review-only evidence gate. Caller must independently authenticate the actor, load
// consent and company evidence from trusted server storage, and enforce RLS.
// Never send messages or treat a client-supplied 'verified' flag as proof.
const validId = x => typeof x === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(x);
const validCvr = x => typeof x === 'string' && /^\d{8}$/.test(x);
const validEmail = x => typeof x === 'string' && x.length <= 254 &&
  /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(x) && !/[\r\n]/.test(x);
const validHttps = x => {
  if (typeof x !== 'string') return false;
  try { const u = new URL(x); return u.protocol === 'https:' && Boolean(u.hostname) &&
    !u.username && !u.password && !['localhost','127.0.0.1','::1'].includes(u.hostname); }
  catch { return false; }
};
export function reviewContractorEvidence({ actorId, ownerId, projectId, consent, recipients, evidence, now } = {}) {
  const deny = reason => ({ status: 'denied', reason, requests: [] });
  if (!validId(actorId) || actorId !== ownerId || !validId(projectId)) return deny('ownership_not_established');
  if (!Number.isSafeInteger(now) || now <= 0) return deny('invalid_clock');
  if (!consent || consent.granted !== true || consent.revoked !== false ||
      consent.actorId !== actorId || consent.projectId !== projectId ||
      consent.purpose !== 'contractor_quote_request' ||
      !Number.isSafeInteger(consent.grantedAt) || consent.grantedAt > now ||
      !Number.isSafeInteger(consent.expiresAt) || consent.expiresAt <= now ||
      !Array.isArray(consent.approvedCvrs) ||
      consent.approvedCvrs.some(c => !validCvr(c)) ||
      new Set(consent.approvedCvrs).size !== consent.approvedCvrs.length) return deny('explicit_consent_required');
  if (!Array.isArray(recipients) || recipients.length < 1 || recipients.length > 3 ||
      recipients.some(r => !r || !validCvr(r.cvr) || !validEmail(r.contactEmail)) ||
      new Set(recipients.map(r => r.cvr)).size !== recipients.length ||
      recipients.some(r => !consent.approvedCvrs.includes(r.cvr))) return deny('invalid_recipients');
  if (!Array.isArray(evidence) || evidence.length !== recipients.length ||
      new Set(evidence.map(e => e?.cvr)).size !== evidence.length) return deny('evidence_mismatch');
  for (const recipient of recipients) {
    const e = evidence.find(item => item?.cvr === recipient.cvr);
    if (!e || e.projectId !== projectId || e.cvr !== recipient.cvr ||
        e.contactEmail !== recipient.contactEmail || e.registryStatus !== 'active' ||
        e.registrySource !== 'official_cvr' || !validHttps(e.registryUrl) ||
        !validHttps(e.contactSourceUrl) ||
        !Number.isSafeInteger(e.checkedAt) || e.checkedAt > now ||
        now - e.checkedAt > 7 * 86400 ||
        e.categoryMatch !== true || e.serviceAreaMatch !== true) return deny('evidence_unverified');
  }
  return { status: 'ready_for_server_review',
    requests: recipients.map(r => ({ projectId, cvr: r.cvr, contactEmail: r.contactEmail })) };
}
