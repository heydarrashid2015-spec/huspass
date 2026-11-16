// Deterministic extraction from contractor-supplied text. Never estimates missing amounts.
// The caller must separately authorize access to the private source document.
const AMOUNT = '(?:[1-9]\\d{0,8}|[1-9]\\d{0,2}(?:\\.\\d{3}){1,3}|0)(?:,\\d{2})?';
const LINE = new RegExp('^\\s*(?:samlet\\s+pris|total(?:beløb)?|i\\s+alt)\\s*:?\\s*(?:kr\\.?\\s*)?(' + AMOUNT + ')\\s*(?:kr\\.?|dkk)?\\s*(?:(inkl\\.?\\s*moms|ekskl\\.?\\s*moms))?\\s*$', 'i');
function parseAmount(raw) {
  const normalized = raw.replace(/\\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isSafeInteger(Math.round(value * 100)) && value >= 0 ? value : null;
}
export function extractContractorTotal(text) {
  if (typeof text !== 'string' || text.length > 100000) return { status: 'invalid_document', price: null };
  const matches = [];
  for (const line of text.split(/\\r?\\n/)) {
    const m = LINE.exec(line);
    if (m) matches.push({ price: parseAmount(m[1]), vat: m[2] ? (/^inkl/i.test(m[2]) ? 'included' : 'excluded') : 'unspecified', evidence: line.trim() });
  }
  if (!matches.length) return { status: 'not_found', price: null };
  // Even identical repeated totals are ambiguous if VAT basis is different.
  if (matches.some(m => m.price === null) || matches.some(m => m.price !== matches[0].price || m.vat !== matches[0].vat)) {
    return { status: 'ambiguous', price: null };
  }
  return { status: 'found', price: matches[0].price, currency: 'DKK', vat: matches[0].vat, evidence: matches[0].evidence };
}
