// Consent gate for future quote-request integration. Never send from the client automatically.
// The server must independently authenticate the user and authorize project ownership.
export function prepareContractorContact({ project, contractor, consent, authenticatedUserId, ownerUserId, now = new Date() }) {
  const reject = reason => ({ allowed: false, reason, request: null });
  if (!authenticatedUserId || authenticatedUserId !== ownerUserId) return reject('owner_authorization_required');
  if (!project?.id || !contractor?.id) return reject('missing_project_or_contractor');
  if (!consent || consent.granted !== true || consent.projectId !== project.id ||
      consent.contractorId !== contractor.id || consent.userId !== authenticatedUserId)
    return reject('specific_consent_required');
  if (!consent.grantedAt || !Number.isFinite(Date.parse(consent.grantedAt)) ||
      Date.parse(consent.grantedAt) > now.getTime() ||
      now.getTime() - Date.parse(consent.grantedAt) > 24 * 60 * 60 * 1000)
    return reject('consent_expired_or_invalid');
  if (consent.revokedAt || consent.usedAt) return reject('consent_revoked_or_used');
  const description = typeof project.description === 'string' ? project.description.trim() : '';
  if (description.length < 10 || description.length > 2000) return reject('project_description_required');
  // Never include homeowner address, email, phone or stored documents by default.
  return { allowed: true, reason: null, request: {
    projectId: project.id, contractorId: contractor.id,
    description, category: String(project.category || '').slice(0, 100),
    consentId: String(consent.id || ''),
  }};
}
