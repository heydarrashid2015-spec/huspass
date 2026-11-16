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
  // Reject controls, Unicode line separators and bidirectional/invisible format controls.
  // These can disguise addresses or alter the appearance of outbound messages.
  const unsafeOutboundText = /[\x00-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202E\u2060\u2066-\u2069\uFEFF]/u;
  if (unsafeOutboundText.test(description)) return deny('unsafe_project_text');
  // Free-text fields may contain contact details even when explicit contact fields are omitted.
  // Fail closed; ask the customer to remove these before preparing a request.
  const category = own(project, 'category');
  const containsContact = (value) => {
    // Compatibility characters (fullwidth @, digits, dots) must not bypass PII detection.
    const normalized = value.normalize('NFKC');
    return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(normalized) ||
      /(?:\+45[\s.-]*|(?:telefon|tlf|mobil|ring|phone)\s*:?\s*)(?:\d[\s.-]*){8}/i.test(normalized) ||
      // Danish local numbers can be written without +45 or a phone label.
      // Match exactly eight digits with optional common separators, not measurements.
      /(?<![\d])(?:\d[ .-]?){7}\d(?![\d])/u.test(normalized);
  };
  if (typeof category !== 'string' || category.length > 100 ||
      unsafeOutboundText.test(category)) return deny('unsafe_project_category');
  // Never forward user-supplied URLs: query strings and paths can expose tokens, addresses or customer data.\n  // Contractors should receive the plain work scope, not unverified links.\n  const containsLink = (value) => /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:dk|com|net|org)\/)/iu.test(value.normalize('NFKC'));\n  if (containsLink(description) || containsLink(category))\n    return deny('unverified_link_in_project_text');\n  if (containsContact(description) || containsContact(category))
    return deny('personal_contact_in_project_text');
  // Deliberately omit explicit address, phone, email, and other personal data.
  return { allowed: true, reason: null, payload: {
    projectId, contractorCvr: cvr, description: description.trim(),
    category: typeof own(project, 'category') === 'string' ? own(project, 'category') : ''
  }};
}
