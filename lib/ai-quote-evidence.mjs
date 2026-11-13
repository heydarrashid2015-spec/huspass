// Pure validation boundary for contractor quote evidence; no network or messaging side effects.
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(d => own(d, 'value'));
}
export function validateQuoteEvidence(quote, { ownerId, projectId } = {}) {
  const errors = [];
  if (!record(quote)) return { accepted: false, errors: ['invalid_record'], price: null };
  const required = ['ownerId', 'projectId', 'contractorId', 'documentId', 'sourceType', 'currency', 'totalPrice'];
  for (const field of required) if (!own(quote, field)) errors.push('missing_' + field);
  for (const field of required) if (own(quote, field) && typeof quote[field] === 'string' && !quote[field].trim()) errors.push('empty_' + field);
  if (!ownerId || !projectId || quote.ownerId !== ownerId || quote.projectId !== projectId) errors.push('scope_mismatch');
  if (quote.sourceType !== 'contractor_document') errors.push('unverified_source');
  if (quote.currency !== 'DKK') errors.push('unsupported_currency');
  // Explicit decimal amounts only; Number(null), Number(''), Number('1e5') must not create prices.
  const raw = quote.totalPrice;
  const validAmount = (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) ||
    (typeof raw === 'string' && /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(raw));
  if (!validAmount) errors.push('invalid_price');
  const price = validAmount ? Number(raw) : null;
  return { accepted: errors.length === 0, errors, price: errors.length === 0 ? price : null };
}
