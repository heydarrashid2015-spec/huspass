import { extractExplicitQuoteTotal } from './quote-total-extraction.mjs';

// A parsed number is never an accepted contractor offer without document ownership checks.
export function qualifyQuoteTotal(text) {
  const parsed = extractExplicitQuoteTotal(text);
  if (parsed.status !== 'extracted_unverified') return parsed;
  const candidate = parsed.candidates[0];
  const line = candidate.sourceLine;
  // Do not turn estimates, minimum prices, ranges or negative amounts into firm totals.
  const uncertain = /\b(?:fra|cirka|ca\.?|omkring|anslået|estimat|overslag|vejledende|forventet|op til|minimum|mindst|maks(?:imum)?|pr\.?\s*(?:time|m2|m²|stk))\b/i;
  const range = /\d\s*(?:-|–|—|til)\s*\d/i;
  const negative = /(?:^|\s)-\s*(?:DKK|kr\.?|\d)/i;
  if (uncertain.test(line) || range.test(line) || negative.test(line)) {
    return { status: 'unavailable', candidates: [], reason: 'non_firm_price' };
  }
  return parsed;
}
