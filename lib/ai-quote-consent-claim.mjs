import { prepareQuoteRequest } from './ai-quote-request-preflight.mjs';

// Server orchestration contract: all reads and the one-time consent claim must be
// implemented with authenticated, owner-scoped database operations.
// This does NOT send messages or substitute for a transactional DB implementation.
export async function claimQuoteRequest({ authenticatedUserId, projectId, contractorId, consentId, store, now = Date.now() }) {
  const reject = reason => ({ ok: false, reason, payload: null });
  if (typeof authenticatedUserId !== 'string' || !authenticatedUserId ||
      typeof projectId !== 'string' || !projectId ||
      typeof contractorId !== 'string' || !contractorId ||
      typeof consentId !== 'string' || !consentId) return reject('invalid_identity');
  if (!store || typeof store.getOwnedProject !== 'function' ||
      typeof store.getContractor !== 'function' || typeof store.getConsent !== 'function' ||
      typeof store.consumeConsentOnce !== 'function') return reject('secure_store_required');

  // Do not trust project/owner/consent objects supplied by the client.
  const project = await store.getOwnedProject({ ownerId: authenticatedUserId, projectId });
  if (!project) return reject('project_not_found_or_forbidden');
  const contractor = await store.getContractor({ contractorId });
  const consent = await store.getConsent({ ownerId: authenticatedUserId, consentId });
  const preflight = prepareQuoteRequest({ project, contractor, consent, authenticatedUserId, now });
  if (!preflight.ok || consent.id !== consentId) return reject(preflight.reason || 'consent_mismatch');

  // Database implementation MUST atomically check owner/project/contractor/expiry,
  // revoked=false, used=false and mark used=true in one transaction.
  // Return false if another request consumed it first; never send on failure.
  const claimed = await store.consumeConsentOnce({
    ownerId: authenticatedUserId, projectId, contractorId, consentId, now
  });
  if (claimed !== true) return reject('consent_already_consumed_or_revoked');
  return { ok: true, reason: null, payload: preflight.payload };
}
