// Pure, server-side preflight. Never treat client-provided ownerId as authentication.
export function prepareQuoteRequest({ project, contractor, consent, authenticatedUserId, now = Date.now() }) {
  const reject = reason => ({ ok: false, reason, payload: null });
  if (!authenticatedUserId || typeof authenticatedUserId !== 'string') return reject('authentication_required');
  if (!project?.id || project.ownerId !== authenticatedUserId) return reject('project_ownership_not_verified');
  if (!contractor?.id || !/^https:\/\//.test(contractor.sourceUrl || '')) return reject('contractor_source_missing');
  if (!consent || consent.ownerId !== authenticatedUserId || consent.projectId !== project.id ||
      consent.contractorId !== contractor.id || consent.granted !== true) return reject('specific_consent_required');
  if (consent.revoked === true || consent.used === true || !Number.isFinite(consent.expiresAt) ||
      consent.expiresAt <= now) return reject('consent_expired_or_used');
  const description = typeof project.publicDescription === 'string' ? project.publicDescription.trim() : '';
  if (!description || description.length > 1500) return reject('invalid_public_description');
  // Deliberate allowlist: never forward address, phone, email, household data or private attachments.
  return { ok: true, reason: null, payload: Object.freeze({
    projectId: project.id, contractorId: contractor.id, category: String(project.category || '').slice(0,80),
    publicDescription: description, consentId: consent.id
  }) };
}
