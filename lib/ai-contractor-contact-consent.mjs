// Pure authorization gate for preparing contractor contact requests.
// This module NEVER sends mail or shares customer details itself.
export function prepareContractorContact({ consent, project, contractor, now = new Date().toISOString() } = {}) {
  const own = (obj, key) => obj && typeof obj === 'object' && Object.hasOwn(obj, key) ? obj[key] : undefined;
  const deny = (reason) => ({ allowed: false, reason, payload: null });
  if (!consent || own(consent, 'approved') !== true || own(consent, 'purpose') !== 'contractor_quote_request')
    return deny('explicit_consent_required');
  const customerId = own(project, 'customerId');
  if (typeof customerId !== 'string' || !customerId.trim() ||
      own(consent, 'customerId') !== customerId) return deny('customer_mismatch');
  const projectId = own(project, 'id');
  if (typeof projectId !== 'string' || !projectId.trim() ||
      own(consent, 'projectId') !== projectId) return deny('project_mismatch');
  const cvr = own(contractor, 'cvr');
  if (typeof cvr !== 'string' || !/^\d{8}$/.test(cvr) ||
      own(contractor, 'cvrVerified') !== true ||
      !Array.isArray(own(consent, 'contractorCvrs')) ||
      !own(consent, 'contractorCvrs').includes(cvr)) return deny('contractor_not_authorized');
  const approvedAt = own(consent, 'approvedAt');
  const expiresAt = own(consent, 'expiresAt');
  const timestamp = Date.parse(now);
  if (typeof approvedAt !== 'string' || typeof expiresAt !== 'string' ||
      !Number.isFinite(timestamp) || !Number.isFinite(Date.parse(approvedAt)) ||
      !Number.isFinite(Date.parse(expiresAt)) ||
      timestamp < Date.parse(approvedAt) || timestamp >= Date.parse(expiresAt))
    return deny('consent_expired_or_invalid');
  const description = own(project, 'description');
  if (typeof description !== 'string' || !description.trim() || description.length > 3000)
    return deny('invalid_project_description');
  // Free-text fields may contain contact details even when explicit contact fields are omitted.
  // Fail closed; ask the customer to remove these before preparing a request.
  const category = own(project, 'category');
  const containsContact = (value) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) ||
    /(?:\+45[\s.-]*|(?:telefon|tlf|mobil|ring|phone)\s*:?\s*)(?:\d[\s.-]*){8}/i.test(value);
  if (containsContact(description) || (typeof category === 'string' && containsContact(category)))
    return deny('personal_contact_in_project_text');
  // Deliberately omit explicit address, phone, email, and other personal data.
  return { allowed: true, reason: null, payload: {
    projectId, contractorCvr: cvr, description: description.trim(),
    category: typeof own(project, 'category') === 'string' ? own(project, 'category') : ''
  }};
}
