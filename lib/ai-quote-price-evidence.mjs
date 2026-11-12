// Extract explicit DKK totals from contractor text without inferring missing terms.
// Candidates are evidence only; a human must confirm the quote and VAT treatment.
export function extractDkkTotalEvidence(text) {
  if (typeof text !== 'string' || text.length > 100000) throw new TypeError('quote text must be a string of at most 100000 characters');
  const results = [];
  const lines = text.split(/\r?\n/);
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    // Require an explicit total label and currency on the same line.
    if (!/\b(?:i alt|samlet pris|total(?:pris)?|tilbudspris)\b/i.test(line)) continue;
    const matches = [...line.matchAll(/(?:\bDKK\s*|\bkr\.?\s*)(\d{1,3}(?:[. ]\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)|\b(\d{1,3}(?:[. ]\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\s*(?:DKK|kr\.?)(?!\w)/gi)];
    if (matches.length !== 1) continue; // Ambiguous lines require manual review.
    const raw = matches[0][1] || matches[0][2];
    const normalized = raw.replace(/[. ]/g, '').replace(',', '.');
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) continue;
    const vat = /\b(?:inkl\.?|inklusive)\s*(?:moms|25\s*%\s*moms)\b/i.test(line) ? 'included'
      : /\b(?:ekskl\.?|eksklusive|excl\.?)\s*moms\b/i.test(line) ? 'excluded' : 'unknown';
    results.push({ amount, currency: 'DKK', vat, evidence: { line: lineNumber + 1, excerpt: line.trim().slice(0, 500) }, verified: false });
  }
  return results;
}
