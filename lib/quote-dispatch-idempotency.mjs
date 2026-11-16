// Pure dispatch eligibility check; never performs network I/O.
// The caller MUST authenticate on the server, verify RLS ownership and atomically
// reserve (ownerId, projectId, consentId, recipientId) in persistent storage.
import { assessContractorContact } from './quote-contact-consent.mjs';
const id = v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
export function assessQuoteDispatch({actorId, ownerId, projectId, consent, contractorIds, now, reservation}) {
  const preflight = assessContractorContact({actorId,ownerId,projectId,consent,contractorIds,now});
  const reasons = [...preflight.reasons];
  if (!id(consent?.id)) reasons.push('invalid_consent_id');
  if (!reservation || reservation.atomic !== true || reservation.persisted !== true ||
      reservation.ownerId !== ownerId || reservation.projectId !== projectId ||
      reservation.consentId !== consent?.id ||
      !Array.isArray(reservation.recipientIds) ||
      reservation.recipientIds.length !== contractorIds?.length ||
      reservation.recipientIds.some(x => !id(x)) ||
      new Set(reservation.recipientIds).size !== reservation.recipientIds.length ||
      contractorIds?.some(x => !reservation.recipientIds.includes(x))) reasons.push('missing_atomic_reservation');
  if (reservation?.revoked === true) reasons.push('consent_revoked');
  if (reservation?.alreadyDispatched === true) reasons.push('already_dispatched');
  return Object.freeze({allowed:reasons.length===0,reasons:Object.freeze(reasons)});
}
