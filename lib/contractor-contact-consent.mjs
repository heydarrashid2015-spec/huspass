// Pure, fail-closed consent gate. Caller must authenticate the owner and persist
// consent server-side before any outbound contractor contact. Never dispatch here.
const own = (obj, key) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
};
export function authorizeContractorContact({ consent, ownerId, projectId, contractorCvr, now } = {}) {
  const fail = (reason) => Object.freeze({ allowed: false, reason });
  if (![ownerId, projectId].every(v => typeof v === 'string' && v.trim().length > 0))
    return fail('missing_identity');
  if (typeof contractorCvr !== 'string' || !/^[0-9]{8}$/.test(contractorCvr))
    return fail('invalid_cvr');
  if (!Number.isSafeInteger(now) || now <= 0) return fail('invalid_time');
  if (own(consent, 'status') !== 'approved') return fail('consent_not_approved');
  if (own(consent, 'ownerId') !== ownerId || own(consent, 'projectId') !== projectId ||
      own(consent, 'contractorCvr') !== contractorCvr) return fail('consent_scope_mismatch');
  const grantedAt = own(consent, 'grantedAt');
  const expiresAt = own(consent, 'expiresAt');
  if (!Number.isSafeInteger(grantedAt) || !Number.isSafeInteger(expiresAt) ||
      grantedAt > now || expiresAt <= now || expiresAt <= grantedAt)
    return fail('consent_expired_or_invalid');
  return Object.freeze({ allowed: true, reason: 'approved_for_specific_contractor' });
}
