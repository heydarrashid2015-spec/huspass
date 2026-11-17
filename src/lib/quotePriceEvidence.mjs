// Extract only explicitly written Danish kroner amounts from contractor text.
// No inferred VAT, scope, or totals; this is not an acceptance or dispatch path.
export function extractQuotePriceEvidence(input) {
  if (typeof input !== 'string' || input.length > 50000) return [];
  const results = [];
  const re = /(?:^|[^\p{L}\p{N}])((?:\d{1,3}(?:[. \u00a0\u202f]\d{3})+|\d+)(?:,\d{1,2})?)\s*(kr\.?|dkk)\b/giu;
  for (const match of input.matchAll(re)) {
    const raw = match[1];
    const start = match.index + match[0].indexOf(raw);
    // Do not extract a numeric suffix from malformed decimal/thousands text.
    // For example, '12.34 kr' must not become a fabricated '34 kr' quote.
    if (start > 0 && /[\d.,]/u.test(input[start - 1])) continue;
    // A malformed spaced number must not yield a truncated suffix.
    if (/\d[ \u00a0\u202f]+$/u.test(input.slice(Math.max(0, start - 16), start))) continue;
    // A negative amount is not a valid contractor quote. Check the complete
    // prefix, including whitespace and common Unicode minus signs, rather
    // than only the character immediately before the digits.
    const lineStartForSign = input.lastIndexOf('\n', start - 1) + 1;
    const prefix = input.slice(lineStartForSign, start);
    if (/[\-\u2212\u2013\u2014]\s*$/u.test(prefix)) continue;
    // Parenthesized currency amounts can denote deductions; never treat them as quotes.
    const currencyEnd = start + match[0].length - match[0].indexOf(raw);
    if (/\(\s*$/u.test(prefix) && /^\s*\)/u.test(input.slice(currencyEnd))) continue;
    const amount = Number(raw.replace(/[. \u00a0\u202f]/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) continue;
    const end = start + match[0].length - match[0].indexOf(raw);
    const context = input.slice(Math.max(0, start - 70), Math.min(input.length, end + 70));
    const lineStart = input.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = input.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? input.length : nextBreak;
    const before = input.slice(Math.max(lineStart, start - 35), start).toLocaleLowerCase('da-DK');
    const after = input.slice(end, Math.min(lineEnd, end + 24)).toLocaleLowerCase('da-DK');
    // VAT evidence is ambiguous when more than one price occurs on a line.
    const lineText = input.slice(lineStart, lineEnd);
    const amountsOnLine = [...lineText.matchAll(/(?:\d{1,3}(?:[. \u00a0\u202f]\d{3})+|\d+)(?:,\d{1,2})?\s*(?:kr\.?|dkk)\b/giu)].length;
    const vatContext = amountsOnLine === 1 ? before + ' ' + after : '';
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
      isTotal: amountsOnLine === 1 && /(?:samlet|total|i alt|tilbudssum)\s*:?\s*$/u.test(before.trim()),
      source: 'contractor_text'
    });
  }
  return results;
}
