// Pure outbound request plan: no network calls and no client-supplied authorization.
// A server must load consent from private storage and derive ownerId from auth.
import { authorizeTimeBoundContractorContact } from './contractor-consent-validity.mjs';
const own = (o,k) => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined;
  const d = Object.getOwnPropertyDescriptor(o,k);
  return d && Object.hasOwn(d,'value') ? d.value : undefined;
};
const fail = reason => Object.freeze({ allowed:false, reason });
export function planContractorQuoteRequest({ authenticatedOwnerId, project, contractor, consent, now, message } = {}) {
  const ownerId = authenticatedOwnerId;
  const projectId = own(project,'id');
  const contractorCvr = own(contractor,'cvr');
  if (own(project,'ownerId') !== ownerId || !ownerId || !projectId)
    return fail('project_not_owned');
  if (own(contractor,'verified') !== true || typeof own(contractor,'evidenceUrl') !== 'string' ||
      !/^https:\/\/datacvr\.virk\.dk\//.test(own(contractor,'evidenceUrl')))
    return fail('contractor_not_verified');
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 3000)
    return fail('invalid_request_text');
  const decision = authorizeTimeBoundContractorContact({ ownerId, projectId, contractorCvr, consent, now });
  if (!decision.allowed) return decision;
  return Object.freeze({ allowed:true, reason:'eligible_for_server_side_dispatch',
    request:Object.freeze({ projectId, contractorCvr, message:message.trim() }) });
}
