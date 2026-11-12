// Conservative Danish contractor quote total extraction. This is evidence, not verification.
// Caller MUST enforce authenticated document ownership and immutable source hashes server-side.
export function extractExplicitQuoteTotal(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 200000)
    return { status: 'unavailable', candidates: [] };
  const candidates = [];
  const lines = text.split(/\r?\n/);
  const label = /\b(?:i alt|total(?:beløb)?|samlet pris|tilbudspris)\b/i;
  const amount = /(?:kr\.?\s*|DKK\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)|\b(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:kr\.?|DKK)\b/gi;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!label.test(line) || /\b(?:subtotal|delsum|ekskl\.?)\s*(?:moms)?\b/i.test(line) && !/\binkl\.?\s*moms\b/i.test(line)) continue;
    const matches = [...line.matchAll(amount)];
    if (matches.length !== 1) continue;
    const raw = matches[0][1] ?? matches[0][2];
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const value = Number(normalized);
    if (!Number.isSafeInteger(Math.round(value * 100)) || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7 || value <= 0) continue;
    const vat = /\b(?:inkl\.?|med)\s*moms\b/i.test(line) ? 'included'
      : /\b(?:ekskl\.?|uden)\s*moms\b/i.test(line) ? 'excluded' : 'unknown';
    candidates.push({ lineNumber: i + 1, sourceLine: line, totalDkk: value, currency: 'DKK', vat });
  }
  // Multiple plausible totals are ambiguous even when numerically identical.
  if (candidates.length !== 1) return { status: candidates.length ? 'ambiguous' : 'unavailable', candidates };
  return { status: 'extracted_unverified', candidates };
}
