// Pure, fail-closed consent gate. No outbound requests are sent by this module.
// The authenticated API must derive actorId from a verified session, never request JSON.
export function authorizeContractorOutreach({ actorId, project, consent, contractor } = {}) {
  const fail = (reason) => ({ allowed: false, reason });
  if (typeof actorId !== 'string' || !actorId.trim()) return fail('unauthenticated');
  if (!project || typeof project !== 'object' || project.ownerId !== actorId || !project.id) return fail('project_access_denied');
  if (!contractor || !/^\\d{8}$/.test(String(contractor.cvr ?? '')) || !contractor.id) return fail('contractor_unverified');
  if (!consent || typeof consent !== 'object' || consent.ownerId !== actorId ||
      consent.projectId !== project.id || consent.contractorId !== contractor.id ||
      consent.action !== 'request_quote' || consent.granted !== true ||
      typeof consent.grantedAt !== 'string') return fail('explicit_consent_required');
  const grantedAt = Date.parse(consent.grantedAt);
  if (!Number.isFinite(grantedAt) || new Date(grantedAt).toISOString() !== consent.grantedAt ||
      grantedAt > Date.now() || Date.now() - grantedAt > 30 * 86400000) return fail('consent_expired_or_invalid');
  if (consent.revoked === true) return fail('consent_revoked');
  return { allowed: true, reason: 'consent_verified' };
}
