// Extract only explicitly written Danish kroner amounts from contractor text.
// No inferred VAT, scope, or totals; this is not an acceptance or dispatch path.
export function extractQuotePriceEvidence(input) {
  if (typeof input !== 'string' || input.length > 50000) return [];
  const results = [];
  const re = /(?:^|[^\p{L}\p{N}])((?:\d{1,3}(?:[. ]\d{3})+|\d+)(?:,\d{1,2})?)\s*(kr\.?|dkk)\b/giu;
  for (const match of input.matchAll(re)) {
    const raw = match[1];
    const start = match.index + match[0].indexOf(raw);
    if (start > 0 && input[start - 1] === '-') continue;
    const amount = Number(raw.replace(/[. ]/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) continue;
    const end = start + match[0].length - match[0].indexOf(raw);
    const context = input.slice(Math.max(0, start - 70), Math.min(input.length, end + 70));
    const before = input.slice(Math.max(0, start - 35), start).toLocaleLowerCase('da-DK');
    const after = input.slice(end, Math.min(input.length, end + 24)).toLocaleLowerCase('da-DK');
    const vatContext = before + ' ' + after;
    const includesVat = /(?:inkl\.?|inklusive)\s*(?:25\s*%\s*)?moms|med\s+moms/u.test(vatContext);
    const excludesVat = /(?:ekskl\.?|excl\.?|eksklusive)\s*(?:25\s*%\s*)?moms|uden\s+moms/u.test(vatContext);
    results.push({
      amountDkk: amount,
      currency: 'DKK',
      originalText: match[0].trim(),
      start,
      end,
      context,
      vatStatus: includesVat && !excludesVat ? 'included' : excludesVat && !includesVat ? 'excluded' : 'unknown',
      isTotal: /(?:samlet|total|i alt|tilbudssum)\s*:?\s*$/u.test(before.trim()),
      source: 'contractor_text'
    });
  }
  return results;
}
