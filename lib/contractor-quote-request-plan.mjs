// Pure outbound request plan: no network calls and no client-supplied authorization.
// A server must load consent from private storage and derive ownerId from auth.
import { authorizeTimeBoundContractorContact } from './contractor-consent-validity.mjs';
const own = (o,k) => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined;
  const d = Object.getOwnPropertyDescriptor(o,k);
  return d && Object.hasOwn(d,'value') ? d.value : undefined;
};
// A link to a different CVR must never authorize contacting this contractor.
function isMatchingOfficialCvrEvidence(value, cvr) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'datacvr.virk.dk' &&
      !url.username && !url.password && !url.port && !url.search && !url.hash &&
      url.pathname === '/enhed/virksomhed/' + cvr;
  } catch { return false; }
}
const fail = reason => Object.freeze({ allowed:false, reason });
export function planContractorQuoteRequest({ authenticatedOwnerId, project, contractor, consent, now, message } = {}) {
  const ownerId = authenticatedOwnerId;
  const projectId = own(project,'id');
  const contractorCvr = own(contractor,'cvr');
  if (typeof ownerId !== 'string' || !ownerId.trim() || typeof projectId !== 'string' || !projectId.trim() ||
      own(project,'ownerId') !== ownerId)
    return fail('project_not_owned');
  if (own(contractor,'verified') !== true || typeof contractorCvr !== 'string' ||
      !/^[0-9]{8}$/.test(contractorCvr) || typeof own(contractor,'evidenceUrl') !== 'string' ||
      !isMatchingOfficialCvrEvidence(own(contractor,'evidenceUrl'), contractorCvr))
    return fail('contractor_not_verified');
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 3000)
    return fail('invalid_request_text');
  const decision = authorizeTimeBoundContractorContact({ ownerId, projectId, contractorCvr, consent, now });
  if (!decision.allowed) return decision;
  return Object.freeze({ allowed:true, reason:'eligible_for_server_side_dispatch',
    request:Object.freeze({ projectId, contractorCvr, message:message.trim() }) });
}
