// Pure evidence-span validation. No customer data, outbound messaging or database access.
export function validateQuotedPriceSpan(source, evidence) {
  if (typeof source !== 'string' || source.length > 100_000 || !evidence ||
      typeof evidence !== 'object' || Array.isArray(evidence)) return null;
  const { start, end, literal } = evidence;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 0 || end <= start || end > source.length ||
      typeof literal !== 'string' || literal.length === 0 || literal.length > 128) return null;
  if (source.slice(start, end) !== literal) return null;
  // Prevent partial matches inside longer amounts, IDs and adjacent currency tokens.
  const before = start ? source[start - 1] : '';
  const after = end < source.length ? source[end] : '';
  if (/[0-9.,]/u.test(before) || /[0-9.,]/u.test(after)) return null;
  // Evidence must be an explicit DKK amount, not an unlabelled dimension or identifier.
  const match = /^(?:(?:[1-9]\\d{0,2}(?:\\.\\d{3})+)|(?:0|[1-9]\\d*))(?:,\\d{2})?\\s*(?:kr\\.|kr|DKK)$/iu.exec(literal);
  if (!match) return null;
  const amount = literal.replace(/\\s*(?:kr\\.|kr|DKK)$/iu, '');
  const [whole, fraction = '00'] = amount.split(',');
  const digits = whole.replaceAll('.', '');
  if (!/^\\d+$/u.test(digits)) return null;
  const ore = BigInt(digits) * 100n + BigInt(fraction);
  return Object.freeze({ literal, start, end, ore: ore.toString() });
}
