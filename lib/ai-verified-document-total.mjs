import { extractContractorTotal } from './ai-quote-total-text.mjs';
import { validateQuoteEvidence } from './ai-quote-evidence.mjs';

// Pure boundary: caller must load the private document through authenticated, RLS-protected storage.
// Never trust owner/project IDs supplied by the client as proof of ownership.
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function plain(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  const p = Object.getPrototypeOf(o);
  return (p === Object.prototype || p === null) &&
    Object.values(Object.getOwnPropertyDescriptors(o)).every(d => own(d, 'value'));
}
export function bindContractorDocumentTotal({ quote, document, text, authenticatedOwnerId, authorizedProjectId } = {}) {
  const reject = reason => ({ accepted: false, reason, verifiedPrice: null });
  if (!plain(quote) || !plain(document)) return reject('invalid_record');
  if (typeof authenticatedOwnerId !== 'string' || !authenticatedOwnerId.trim() ||
      typeof authorizedProjectId !== 'string' || !authorizedProjectId.trim()) return reject('missing_server_scope');
  if (document.ownerId !== authenticatedOwnerId || document.projectId !== authorizedProjectId ||
      quote.ownerId !== authenticatedOwnerId || quote.projectId !== authorizedProjectId ||
      typeof document.id !== 'string' || !document.id ||
      quote.documentId !== document.id || document.contractorId !== quote.contractorId ||
      document.sourceType !== 'contractor_document') return reject('document_scope_mismatch');
  const extracted = extractContractorTotal(text);
  if (extracted.status !== 'found') return reject('total_' + extracted.status);
  if (extracted.vat === 'unspecified') return reject('vat_unspecified');
  if (quote.vatIncluded !== (extracted.vat === 'included')) return reject('vat_mismatch');
  // The only accepted price is the amount actually evidenced in the contractor document.
  if (quote.totalPrice !== extracted.price) return reject('price_mismatch');
  const checked = validateQuoteEvidence(quote, { ownerId: authenticatedOwnerId, projectId: authorizedProjectId });
  if (!checked.accepted) return reject('invalid_quote_evidence');
  return { accepted: true, reason: null, verifiedPrice: extracted.price,
    currency: 'DKK', vatIncluded: extracted.vat === 'included', evidence: extracted.evidence,
    documentId: document.id };
}
