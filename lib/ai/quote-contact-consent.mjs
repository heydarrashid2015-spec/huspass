// Pure, fail-closed preflight. This does not send messages or grant authorization.
// Server must derive actorId from a verified session and verify project ownership.
export function assessContractorContact({ actorId, ownerId, projectId, consent, contractorIds, now }) {
  const reasons = [];
  const validId = (v) => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
  if (!validId(actorId) || !validId(ownerId) || actorId !== ownerId) reasons.push('owner_not_verified');
  if (!validId(projectId)) reasons.push('invalid_project');
  if (!consent || consent.projectId !== projectId || consent.actorId !== actorId ||
      consent.purpose !== 'contractor_quote_request' || consent.granted !== true) reasons.push('consent_missing');
  const time = typeof now === 'number' && Number.isFinite(now) ? now : NaN;
  if (!Number.isFinite(time) || !Number.isSafeInteger(time) ||
      !Number.isSafeInteger(consent?.grantedAt) || consent.grantedAt > time ||
      !Number.isSafeInteger(consent?.expiresAt) || consent.expiresAt <= time) reasons.push('consent_expired_or_invalid');
  if (!Array.isArray(contractorIds) || contractorIds.length < 1 || contractorIds.length > 3 ||
      contractorIds.some((id) => !validId(id)) ||
      new Set(contractorIds).size !== contractorIds.length) reasons.push('invalid_recipients');
  if (!Array.isArray(consent?.contractorIds) ||
      contractorIds?.some?.((id) => !consent.contractorIds.includes(id)) ||
      new Set(consent?.contractorIds || []).size !== consent?.contractorIds?.length) reasons.push('recipients_not_consented');
  return Object.freeze({ allowed: reasons.length === 0, reasons: Object.freeze(reasons) });
}
