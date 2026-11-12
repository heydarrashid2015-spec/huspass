// Evidence-only normalization for contractor offers. No inferred or calculated totals.
export function assessOfferEvidence(offer) {
  if (!offer || typeof offer !== 'object') return { status: 'invalid', reasons: ['missing_offer'] };
  const reasons = [];
  const evidence = offer.priceEvidence;
  if (!evidence || typeof evidence !== 'object') reasons.push('missing_price_evidence');
  else {
    if (typeof evidence.sourceText !== 'string' || !evidence.sourceText.trim()) reasons.push('missing_source_text');
    if (!Number.isInteger(evidence.lineNumber) || evidence.lineNumber < 1) reasons.push('invalid_line_number');
    if (typeof evidence.amountDkk !== 'number' || !Number.isSafeInteger(evidence.amountDkk) || evidence.amountDkk <= 0) reasons.push('invalid_amount');
    if (evidence.currency !== 'DKK') reasons.push('unsupported_currency');
    if (!['included', 'excluded', 'unknown'].includes(evidence.vatStatus)) reasons.push('invalid_vat_status');
    // The extracted figure must be explicitly present in the cited source line.
    // Allow Danish thousand separators and decimal comma, but no computed totals.
    if (typeof evidence.sourceText === 'string' && Number.isSafeInteger(evidence.amountDkk) && evidence.amountDkk > 0) {
      const matches = [...evidence.sourceText.matchAll(/(?:^|[^\\d])([1-9]\\d{0,2}(?:[. ]\\d{3})+|[1-9]\\d*)(?:,00)?(?=$|[^\\d])/g)];
      const explicit = matches.some(m => Number(m[1].replace(/[. ]/g, '')) === evidence.amountDkk);
      if (!explicit) reasons.push('amount_not_in_source');
    }
  }
  if (typeof offer.projectId !== 'string' || !offer.projectId.trim()) reasons.push('missing_project');
  if (typeof offer.ownerId !== 'string' || !offer.ownerId.trim()) reasons.push('missing_owner');
  if (typeof offer.contractorCvr !== 'string' || !/^\\d{8}$/.test(offer.contractorCvr)) reasons.push('invalid_cvr_format');
  return { status: reasons.length ? 'invalid' : 'evidence_present', reasons, vatComparable: reasons.length === 0 && evidence.vatStatus !== 'unknown' };
}

export function compareOfferEvidence(offers, expectedOwnerId, expectedProjectId) {
  if (!Array.isArray(offers) || !expectedOwnerId || !expectedProjectId) return { comparable: false, reasons: ['invalid_context'], offers: [] };
  const reviewed = offers.map(offer => {
    const assessment = assessOfferEvidence(offer);
    const reasons = [...assessment.reasons];
    if (offer?.ownerId !== expectedOwnerId || offer?.projectId !== expectedProjectId) reasons.push('scope_mismatch');
    return { contractorCvr: offer?.contractorCvr ?? null, status: reasons.length ? 'invalid' : assessment.status, reasons };
  });
  const reasons = [];
  if (reviewed.length < 2) reasons.push('insufficient_offers');
  if (reviewed.some(x => x.status !== 'evidence_present')) reasons.push('invalid_offer');
  const valid = offers.filter((_, i) => reviewed[i].status === 'evidence_present');
  if (valid.some(x => x.priceEvidence.vatStatus === 'unknown') || new Set(valid.map(x => x.priceEvidence.vatStatus)).size > 1) reasons.push('vat_not_comparable');
  return { comparable: reasons.length === 0, reasons, offers: reviewed };
}
