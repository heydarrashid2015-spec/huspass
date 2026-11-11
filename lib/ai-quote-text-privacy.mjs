// Fail-closed screening for common private identifiers before preparing contractor messages.
// Server-side authorization, consent and review are still required before any outbound request.
export function screenContractorDescription(value) {
  if (typeof value !== 'string') return { safe: false, reason: 'invalid_description' };
  const description = value.trim();
  if (description.length < 10 || description.length > 2000) return { safe: false, reason: 'invalid_length' };
  const patterns = [
    ['email_address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
    ['phone_number', /(?:\+45[\s.-]?)?(?:\d[\s.-]?){8}\b/],
    ['cpr_number', /\b\d{6}[- ]?\d{4}\b/],
    ['street_address', /\b(?:[\p{L}][\p{L}.'-]*\s+){1,4}(?:vej|gade|allé|alle|boulevard|stræde|plads|vænget)\s+\d+[a-z]?\b/iu],
  ];
  for (const [reason, pattern] of patterns) {
    if (pattern.test(description)) return { safe: false, reason };
  }
  return { safe: true, reason: null, description };
}
