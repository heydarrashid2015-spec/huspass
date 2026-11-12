import { qualifyQuoteTotal } from './quote-total-qualification.mjs';

// Document text is untrusted. This gate never verifies ownership or contractor identity.
// A nearby qualification can invalidate a seemingly explicit total on another line.
const NON_FIRM = /\b(?:vejledende|uforbindende|ikke\s+bindende|forel[oø]big|estimat|overslag|ansl[aå]et|cirka|ca\.|omkring|fra\s+\d|op\s+til\s+\d|prisen\s+kan\s+[aæ]ndres|pris\s+afh[aæ]nger\s+af|med\s+forbehold|forbehold\s+for|eksklusive\s+materialer|materialer\s+afregnes\s+s[aæ]rskilt)\b/i;

export function qualifyQuoteWithContext(text) {
  const parsed = qualifyQuoteTotal(text);
  if (parsed.status !== 'extracted_unverified') return parsed;
  const candidate = parsed.candidates[0];
  const lines = text.split(/\r?\n/);
  const index = candidate.lineNumber - 1;
  // Only adjacent lines: a disclaimer in another section may refer to a different item.
  const start = Math.max(0, index - 2);
  const end = Math.min(lines.length, index + 3);
  const context = lines.slice(start, end).join(' ');
  if (NON_FIRM.test(context)) {
    return { status: 'unavailable', candidates: [], reason: 'nearby_non_firm_terms' };
  }
  return parsed;
}
