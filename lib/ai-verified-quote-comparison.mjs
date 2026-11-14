// Compare only server-verified contractor quotes; never infer missing VAT, materials or warranty.
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const plain = o => !!o && typeof o === 'object' && !Array.isArray(o) &&
  (Object.getPrototypeOf(o) === Object.prototype || Object.getPrototypeOf(o) === null) &&
  Object.values(Object.getOwnPropertyDescriptors(o)).every(d => own(d, 'value'));
const validText = s => typeof s === 'string' && s.trim().length > 0;
// Convert to integer øre before comparison; binary floating point cannot represent all decimal cents exactly.
// Reject values with fractional øre and totals beyond the safe integer range.
const toOre = n => {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  const scaled = n * 100;
  const rounded = Math.round(scaled);
  return Number.isSafeInteger(rounded) && Math.abs(scaled - rounded) <= 1e-8 ? rounded : null;
};
const reject = reason => ({ accepted: false, reason, comparisons: [] });

export function compareVerifiedContractorQuotes({ quotes, authenticatedOwnerId, authorizedProjectId } = {}) {
  if (!validText(authenticatedOwnerId) || !validText(authorizedProjectId) ||
      !Array.isArray(quotes) || quotes.length < 2 || quotes.length > 3) return reject('invalid_comparison_request');
  const seen = new Set();
  const comparisons = [];
  for (const q of quotes) {
    if (!plain(q) || !validText(q.id) || seen.has(q.id) ||
        q.ownerId !== authenticatedOwnerId || q.projectId !== authorizedProjectId ||
        q.privateDocumentVerified !== true || q.sourceType !== 'contractor_document' ||
        !validText(q.documentId) || !validText(q.contractorId) ||
        q.currency !== 'DKK' || toOre(q.totalPrice) === null ||
        (q.vatIncluded !== true && q.vatIncluded !== false)) return reject('unverified_or_cross_account_quote');
    seen.add(q.id);
    // Null means not documented; never convert an absent field into an affirmative claim.
    for (const field of ['materials', 'warranty', 'scope']) {
      if (own(q, field) && q[field] !== null && !validText(q[field])) return reject('invalid_quote_evidence');
    }
    comparisons.push({
      quoteId: q.id, contractorId: q.contractorId, documentId: q.documentId,
      totalPrice: toOre(q.totalPrice) / 100, currency: 'DKK', vatIncluded: q.vatIncluded,
      materials: own(q, 'materials') ? q.materials : null,
      warranty: own(q, 'warranty') ? q.warranty : null,
      scope: own(q, 'scope') ? q.scope : null
    });
  }
  // VAT-included and VAT-excluded totals cannot be fairly ranked against each other.
  if (new Set(comparisons.map(q => q.vatIncluded)).size !== 1)
    return reject('incomparable_vat_basis');
  comparisons.sort((a, b) => toOre(a.totalPrice) - toOre(b.totalPrice) || a.quoteId.localeCompare(b.quoteId));
  return { accepted: true, reason: null, comparisons };
}
