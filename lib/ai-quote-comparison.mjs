// Fail-closed quote comparison: no guessed totals or cross-customer data.
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const validAmount = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
export function prepareQuoteComparison(quotes, context) {
  if (!Array.isArray(quotes)) throw new TypeError('quotes must be an array');
  if (!nonempty(context?.userId) || !nonempty(context?.projectId)) throw new Error('authenticated project scope required');
  const accepted = [];
  const rejected = [];
  for (const quote of quotes) {
    const reasons = [];
    if (!quote || typeof quote !== 'object') { rejected.push({ reasons: ['invalid_quote'] }); continue; }
    if (quote.ownerId !== context.userId || quote.projectId !== context.projectId) reasons.push('scope_mismatch');
    if (!nonempty(quote.contractorId) || !nonempty(quote.documentId) || quote.sourceType !== 'contractor_document') reasons.push('unattributed_document');
    if (quote.confirmedByContractor !== true) reasons.push('not_contractor_confirmed');
    if (!validAmount(quote.totalPrice) || quote.currency !== 'DKK') reasons.push('invalid_total');
    if (typeof quote.vatIncluded !== 'boolean') reasons.push('vat_unknown');
    for (const field of ['scope', 'materials', 'warranty', 'validUntil']) {
      if (!nonempty(quote[field])) reasons.push(field + '_missing');
    }
    // Only compare offers covering exactly the same explicitly identified work.
    if (!nonempty(quote.scopeKey) || quote.scopeKey !== context.scopeKey) reasons.push('scope_not_comparable');
    if (reasons.length) {
      rejected.push({ quoteId: quote.id ?? null, reasons });
      continue;
    }
    accepted.push({
      quoteId: quote.id ?? null,
      contractorId: quote.contractorId,
      documentId: quote.documentId,
      totalPrice: quote.totalPrice,
      currency: 'DKK',
      vatIncluded: quote.vatIncluded,
      scope: quote.scope,
      materials: quote.materials,
      warranty: quote.warranty,
      validUntil: quote.validUntil,
    });
  }
  // Prices inclusive and exclusive of VAT must not be sorted together.
  const vatModes = new Set(accepted.map(x => x.vatIncluded));
  if (vatModes.size > 1) return { comparable: false, offers: accepted, rejected, reason: 'mixed_vat_basis' };
  return {
    comparable: accepted.length >= 2,
    offers: accepted.sort((a, b) => a.totalPrice - b.totalPrice),
    rejected,
    reason: accepted.length >= 2 ? null : 'insufficient_verified_offers',
  };
}
