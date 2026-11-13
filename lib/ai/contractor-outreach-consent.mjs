// Pure, fail-closed consent gate. No outbound requests are sent by this module.
// The authenticated API must derive actorId from a verified session, never request JSON.
export function authorizeContractorOutreach({ actorId, project, consent, contractor } = {}) {
  const fail = (reason) => ({ allowed: false, reason });
  if (typeof actorId !== 'string' || !actorId.trim()) return fail('unauthenticated');
  if (!project || typeof project !== 'object' || Array.isArray(project) ||
      !Object.hasOwn(project, 'ownerId') || !Object.hasOwn(project, 'id') ||
      project.ownerId !== actorId || typeof project.id !== 'string' || !project.id.trim()) return fail('project_access_denied');
  // The caller must supply an explicitly loaded contractor record, not prototype defaults.
  if (!contractor || typeof contractor !== 'object' || Array.isArray(contractor) ||
      !Object.hasOwn(contractor, 'id') || !Object.hasOwn(contractor, 'cvr') ||
      typeof contractor.cvr !== 'string' || !/^\d{8}$/.test(contractor.cvr) ||
      typeof contractor.id !== 'string' || !contractor.id.trim()) return fail('contractor_unverified');
  // Consent evidence must be explicit record fields, never inherited from a prototype.
  if (!consent || typeof consent !== 'object' || Array.isArray(consent) ||
      !['ownerId', 'projectId', 'contractorId', 'action', 'granted', 'grantedAt'].every((key) => Object.hasOwn(consent, key))) return fail('explicit_consent_required');
  if (consent.ownerId !== actorId ||
      consent.projectId !== project.id || consent.contractorId !== contractor.id ||
      consent.action !== 'request_quote' || consent.granted !== true ||
      typeof consent.grantedAt !== 'string') return fail('explicit_consent_required');
  const grantedAt = Date.parse(consent.grantedAt);
  if (!Number.isFinite(grantedAt) || new Date(grantedAt).toISOString() !== consent.grantedAt ||
      grantedAt > Date.now() || Date.now() - grantedAt > 30 * 86400000) return fail('consent_expired_or_invalid');
  // Unknown revocation states are not proof of active consent.
  // A missing flag is supported for legacy grants; explicit values must be false.
  // Inherited revocation markers are ambiguous and must never be silently ignored.
  if ('revoked' in consent && !Object.hasOwn(consent, 'revoked')) return fail('consent_revoked');
  if ('revokedAt' in consent && !Object.hasOwn(consent, 'revokedAt')) return fail('consent_revoked');
  if (Object.hasOwn(consent, 'revoked') && consent.revoked !== false) return fail('consent_revoked');
  // A recorded revocation timestamp overrides stale or missing boolean flags.
  if (Object.hasOwn(consent, 'revokedAt') && consent.revokedAt !== null) return fail('consent_revoked');
  return { allowed: true, reason: 'consent_verified' };
}
